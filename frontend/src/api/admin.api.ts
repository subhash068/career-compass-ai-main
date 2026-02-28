import axiosClient from './axiosClient';

export const adminApi = {
  // Learning Paths
  getLearningPaths: async () => {
    const response = await axiosClient.get('/admin/learning-paths');
    return response.data;
  },

  getLearningPathDetails: async (pathId: number) => {
    const response = await axiosClient.get(`/admin/learning-paths/${pathId}`);
    return response.data;
  },

  deleteLearningPath: async (pathId: number) => {
    const response = await axiosClient.delete(`/admin/learning-paths/${pathId}`);
    return response.data;
  },

  getLearningPathSteps: async (pathId: number) => {
    const response = await axiosClient.get(`/admin/learning-paths/${pathId}/steps`);
    return response.data;
  },

  updateLearningStep: async (pathId: number, stepId: number, stepData: any) => {
    const response = await axiosClient.put(`/admin/learning-paths/${pathId}/steps/${stepId}`, stepData);
    return response.data;
  },

  deleteLearningStep: async (pathId: number, stepId: number) => {
    const response = await axiosClient.delete(`/admin/learning-paths/${pathId}/steps/${stepId}`);
    return response.data;
  },


  createLearningStep: async (pathId: number, stepData: any) => {
    const response = await axiosClient.post(`/admin/learning-paths/${pathId}/steps`, stepData);
    return response.data;
  },


  // Learning Resources
  getLearningResources: async (skillId?: number) => {
    const params = skillId ? { skill_id: skillId } : {};
    const response = await axiosClient.get('/admin/learning-resources', { params });
    return response.data;
  },

  createLearningResource: async (resourceData: any) => {
    const response = await axiosClient.post('/admin/learning-resources', resourceData);
    return response.data;
  },

  updateLearningResource: async (resourceId: number, resourceData: any) => {
    const response = await axiosClient.put(`/admin/learning-resources/${resourceId}`, resourceData);
    return response.data;
  },

  deleteLearningResource: async (resourceId: number) => {
    const response = await axiosClient.delete(`/admin/learning-resources/${resourceId}`);
    return response.data;
  },

  // Users
  getUsers: async (skip = 0, limit = 100) => {
    const response = await axiosClient.get('/admin/users', {
      params: { skip, limit }
    });
    return response.data;
  },

  getUserDetails: async (userId: number) => {
    const response = await axiosClient.get(`/admin/users/${userId}`);
    return response.data;
  },

  createUser: async (userData: any) => {
    const response = await axiosClient.post('/admin/users', userData);
    return response.data;
  },

  updateUser: async (userId: number, userData: any) => {
    const response = await axiosClient.put(`/admin/users/${userId}`, userData);
    return response.data;
  },

  deleteUser: async (userId: number) => {
    const response = await axiosClient.delete(`/admin/users/${userId}`);
    return response.data;
  },

  updateUserRole: async (userId: number, newRole: string) => {
    const response = await axiosClient.put(`/admin/users/${userId}/role`, null, {
      params: { new_role: newRole }
    });
    return response.data;
  },

  // Assessments
  getAssessments: async (skip = 0, limit = 100) => {
    const response = await axiosClient.get('/admin/assessments', {
      params: { skip, limit }
    });
    return response.data;
  },

  // Stats
  getStats: async () => {
    const response = await axiosClient.get('/admin/stats');
    return response.data;
  },

  getOverviewMetrics: async () => {
    const response = await axiosClient.get('/admin/overview-metrics');
    return response.data;
  },

  getHealth: async () => {
    const response = await axiosClient.get('/admin/health');
    return response.data;
  },

  getMetrics: async () => {
    const response = await axiosClient.get('/admin/metrics');
    return response.data;
  },
};
