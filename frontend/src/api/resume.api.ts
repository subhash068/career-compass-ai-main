/**
 * Resume API Client
 * Handles all resume-related API calls
 */
import axiosClient from './axiosClient';

// ============== Types ==============

export interface PersonalInfo {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  portfolio?: string;
  website?: string;
}

export interface Experience {
  id?: string;
  company: string;
  title: string;
  location?: string;
  start_date: string;
  end_date?: string;
  current?: boolean;
  description: string;
  achievements?: string[];
}

export interface Education {
  id?: string;
  school: string;
  degree: string;
  field?: string;
  location?: string;
  start_date: string;
  end_date?: string;
  gpa?: string;
}

export interface Certification {
  id?: string;
  name: string;
  issuer: string;
  date: string;
  expiry?: string;
  credential_id?: string;
}

export interface Project {
  id?: string;
  name: string;
  description: string;
  technologies?: string[];
  link?: string;
  start_date?: string;
  end_date?: string;
}

export interface Resume {
  id: number;
  user_id: number;
  title: string;
  personal_info: PersonalInfo;
  summary?: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
  certifications: Certification[];
  projects: Project[];
  ats_score?: number;
  ats_analysis?: ATSAnalysis;
  original_filename?: string;
  created_at: string;
  updated_at: string;
}

export interface ATSAnalysis {
  overall_score: number;
  sections_analysis: {
    score: number;
    found: Record<string, boolean>;
    missing: string[];
    total_required: number;
    found_count: number;
  };
  keywords_analysis: {
    score: number;
    technical_keywords: {
      found: string[];
      count: number;
      total: number;
    };
    soft_skills: {
      found: string[];
      count: number;
      total: number;
    };
    job_match?: {
      score: number;
      missing_keywords: string[];
    };
  };
  formatting_analysis: {
    score: number;
    word_count: number;
    issues: string[];
    has_clear_headers: boolean;
  };
  suggestions: string[];
  word_count: number;
  analyzed_at: string;
}

export interface CreateResumeRequest {
  title: string;
  personal_info: PersonalInfo;
  summary?: string;
  experience?: Experience[];
  education?: Education[];
  skills?: string[];
  certifications?: Certification[];
  projects?: Project[];
}

export interface UpdateResumeRequest {
  title?: string;
  personal_info?: PersonalInfo;
  summary?: string;
  experience?: Experience[];
  education?: Education[];
  skills?: string[];
  certifications?: Certification[];
  projects?: Project[];
}


// ============== API Methods ==============

export const resumeApi = {
  // Get all user resumes
  getUserResumes: async (): Promise<{ success: boolean; resumes: Resume[]; count: number }> => {
    const response = await axiosClient.get('/api/resumes');
    return response.data;
  },

  // Get a specific resume
  getResume: async (resumeId: number): Promise<{ success: boolean; resume: Resume }> => {
    const response = await axiosClient.get(`/api/resumes/${resumeId}`);
    return response.data;
  },

  // Create a new resume
  createResume: async (data: CreateResumeRequest): Promise<{ success: boolean; message: string; resume: Resume }> => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('personal_info', JSON.stringify(data.personal_info));
    if (data.summary) formData.append('summary', data.summary);
    formData.append('experience', JSON.stringify(data.experience || []));
    formData.append('education', JSON.stringify(data.education || []));
    formData.append('skills', JSON.stringify(data.skills || []));
    formData.append('certifications', JSON.stringify(data.certifications || []));
    formData.append('projects', JSON.stringify(data.projects || []));

    const response = await axiosClient.post('/api/resumes', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update a resume
  updateResume: async (resumeId: number, data: UpdateResumeRequest): Promise<{ success: boolean; message: string; resume: Resume }> => {
    const formData = new FormData();
    if (data.title) formData.append('title', data.title);
    if (data.personal_info) formData.append('personal_info', JSON.stringify(data.personal_info));
    if (data.summary !== undefined) formData.append('summary', data.summary);
    if (data.experience) formData.append('experience', JSON.stringify(data.experience));
    if (data.education) formData.append('education', JSON.stringify(data.education));
    if (data.skills) formData.append('skills', JSON.stringify(data.skills));
    if (data.certifications) formData.append('certifications', JSON.stringify(data.certifications));
    if (data.projects) formData.append('projects', JSON.stringify(data.projects));

    const response = await axiosClient.put(`/api/resumes/${resumeId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete a resume
  deleteResume: async (resumeId: number): Promise<{ success: boolean; message: string }> => {
    const response = await axiosClient.delete(`/api/resumes/${resumeId}`);
    return response.data;
  },

  // Upload a resume file
  uploadResume: async (file: File, title?: string): Promise<{
    success: boolean;
    message: string;
    resume: Resume;
    ats_analysis: ATSAnalysis;
    parsed_text_preview: string;
  }> => {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);

    const response = await axiosClient.post('/api/resumes/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Analyze ATS score
  analyzeATSScore: async (resumeId: number, jobDescription?: string): Promise<{
    success: boolean;
    resume_id: number;
    ats_analysis: ATSAnalysis;
  }> => {
    const formData = new FormData();
    if (jobDescription) formData.append('job_description', jobDescription);

    const response = await axiosClient.post(`/api/resumes/${resumeId}/ats-score`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get stored ATS analysis
  getATSAnalysis: async (resumeId: number): Promise<{
    success: boolean;
    resume_id: number;
    ats_analysis: ATSAnalysis;
    ats_score: number;
  }> => {
    const response = await axiosClient.get(`/api/resumes/${resumeId}/ats-analysis`);
    return response.data;
  },
};

export default resumeApi;
