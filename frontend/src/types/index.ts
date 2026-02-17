// Core Types for Skill Gap Analysis Platform

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type GapSeverity = 'low' | 'medium' | 'high';
export type AssessmentStatus = 'pending' | 'in_progress' | 'completed';

export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  avatarUrl?: string;
  role: 'user' | 'admin';
  currentRole: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SkillCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface Skill {
  id: number;
  name: string;
  description: string;
  categoryId: string;
  category?: SkillCategory;
  demandLevel: number; // 1-100 market demand
}

export interface UserSkill {
  id: number;
  userId: number;
  skillId: number;
  skill?: Skill;
  level: SkillLevel;
  confidence: number; // 1-100
  score: number; // 0-100 normalized score
  assessedAt: Date;
  version: number;
}

export interface SkillAssessment {
  id: number;
  userId: number;
  status: AssessmentStatus;
  skills: UserSkill[];
  completedAt?: Date;
  createdAt: Date;
}

export interface JobRole {
  id: number;
  title: string;
  description: string;
  level: 'entry' | 'mid' | 'senior' | 'lead' | 'principal';
  averageSalary: {
    min: number;
    max: number;
    currency: string;
  };
  average_salary_min?: number;
  average_salary_max?: number;
  demandScore: number; // 1-100
  demand_score?: number;
  growthRate: number; // percentage
  growth_rate?: number;
}

export interface RoleSkillRequirement {
  id: number;
  roleId: number;
  skillId: number;
  skill?: Skill;
  requiredLevel: SkillLevel;
  importance: 'required' | 'preferred' | 'nice_to_have';
  weight: number; // 0-1
}

export interface SkillGap {
  skillId: number;
  skill: Skill;
  currentLevel: SkillLevel;
  requiredLevel: SkillLevel;
  currentScore: number;
  requiredScore: number;
  gapScore: number; // difference
  severity: GapSeverity;
  priority: number; // 1-10
}

export interface CareerMatch {
  roleId: number;
  role?: JobRole;
  title: string;
  description?: string;
  level: string;
  matchScore: number;
  match_percentage?: number;
  skillMatch?: number;
  inferredBonus?: number;
  confidenceLevel?: number;
  skillMatches?: {
    matched: number;
    total: number;
    percentage: number;
  };
  gaps?: SkillGap[];
  reasoning?: string;
  explanation?: string;
  estimatedTimeToQualify?: string;
  estimated_time_to_qualify?: string;
  // Skills data
  matchedSkills?: string[];
  missingSkills?: string[];
  matchedCount?: number;
  missingCount?: number;
  totalRequirements?: number;
  keySkills?: string[];
  improvementPriority?: string[];
  missingSeverity?: Array<{
    skill_name: string;
    gap: number;
    effective_gap: number;
    severity: string;
    description: string;
    inferred_bonus: number;
  }>;
  skillRequirements?: Array<{
    skill_id: number;
    skill_name: string;
    required_level: string;
    user_level: string;
    user_score: number;
    required_score: number;
    gap: number;
    weight: number;
    is_matched: boolean;
    severity?: string;
    description?: string;
  }>;
  // Market data
  averageSalary?: {
    min: number;
    max: number;
    currency: string;
  };
  growthRate?: number;
  demandScore?: number;
  marketOutlook?: string;
  // Metadata
  qualityMetrics?: {
    factors_used: number;
    overall_confidence: number;
    score_consistency: number;
    method_used: string;
  };
}

export interface LearningResource {
  id: number;
  title: string;
  type: 'course' | 'tutorial' | 'book' | 'video' | 'project';
  provider: string;
  url: string;
  duration: string;
  difficulty: SkillLevel;
  rating: number;
  cost: 'free' | 'paid';
}

export interface LearningPathStep {
  id: number;
  skillId: number;
  skill_id?: number; // snake_case from API
  skill?: Skill;
  skill_name?: string; // from API when skill object not loaded
  targetLevel: SkillLevel;
  target_level?: SkillLevel; // snake_case from API
  order: number;
  estimatedDuration: string;
  estimated_duration?: string; // snake_case from API
  resources: LearningResource[];
  dependencies: string[]; // skill IDs
  isCompleted: boolean;
  is_completed?: boolean; // snake_case from API
  assessmentPassed?: boolean;
  assessment_passed?: boolean; // snake_case from API
  canComplete?: boolean;
}

export interface LearningPath {
  id: number;
  userId: number;
  targetRoleId: number;
  targetRole?: JobRole;
  steps: LearningPathStep[];
  totalDuration: string;
  progress: number; // 0-100
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: {
    skills?: UserSkill[];
    gaps?: SkillGap[];
    careers?: CareerMatch[];
  };
}

export interface ChatSession {
  id: number;
  userId: number;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// Level to score mapping
export const LEVEL_SCORES: Record<SkillLevel, number> = {
  beginner: 25,
  intermediate: 50,
  advanced: 75,
  expert: 100,
};

// Score to level mapping
export function scoreToLevel(score: number): SkillLevel {
  if (score >= 85) return 'expert';
  if (score >= 60) return 'advanced';
  if (score >= 35) return 'intermediate';
  return 'beginner';
}

// Gap severity calculation
export function calculateGapSeverity(gapScore: number): GapSeverity {
  if (gapScore <= 15) return 'low';
  if (gapScore <= 35) return 'medium';
  return 'high';
}

// Quiz-related types
export interface SkillQuestion {
  id: number;
  skill_id: number;
  question_text: string;
  options: string[];
  correct_answer: string;
  difficulty: string;
}

export interface QuizData {
  assessment_id: number;
  total_skills: number;
  questions: {
    [skillId: string]: {
      skill_name: string;
      questions: SkillQuestion[];
    };
  };
}

export interface QuizAnswer {
  question_id: number;
  answer: string;
}

export interface QuizSubmission {
  answers: {
    [skillId: string]: QuizAnswer[];
  };
}

export interface QuizResult {
  message: string;
  assessment_id: number;
  skill_scores: {
    [skillId: string]: {
      score: number;
      level: string;
      confidence: number;
      correct_answers: number;
      total_questions: number;
    };
  };
  overall_score: number;
}

// Career comparison types
export interface CareerComparison {
  careers: CareerMatch[];
  insights: string[];
  bestMatch: CareerMatch | null;
  highestSalary: CareerMatch | null;
  bestGrowth: CareerMatch | null;
  easiestPath: CareerMatch | null;
}

// Trending career type
export interface TrendingCareer {
  roleId: number;
  title: string;
  level: string;
  description?: string;
  growthRate: number;
  demandScore: number;
  averageSalary: {
    min: number;
    max: number;
    currency: string;
  };
  keySkills: string[];
  marketOutlook: string;
  trendingScore: number;
}
