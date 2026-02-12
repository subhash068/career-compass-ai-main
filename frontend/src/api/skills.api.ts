import axiosClient from './axiosClient';

export const skillsApi = {
  // Get all skills
  getAllSkills: () => axiosClient.get('/skills/'),

  // Get user skills
  getUserSkills: () => axiosClient.get('/skills/user'),

  // Analyze skills
  analyzeSkills: () => axiosClient.get('/skills/analyze'),

  // Update single skill
  updateSkill: (skillId: number, level: string, confidence: number) =>
    axiosClient.post('/skills/update', { skill_id: skillId, level, confidence }),

  // Submit assessment
  submitAssessment: (data: any) => axiosClient.post('/skills/submit', data),

  // Get assessment
  getAssessment: () => axiosClient.get('/skills/assessment'),

  // Quiz endpoints
  getQuiz: (skillIds: number[]) => axiosClient.post('/skills/quiz', { skill_ids: skillIds }),
  submitQuiz: (data: any) => axiosClient.post('/api/assessment/submit', data),


  // Assessment endpoints
  startAssessment: (data: any) => axiosClient.post('/skills/assessment/start', data),
  submitAssessmentAnswers: (data: any) => axiosClient.post('/skills/assessment/submit', data),

  // New Assessment Engine API endpoints
  initializeAssessment: (domainId: number, skillIds: number[]) =>
    axiosClient.post('/api/assessment/initialize', { domain_id: domainId, skill_ids: skillIds }),

  getSelectedSkills: (assessmentId?: number) =>
    axiosClient.get('/api/assessment/selected-skills', { params: { assessment_id: assessmentId } }),

  startSkillQuiz: (skillId: number) =>
    axiosClient.get(`/api/assessment/start/${skillId}`),

  submitQuizAnswers: (answers: Record<number, string>) =>
    axiosClient.post('/api/assessment/submit', { answers }),

  getAssessmentResult: (skillId: number) =>
    axiosClient.get(`/api/assessment/result/${skillId}`),
};
