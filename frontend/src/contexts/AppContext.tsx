import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type {
  UserSkill,
  CareerMatch,
  LearningPath,
  ChatMessage,
  SkillGap
} from '@/types';
import {
  calculateCareerMatches,
  generateLearningPath,
  enrichUserSkills
} from '@/lib/mock-data';
import { skillsApi } from '@/api/skills.api';
import { careerApi } from '@/api/career.api';
import { learningApi } from '@/api/learning.api';

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
  const [userSkills, setUserSkillsState] = useState<UserSkill[]>([]);
  const [careerMatches, setCareerMatches] = useState<any[]>([]);
  const [selectedCareer, setSelectedCareer] = useState<CareerMatch | null>(null);
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAssessmentComplete, setIsAssessmentComplete] = useState(false);

  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  // Loading states
  const [isLoadingSkills, setIsLoadingSkills] = useState(true);
  const [isLoadingCareers, setIsLoadingCareers] = useState(true);
  const [isLoadingLearning, setIsLoadingLearning] = useState(false);

  // Load user skills from API on mount
  useEffect(() => {
    const loadUserSkills = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setIsLoadingSkills(false);
        return;
      }

      setIsLoadingSkills(true);
      try {
        const response = await skillsApi.getUserSkills();
        const skillsData = response.data?.skills || [];
        
        if (skillsData.length > 0) {
          const enrichedSkills = enrichUserSkills(skillsData.map((skill: any) => ({
            id: skill.id,
            userId: skill.user_id,
            skillId: skill.skill_id,
            level: skill.level,
            confidence: skill.confidence,
            score: skill.score,
            assessedAt: new Date(skill.assessed_at || skill.created_at),
            version: skill.version || 1,
          })));
          setUserSkillsState(enrichedSkills);
          setIsAssessmentComplete(true);
        } else {
          setUserSkillsState([]);
          setIsAssessmentComplete(false);
        }
      } catch (error) {
        console.error('Failed to load user skills:', error);
        setUserSkillsState([]);
      } finally {
        setIsLoadingSkills(false);
      }
    };

    loadUserSkills();
  }, []);

  // Load career matches from API
  useEffect(() => {
    const loadCareerMatches = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setIsLoadingCareers(false);
        return;
      }

      setIsLoadingCareers(true);
      try {
        const response = await careerApi.getRecommendations();
        const careerData = response.recommendations || [];
        setCareerMatches(careerData);
      } catch (error) {
        console.error('Failed to load career matches:', error);
        setCareerMatches([]);
      } finally {
        setIsLoadingCareers(false);
      }
    };

    loadCareerMatches();
  }, []);

  // Load learning path from API
  useEffect(() => {
    const loadLearningPath = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      setIsLoadingLearning(true);
      try {
        const path = await learningApi.getPath();
        setLearningPath(path);
      } catch (error) {
        console.error('Failed to load learning path:', error);
        setLearningPath(null);
      } finally {
        setIsLoadingLearning(false);
      }
    };

    loadLearningPath();
  }, []);

  // Listen for assessment completion and refresh data
  useEffect(() => {
    const handleAssessmentComplete = () => {
      console.log('Assessment completed - refreshing dashboard data...');
      // Refresh all data
      const token = localStorage.getItem('authToken');
      if (!token) return;

      // Refresh user skills
      skillsApi.getUserSkills().then(response => {
        const skillsData = response.data?.skills || [];
        if (skillsData.length > 0) {
          const enrichedSkills = enrichUserSkills(skillsData.map((skill: any) => ({
            id: skill.id,
            userId: skill.user_id,
            skillId: skill.skill_id,
            level: skill.level,
            confidence: skill.confidence,
            score: skill.score,
            assessedAt: new Date(skill.assessed_at || skill.created_at),
            version: skill.version || 1,
          })));
          setUserSkillsState(enrichedSkills);
          setIsAssessmentComplete(true);
        }
      }).catch(err => console.error('Failed to refresh skills:', err));

      // Refresh career matches
      careerApi.getRecommendations().then(response => {
        const careerData = response.recommendations || [];
        setCareerMatches(careerData);
      }).catch(err => console.error('Failed to refresh career matches:', err));
    };

    window.addEventListener('assessmentCompleted', handleAssessmentComplete);
    return () => window.removeEventListener('assessmentCompleted', handleAssessmentComplete);
  }, []);

  const setUserSkills = useCallback((skills: UserSkill[]) => {
    setUserSkillsState(enrichUserSkills(skills));
  }, []);

  const updateSkill = useCallback((skillId: string, level: string, confidence: number) => {
    setUserSkillsState(prev => {
      const updated = prev.map(s => 
        s.skillId.toString() === skillId 
          ? { ...s, level: level as UserSkill['level'], confidence, score: getScoreFromLevel(level, confidence) }
          : s
      );
      setCareerMatches(calculateCareerMatches(updated));
      return updated;
    });
  }, []);

  const refreshCareerMatches = useCallback(async () => {
    setIsLoadingCareers(true);
    try {
      const response = await careerApi.getRecommendations();
      const careerData = response.recommendations || [];
      setCareerMatches(careerData);
    } catch (error) {
      console.error('Failed to refresh career matches:', error);
    } finally {
      setIsLoadingCareers(false);
    }
  }, []);

  const generatePath = useCallback(async (roleId: string) => {
    setIsLoadingLearning(true);
    try {
      const path = await learningApi.generatePath(parseInt(roleId));
      setLearningPath(path);
    } catch (error) {
      console.error('Failed to generate learning path:', error);
    } finally {
      setIsLoadingLearning(false);
    }
  }, []);

  const markStepComplete = useCallback(async (stepId: string) => {
    if (!learningPath) return;
    
    setIsLoadingLearning(true);
    try {
      await learningApi.markStepComplete(learningPath.id, parseInt(stepId));
      // Refresh the learning path
      const updatedPath = await learningApi.getPath();
      setLearningPath(updatedPath);
    } catch (error) {
      console.error('Failed to mark step complete:', error);
    } finally {
      setIsLoadingLearning(false);
    }
  }, [learningPath]);

  // Extract gaps from career matches API response
  const allGaps = (careerMatches || []).flatMap((m: any) => {
    if (!m) return [];
    if (m.missing_severity && m.missing_severity.length > 0) {
      return m.missing_severity.map((item: any) => ({
        skillId: item.skill,
        skill: { name: item.skill },
        severity: item.severity,
        priority: item.priority || 5,
      }));
    }
    return (m.missing_skills || []).map((skill: string) => ({
      skillId: skill,
      skill: { name: skill },
      severity: 'medium',
      priority: 5,
    }));
  });

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
