import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type {
  UserSkill,
  CareerMatch,
  LearningPath,
  ChatMessage,
  SkillGap
} from '@/types';
import {
  sampleUserSkills,
  calculateCareerMatches,
  generateLearningPath,
  enrichUserSkills
} from '@/lib/mock-data';
import { api } from '@/lib/api';

interface AppContextType {
  // User skills
  userSkills: UserSkill[];
  setUserSkills: (skills: UserSkill[]) => void;
  updateSkill: (skillId: string, level: string, confidence: number) => void;

  // Career matches
  careerMatches: CareerMatch[];
  refreshCareerMatches: () => void;
  selectedCareer: CareerMatch | null;
  setSelectedCareer: (career: CareerMatch | null) => void;

  // Learning path
  learningPath: LearningPath | null;
  generatePath: (roleId: string) => void;
  markStepComplete: (stepId: string) => void;

  // Skill gaps
  allGaps: SkillGap[];

  // Chat
  chatMessages: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  clearChat: () => void;

  // UI state
  isAssessmentComplete: boolean;
  setIsAssessmentComplete: (complete: boolean) => void;

  // Theme
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // Loading states
  isLoadingSkills: boolean;
  isLoadingCareers: boolean;
  isLoadingLearning: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [userSkills, setUserSkillsState] = useState<UserSkill[]>(enrichUserSkills(sampleUserSkills));
  const [careerMatches, setCareerMatches] = useState<CareerMatch[]>(() => calculateCareerMatches(sampleUserSkills));
  const [selectedCareer, setSelectedCareer] = useState<CareerMatch | null>(null);
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAssessmentComplete, setIsAssessmentComplete] = useState(true);

  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  // Loading states
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  const [isLoadingCareers, setIsLoadingCareers] = useState(false);
  const [isLoadingLearning, setIsLoadingLearning] = useState(false);

  // Load user skills from database on login
  useEffect(() => {
    const loadUserSkills = async () => {
      const token = localStorage.getItem('authToken');
      const user = localStorage.getItem('user');

      if (token && user) {
        setIsLoadingSkills(true);
        try {
          const response = await api.getUserSkills(token) as { data?: { skills: any[] } };
          if (response.data?.skills && response.data.skills.length > 0) {
            const enrichedSkills = enrichUserSkills(response.data.skills.map((skill: any) => ({
              id: skill.id,
              userId: skill.user_id,
              skillId: 'skill-' + skill.skill_id.toString(),
              level: skill.level,
              confidence: skill.confidence,
              score: skill.score,
              assessedAt: new Date(skill.assessed_at),
              version: skill.version,
            })));
            setUserSkillsState(enrichedSkills);
            setCareerMatches(calculateCareerMatches(enrichedSkills));
          }
        } catch (error) {
          console.error('Failed to load user skills:', error);
        } finally {
          setIsLoadingSkills(false);
        }
      }
    };

    loadUserSkills();
  }, []);

  const setUserSkills = useCallback((skills: UserSkill[]) => {
    setUserSkillsState(enrichUserSkills(skills));
    setCareerMatches(calculateCareerMatches(skills));
  }, []);

  const updateSkill = useCallback((skillId: string, level: string, confidence: number) => {
    setUserSkillsState(prev => {
      const updated = prev.map(s => 
        s.skillId === skillId 
          ? { ...s, level: level as UserSkill['level'], confidence, score: getScoreFromLevel(level, confidence) }
          : s
      );
      setCareerMatches(calculateCareerMatches(updated));
      return updated;
    });
  }, []);

  const refreshCareerMatches = useCallback(() => {
    setCareerMatches(calculateCareerMatches(userSkills));
  }, [userSkills]);

  const generatePath = useCallback((roleId: string) => {
    const path = generateLearningPath(userSkills, roleId);
    setLearningPath(path);
  }, [userSkills]);

  const markStepComplete = useCallback((stepId: string) => {
    setLearningPath(prev => {
      if (!prev) return null;
      const updatedSteps = prev.steps.map(s => 
        s.id === stepId ? { ...s, isCompleted: true } : s
      );
      const completedCount = updatedSteps.filter(s => s.isCompleted).length;
      return {
        ...prev,
        steps: updatedSteps,
        progress: Math.round((completedCount / updatedSteps.length) * 100),
      };
    });
  }, []);

  const allGaps = careerMatches.flatMap(m => m.gaps);

  const addChatMessage = useCallback((message: ChatMessage) => {
    setChatMessages(prev => [...prev, message]);
  }, []);

  const clearChat = useCallback(() => {
    setChatMessages([]);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => {
      const newValue = !prev;
      localStorage.setItem('darkMode', JSON.stringify(newValue));
      return newValue;
    });
  }, []);

  return (
    <AppContext.Provider value={{
      userSkills,
      setUserSkills,
      updateSkill,
      careerMatches,
      refreshCareerMatches,
      selectedCareer,
      setSelectedCareer,
      learningPath,
      generatePath,
      markStepComplete,
      allGaps,
      chatMessages,
      addChatMessage,
      clearChat,
      isAssessmentComplete,
      setIsAssessmentComplete,
      isDarkMode,
      toggleDarkMode,
      isLoadingSkills,
      isLoadingCareers,
      isLoadingLearning,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

function getScoreFromLevel(level: string, confidence: number): number {
  const baseScores: Record<string, number> = {
    beginner: 25,
    intermediate: 50,
    advanced: 75,
    expert: 100,
  };
  const base = baseScores[level] || 25;
  return Math.round(base * (confidence / 100));
}
