import axiosClient from './axiosClient';
import { SkillAssessment, UserSkill, Skill, QuizData, QuizSubmission, QuizResult } from '@/types';

export interface SkillAnalysisResponse {
  skills: UserSkill[];
  gaps: {
    skillId: string;
    skill: { id: string; name: string; description: string; categoryId: string; demandLevel: number };
    currentLevel: string;
    requiredLevel: string;
    currentScore: number;
    requiredScore: number;
    gapScore: number;
    severity: 'low' | 'medium' | 'high';
    priority: number;
  }[];
  recommendations: string[];
}

export interface SubmitAssessmentRequest {
  skills: {
    skillId: string;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    confidence: number;
  }[];
}

export const skillsApi = {
  getAssessment: async (): Promise<SkillAssessment | null> => {
    try {
      const response = await axiosClient.get<SkillAssessment>('/skills/assessment');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // No assessment found
      }
      throw error;
    }
  },

  submitAssessment: async (data: SubmitAssessmentRequest): Promise<SkillAssessment> => {
    const response = await axiosClient.post<SkillAssessment>('/skills/submit', data);
    return response.data;
  },

  analyzeSkills: async (): Promise<SkillAnalysisResponse> => {
    const response = await axiosClient.get<SkillAnalysisResponse>('/skills/analyze');
    return response.data;
  },

  getAllSkills: async (): Promise<Skill[]> => {
    const response = await axiosClient.get<Skill[]>('/skills/');
    return response.data;
  },

  updateSkill: async (skillId: string, level: string, confidence: number): Promise<UserSkill> => {
    const response = await axiosClient.post<UserSkill>('/skills/update', {
      skill_id: parseInt(skillId),
      level,
      confidence,
    });
    return response.data;
  },

  getQuizQuestions: async (skillIds: number[]): Promise<QuizData> => {
    const response = await axiosClient.post<QuizData>('/skills/quiz', {
      skill_ids: skillIds,
    });
    return response.data;
  },

  submitQuiz: async (quizSubmission: QuizSubmission): Promise<QuizResult> => {
    const response = await axiosClient.post<QuizResult>('/skills/quiz/submit', quizSubmission);
    return response.data;
  },

  startAssessment: async (userId: number, skillIds: number[]): Promise<any> => {
    const response = await axiosClient.post('/skills/assessment/start', {
      user_id: userId,
      skill_ids: skillIds
    });
    return response.data;
  },

  submitQuizAssessment: async (assessmentId: number, answers: { [key: number]: string }, writtenAssessments?: { [skillId: string]: string }): Promise<any> => {
    const response = await axiosClient.post('/skills/assessment/submit', {
      assessment_id: assessmentId,
      answers: answers,
      written_assessments: writtenAssessments
    });
    return response.data;
  },


};
