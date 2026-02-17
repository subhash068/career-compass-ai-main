import axiosClient from './axiosClient';
import { CareerMatch, JobRole, CareerComparison, TrendingCareer } from '@/types';

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

  getCareerDetails: async (roleId: number): Promise<CareerMatch> => {
    const response = await axiosClient.get<CareerMatch>(`/career/details/${roleId}`);
    return response.data;
  },

  compareCareers: async (roleIds: number[]): Promise<CareerComparison> => {
    const response = await axiosClient.post<CareerComparison>('/career/compare', roleIds);
    return response.data;
  },

  getTrendingCareers: async (limit: number = 5): Promise<TrendingCareer[]> => {
    const response = await axiosClient.get<TrendingCareer[]>(`/career/trending?limit=${limit}`);
    return response.data;
  },
};
