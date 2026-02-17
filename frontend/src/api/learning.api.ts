import axiosClient from './axiosClient';
import type { LearningPath } from '@/types';

export const learningApi = {
  getPath: async (): Promise<LearningPath | null> => {
    try {
      const response = await axiosClient.get<{ paths: LearningPath[]; count: number }>('/learning/paths');
      // Return the first path if available, otherwise null
      return response.data.paths.length > 0 ? response.data.paths[0] : null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },


  generatePath: async (roleId: number): Promise<LearningPath> => {
    const response = await axiosClient.post<LearningPath>('/learning/paths', { roleId });
    return response.data;
  },

  markStepComplete: async (pathId: number, stepId: number): Promise<void> => {
    await axiosClient.post(`/learning/path/${pathId}/step/${stepId}/complete`);
  },

  // Check if step can be completed (sequential + assessment requirements)
  canCompleteStep: async (pathId: number, stepId: number): Promise<{
    can_complete: boolean;
    reason: string;
    previous_step_completed: boolean;
    assessment_passed: boolean;
    step_order: number;
    total_steps: number;
  }> => {
    const response = await axiosClient.get(`/learning/path/${pathId}/step/${stepId}/can-complete`);
    return response.data;
  },

  // Get assessment questions for a step
  getStepAssessment: async (pathId: number, stepId: number): Promise<{
    step_id: number;
    skill_name: string;
    target_level: string;
    questions: Array<{
      id: number;
      question: string;
      options: string[];
    }>;
    total_questions: number;
    assessment_already_passed: boolean;
  }> => {
    const response = await axiosClient.get(`/learning/path/${pathId}/step/${stepId}/assessment`);
    return response.data;
  },

  // Submit assessment answers
  submitStepAssessment: async (pathId: number, stepId: number, answers: string[]): Promise<{
    passed: boolean;
    score: number;
    correct_answers: number;
    total_questions: number;
    message: string;
  }> => {
    const response = await axiosClient.post(`/learning/path/${pathId}/step/${stepId}/assessment`, {
      answers,
    });
    return response.data;
  },
};

export default learningApi;
