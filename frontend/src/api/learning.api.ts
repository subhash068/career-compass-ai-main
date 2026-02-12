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

};

export default learningApi;
