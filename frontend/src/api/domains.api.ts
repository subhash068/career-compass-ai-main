import axiosClient from './axiosClient';

export interface Domain {
  id: number;
  name: string;
  created_at?: string;
  updated_at?: string;
  skills?: Skill[];
}

export interface Skill {
  id: number;
  name: string;
  description?: string;
  domain_id: number;
  domain_name?: string;
  demand_level?: number;
}

export interface CreateDomainRequest {
  name: string;
}

export interface CreateSkillRequest {
  name: string;
  domain_id: number;
  description?: string;
  demand_level?: number;
  depends_on?: string[];
}

export interface UpdateDomainRequest {
  name?: string;
}

export interface UpdateSkillRequest {
  name?: string;
  description?: string;
  domain_id?: number;
  demand_level?: number;
  depends_on?: string[];
}

export const domainsApi = {
  // Domain Management
  getAllDomains: async (includeSkills: boolean = true): Promise<{ domains: Domain[] }> => {
    const response = await axiosClient.get('/admin/domains', {
      params: { include_skills: includeSkills }
    });
    return response.data;
  },

  getDomainById: async (domainId: number): Promise<{ domain: Domain; skills: Skill[] }> => {
    const response = await axiosClient.get(`/admin/domains/${domainId}`);
    return response.data;
  },

  createDomain: async (data: CreateDomainRequest): Promise<{ message: string; domain: Domain }> => {
    const response = await axiosClient.post('/admin/domains', data);
    return response.data;
  },

  updateDomain: async (domainId: number, data: UpdateDomainRequest): Promise<{ message: string; domain: Domain }> => {
    const response = await axiosClient.put(`/admin/domains/${domainId}`, data);
    return response.data;
  },

  deleteDomain: async (domainId: number): Promise<{ message: string; deleted_domain_id: number; deleted_skills_count: number }> => {
    const response = await axiosClient.delete(`/admin/domains/${domainId}`);
    return response.data;
  },

  // Skill Management
  getAllSkills: async (domainId?: number): Promise<{ skills: Skill[] }> => {
    const params = domainId ? { domain_id: domainId } : {};
    const response = await axiosClient.get('/admin/skills', { params });
    return response.data;
  },

  getSkillById: async (skillId: number): Promise<{ skill: Skill }> => {
    const response = await axiosClient.get(`/admin/skills/${skillId}`);
    return response.data;
  },

  createSkill: async (data: CreateSkillRequest): Promise<{ message: string; skill: Skill }> => {
    const response = await axiosClient.post('/admin/skills', data);
    return response.data;
  },

  updateSkill: async (skillId: number, data: UpdateSkillRequest): Promise<{ message: string; skill: Skill }> => {
    const response = await axiosClient.put(`/admin/skills/${skillId}`, data);
    return response.data;
  },

  deleteSkill: async (skillId: number): Promise<{ message: string; deleted_skill_id: number }> => {
    const response = await axiosClient.delete(`/admin/skills/${skillId}`);
    return response.data;
  },
};

export default domainsApi;
