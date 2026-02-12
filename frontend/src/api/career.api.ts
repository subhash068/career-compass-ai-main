import axiosClient from './axiosClient';
import { CareerMatch, JobRole } from '@/types';

export interface CareerRecommendationResponse {
  recommendations: CareerMatch[];
  topMatches: CareerMatch[];
}

export const careerApi = {
  getRecommendations: async (): Promise<CareerRecommendationResponse> => {
    const response = await axiosClient.get<CareerRecommendationResponse>('/career/matches');
    return response.data;
  },


  getAllRoles: async (): Promise<JobRole[]> => {
    const response = await axiosClient.get<JobRole[]>('/career/roles');
    return response.data;
  },

  getRoleDetails: async (roleId: string): Promise<JobRole> => {
    const response = await axiosClient.get<JobRole>(`/career/roles/${roleId}`);
    return response.data;
  },
};
