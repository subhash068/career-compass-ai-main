// Mock Data for Development - Replace with API calls
import type { 
  SkillCategory, 
  Skill, 
  UserSkill, 
  JobRole, 
  RoleSkillRequirement,
  CareerMatch,
  SkillGap,
  LearningPath,
  LearningPathStep,
  LearningResource
} from '@/types';
import { LEVEL_SCORES, calculateGapSeverity } from '@/types';

export const skillCategories: SkillCategory[] = [
  { id: 'cat-1', name: 'Programming Languages', description: 'Core programming languages and syntax', icon: 'Code2', color: 'chart-1' },
  { id: 'cat-2', name: 'Frontend Development', description: 'Client-side web technologies', icon: 'Layout', color: 'chart-2' },
  { id: 'cat-3', name: 'Backend Development', description: 'Server-side technologies', icon: 'Server', color: 'chart-3' },
  { id: 'cat-4', name: 'Data & AI', description: 'Data science and machine learning', icon: 'Brain', color: 'chart-4' },
  { id: 'cat-5', name: 'DevOps & Cloud', description: 'Infrastructure and deployment', icon: 'Cloud', color: 'chart-5' },
  { id: 'cat-6', name: 'Soft Skills', description: 'Communication and collaboration', icon: 'Users', color: 'primary' },
];

export const skills: Skill[] = [
  // Programming Languages
  { id: 'skill-1', name: 'JavaScript', description: 'Modern JavaScript ES6+', categoryId: 'cat-1', demandLevel: 95 },
  { id: 'skill-2', name: 'TypeScript', description: 'Typed superset of JavaScript', categoryId: 'cat-1', demandLevel: 90 },
  { id: 'skill-3', name: 'Python', description: 'General purpose programming', categoryId: 'cat-1', demandLevel: 92 },
  { id: 'skill-4', name: 'Java', description: 'Enterprise development', categoryId: 'cat-1', demandLevel: 75 },
  { id: 'skill-5', name: 'Go', description: 'Systems programming', categoryId: 'cat-1', demandLevel: 70 },
  
  // Frontend
  { id: 'skill-6', name: 'React', description: 'Component-based UI library', categoryId: 'cat-2', demandLevel: 94 },
  { id: 'skill-7', name: 'Vue.js', description: 'Progressive JS framework', categoryId: 'cat-2', demandLevel: 72 },
  { id: 'skill-8', name: 'CSS/Tailwind', description: 'Styling and design systems', categoryId: 'cat-2', demandLevel: 88 },
  { id: 'skill-9', name: 'Next.js', description: 'React meta-framework', categoryId: 'cat-2', demandLevel: 85 },
  
  // Backend
  { id: 'skill-10', name: 'Node.js', description: 'Server-side JavaScript', categoryId: 'cat-3', demandLevel: 88 },
  { id: 'skill-11', name: 'PostgreSQL', description: 'Relational database', categoryId: 'cat-3', demandLevel: 82 },
  { id: 'skill-12', name: 'REST APIs', description: 'API design and implementation', categoryId: 'cat-3', demandLevel: 90 },
  { id: 'skill-13', name: 'GraphQL', description: 'Query language for APIs', categoryId: 'cat-3', demandLevel: 65 },
  
  // Data & AI
  { id: 'skill-14', name: 'Machine Learning', description: 'ML algorithms and models', categoryId: 'cat-4', demandLevel: 85 },
  { id: 'skill-15', name: 'Data Analysis', description: 'Data processing and visualization', categoryId: 'cat-4', demandLevel: 80 },
  { id: 'skill-16', name: 'SQL', description: 'Database querying', categoryId: 'cat-4', demandLevel: 88 },
  
  // DevOps
  { id: 'skill-17', name: 'Docker', description: 'Containerization', categoryId: 'cat-5', demandLevel: 85 },
  { id: 'skill-18', name: 'AWS', description: 'Amazon Web Services', categoryId: 'cat-5', demandLevel: 88 },
  { id: 'skill-19', name: 'CI/CD', description: 'Continuous integration/deployment', categoryId: 'cat-5', demandLevel: 82 },
  { id: 'skill-20', name: 'Kubernetes', description: 'Container orchestration', categoryId: 'cat-5', demandLevel: 78 },
  
  // Soft Skills
  { id: 'skill-21', name: 'Communication', description: 'Clear and effective communication', categoryId: 'cat-6', demandLevel: 95 },
  { id: 'skill-22', name: 'Problem Solving', description: 'Analytical thinking', categoryId: 'cat-6', demandLevel: 95 },
  { id: 'skill-23', name: 'Team Collaboration', description: 'Working effectively in teams', categoryId: 'cat-6', demandLevel: 90 },
  { id: 'skill-24', name: 'Leadership', description: 'Guiding and mentoring others', categoryId: 'cat-6', demandLevel: 75 },
];

export const jobRoles: JobRole[] = [
  {
    id: 'role-1',
    title: 'Frontend Developer',
    description: 'Build responsive, performant user interfaces using modern web technologies.',
    level: 'mid',
    averageSalary: { min: 80000, max: 130000, currency: 'USD' },
    demandScore: 92,
    growthRate: 15,
  },
  {
    id: 'role-2',
    title: 'Full Stack Developer',
    description: 'Develop end-to-end web applications spanning frontend and backend.',
    level: 'mid',
    averageSalary: { min: 95000, max: 160000, currency: 'USD' },
    demandScore: 95,
    growthRate: 18,
  },
  {
    id: 'role-3',
    title: 'Backend Engineer',
    description: 'Design and implement server-side logic, APIs, and data systems.',
    level: 'mid',
    averageSalary: { min: 90000, max: 150000, currency: 'USD' },
    demandScore: 88,
    growthRate: 12,
  },
  {
    id: 'role-4',
    title: 'Data Scientist',
    description: 'Extract insights from data using statistical methods and ML.',
    level: 'mid',
    averageSalary: { min: 100000, max: 170000, currency: 'USD' },
    demandScore: 85,
    growthRate: 22,
  },
  {
    id: 'role-5',
    title: 'DevOps Engineer',
    description: 'Automate infrastructure, deployments, and system reliability.',
    level: 'mid',
    averageSalary: { min: 95000, max: 165000, currency: 'USD' },
    demandScore: 90,
    growthRate: 20,
  },
  {
    id: 'role-6',
    title: 'Senior Software Engineer',
    description: 'Lead technical initiatives and mentor junior developers.',
    level: 'senior',
    averageSalary: { min: 140000, max: 220000, currency: 'USD' },
    demandScore: 88,
    growthRate: 14,
  },
];

export const roleSkillRequirements: RoleSkillRequirement[] = [
  // Frontend Developer
  { id: 'req-1', roleId: 'role-1', skillId: 'skill-1', requiredLevel: 'advanced', importance: 'required', weight: 0.9 },
  { id: 'req-2', roleId: 'role-1', skillId: 'skill-2', requiredLevel: 'intermediate', importance: 'required', weight: 0.8 },
  { id: 'req-3', roleId: 'role-1', skillId: 'skill-6', requiredLevel: 'advanced', importance: 'required', weight: 0.95 },
  { id: 'req-4', roleId: 'role-1', skillId: 'skill-8', requiredLevel: 'advanced', importance: 'required', weight: 0.85 },
  { id: 'req-5', roleId: 'role-1', skillId: 'skill-9', requiredLevel: 'intermediate', importance: 'preferred', weight: 0.6 },
  
  // Full Stack Developer
  { id: 'req-6', roleId: 'role-2', skillId: 'skill-1', requiredLevel: 'advanced', importance: 'required', weight: 0.9 },
  { id: 'req-7', roleId: 'role-2', skillId: 'skill-2', requiredLevel: 'advanced', importance: 'required', weight: 0.85 },
  { id: 'req-8', roleId: 'role-2', skillId: 'skill-6', requiredLevel: 'advanced', importance: 'required', weight: 0.9 },
  { id: 'req-9', roleId: 'role-2', skillId: 'skill-10', requiredLevel: 'advanced', importance: 'required', weight: 0.85 },
  { id: 'req-10', roleId: 'role-2', skillId: 'skill-11', requiredLevel: 'intermediate', importance: 'required', weight: 0.7 },
  { id: 'req-11', roleId: 'role-2', skillId: 'skill-12', requiredLevel: 'advanced', importance: 'required', weight: 0.8 },
  { id: 'req-12', roleId: 'role-2', skillId: 'skill-17', requiredLevel: 'intermediate', importance: 'preferred', weight: 0.5 },
  
  // Backend Engineer
  { id: 'req-13', roleId: 'role-3', skillId: 'skill-3', requiredLevel: 'advanced', importance: 'required', weight: 0.9 },
  { id: 'req-14', roleId: 'role-3', skillId: 'skill-10', requiredLevel: 'advanced', importance: 'required', weight: 0.85 },
  { id: 'req-15', roleId: 'role-3', skillId: 'skill-11', requiredLevel: 'advanced', importance: 'required', weight: 0.9 },
  { id: 'req-16', roleId: 'role-3', skillId: 'skill-12', requiredLevel: 'advanced', importance: 'required', weight: 0.9 },
  { id: 'req-17', roleId: 'role-3', skillId: 'skill-17', requiredLevel: 'intermediate', importance: 'required', weight: 0.7 },
  
  // Data Scientist
  { id: 'req-18', roleId: 'role-4', skillId: 'skill-3', requiredLevel: 'advanced', importance: 'required', weight: 0.95 },
  { id: 'req-19', roleId: 'role-4', skillId: 'skill-14', requiredLevel: 'advanced', importance: 'required', weight: 0.95 },
  { id: 'req-20', roleId: 'role-4', skillId: 'skill-15', requiredLevel: 'advanced', importance: 'required', weight: 0.9 },
  { id: 'req-21', roleId: 'role-4', skillId: 'skill-16', requiredLevel: 'advanced', importance: 'required', weight: 0.85 },
  
  // DevOps Engineer
  { id: 'req-22', roleId: 'role-5', skillId: 'skill-17', requiredLevel: 'advanced', importance: 'required', weight: 0.95 },
  { id: 'req-23', roleId: 'role-5', skillId: 'skill-18', requiredLevel: 'advanced', importance: 'required', weight: 0.9 },
  { id: 'req-24', roleId: 'role-5', skillId: 'skill-19', requiredLevel: 'advanced', importance: 'required', weight: 0.9 },
  { id: 'req-25', roleId: 'role-5', skillId: 'skill-20', requiredLevel: 'intermediate', importance: 'required', weight: 0.8 },
  { id: 'req-26', roleId: 'role-5', skillId: 'skill-3', requiredLevel: 'intermediate', importance: 'preferred', weight: 0.6 },
];

// Sample user skills (simulating an assessed user)
export const sampleUserSkills: UserSkill[] = [
  { id: 'us-1', userId: 'user-1', skillId: 'skill-1', level: 'advanced', confidence: 85, score: 78, assessedAt: new Date(), version: 1 },
  { id: 'us-2', userId: 'user-1', skillId: 'skill-2', level: 'intermediate', confidence: 70, score: 55, assessedAt: new Date(), version: 1 },
  { id: 'us-3', userId: 'user-1', skillId: 'skill-3', level: 'beginner', confidence: 40, score: 30, assessedAt: new Date(), version: 1 },
  { id: 'us-4', userId: 'user-1', skillId: 'skill-6', level: 'advanced', confidence: 90, score: 82, assessedAt: new Date(), version: 1 },
  { id: 'us-5', userId: 'user-1', skillId: 'skill-8', level: 'advanced', confidence: 85, score: 75, assessedAt: new Date(), version: 1 },
  { id: 'us-6', userId: 'user-1', skillId: 'skill-10', level: 'intermediate', confidence: 65, score: 48, assessedAt: new Date(), version: 1 },
  { id: 'us-7', userId: 'user-1', skillId: 'skill-11', level: 'beginner', confidence: 50, score: 35, assessedAt: new Date(), version: 1 },
  { id: 'us-8', userId: 'user-1', skillId: 'skill-12', level: 'intermediate', confidence: 70, score: 52, assessedAt: new Date(), version: 1 },
  { id: 'us-9', userId: 'user-1', skillId: 'skill-17', level: 'beginner', confidence: 45, score: 28, assessedAt: new Date(), version: 1 },
  { id: 'us-10', userId: 'user-1', skillId: 'skill-21', level: 'advanced', confidence: 85, score: 80, assessedAt: new Date(), version: 1 },
  { id: 'us-11', userId: 'user-1', skillId: 'skill-22', level: 'advanced', confidence: 80, score: 75, assessedAt: new Date(), version: 1 },
];

// Helper function to get skill by ID
export function getSkillById(skillId: string): Skill | undefined {
  return skills.find(s => s.id === skillId);
}

// Helper function to get category by ID
export function getCategoryById(categoryId: string): SkillCategory | undefined {
  return skillCategories.find(c => c.id === categoryId);
}

// Helper to enrich user skills with skill data
export function enrichUserSkills(userSkills: UserSkill[]): UserSkill[] {
  return userSkills.map(us => ({
    ...us,
    skill: getSkillById(us.skillId),
  }));
}

// Calculate career matches based on user skills
export function calculateCareerMatches(userSkills: UserSkill[]): CareerMatch[] {
  const matches: CareerMatch[] = [];
  
  for (const role of jobRoles) {
    const requirements = roleSkillRequirements.filter(r => r.roleId === role.id);
    const gaps: SkillGap[] = [];
    let totalWeight = 0;
    let matchedWeight = 0;
    
    for (const req of requirements) {
      const userSkill = userSkills.find(us => us.skillId === req.skillId);
      const skill = getSkillById(req.skillId);
      if (!skill) continue;
      
      const requiredScore = LEVEL_SCORES[req.requiredLevel];
      const currentScore = userSkill?.score ?? 0;
      const currentLevel = userSkill?.level ?? 'beginner';
      const gapScore = Math.max(0, requiredScore - currentScore);
      
      totalWeight += req.weight;
      matchedWeight += req.weight * Math.min(1, currentScore / requiredScore);
      
      if (gapScore > 10) {
        gaps.push({
          skillId: req.skillId,
          skill,
          currentLevel,
          requiredLevel: req.requiredLevel,
          currentScore,
          requiredScore,
          gapScore,
          severity: calculateGapSeverity(gapScore),
          priority: Math.round(req.weight * 10),
        });
      }
    }
    
    const matchScore = Math.round((matchedWeight / totalWeight) * 100);
    const matchedCount = requirements.length - gaps.length;
    
    matches.push({
      roleId: role.id,
      role,
      matchScore,
      skillMatches: {
        matched: matchedCount,
        total: requirements.length,
        percentage: Math.round((matchedCount / requirements.length) * 100),
      },
      gaps: gaps.sort((a, b) => b.priority - a.priority),
      reasoning: generateMatchReasoning(matchScore, gaps, role),
      estimatedTimeToQualify: estimateTimeToQualify(gaps),
    });
  }
  
  return matches.sort((a, b) => b.matchScore - a.matchScore);
}

function generateMatchReasoning(matchScore: number, gaps: SkillGap[], role: JobRole): string {
  if (matchScore >= 85) {
    return `Excellent match! Your skills align strongly with ${role.title} requirements.`;
  } else if (matchScore >= 70) {
    const topGap = gaps[0]?.skill.name;
    return `Good fit with room to grow. Focus on ${topGap} to strengthen your profile.`;
  } else if (matchScore >= 50) {
    return `Emerging candidate. ${gaps.length} skill areas need development for this role.`;
  }
  return `Growth opportunity. Building these skills opens doors to ${role.title}.`;
}

function estimateTimeToQualify(gaps: SkillGap[]): string {
  const totalGapScore = gaps.reduce((sum, g) => sum + g.gapScore, 0);
  if (totalGapScore <= 50) return '1-2 months';
  if (totalGapScore <= 100) return '3-4 months';
  if (totalGapScore <= 150) return '4-6 months';
  return '6-12 months';
}

// Generate learning resources
export const learningResources: LearningResource[] = [
  { id: 'lr-1', title: 'Modern JavaScript Complete Guide', type: 'course', provider: 'Udemy', url: '#', duration: '40 hours', difficulty: 'intermediate', rating: 4.8, cost: 'paid' },
  { id: 'lr-2', title: 'TypeScript Deep Dive', type: 'book', provider: 'Basarat', url: '#', duration: '15 hours', difficulty: 'intermediate', rating: 4.9, cost: 'free' },
  { id: 'lr-3', title: 'React - The Complete Guide', type: 'course', provider: 'Udemy', url: '#', duration: '48 hours', difficulty: 'intermediate', rating: 4.8, cost: 'paid' },
  { id: 'lr-4', title: 'Node.js Design Patterns', type: 'book', provider: "O'Reilly", url: '#', duration: '20 hours', difficulty: 'advanced', rating: 4.7, cost: 'paid' },
  { id: 'lr-5', title: 'PostgreSQL Tutorial', type: 'tutorial', provider: 'PostgreSQL.org', url: '#', duration: '10 hours', difficulty: 'beginner', rating: 4.5, cost: 'free' },
  { id: 'lr-6', title: 'Docker Mastery', type: 'course', provider: 'Docker', url: '#', duration: '22 hours', difficulty: 'intermediate', rating: 4.7, cost: 'paid' },
  { id: 'lr-7', title: 'AWS Certified Solutions Architect', type: 'course', provider: 'A Cloud Guru', url: '#', duration: '35 hours', difficulty: 'advanced', rating: 4.8, cost: 'paid' },
  { id: 'lr-8', title: 'Machine Learning Crash Course', type: 'course', provider: 'Google', url: '#', duration: '15 hours', difficulty: 'beginner', rating: 4.6, cost: 'free' },
];

// Generate a learning path for a target role
export function generateLearningPath(userSkills: UserSkill[], targetRoleId: string): LearningPath {
  const requirements = roleSkillRequirements.filter(r => r.roleId === targetRoleId);
  const role = jobRoles.find(r => r.id === targetRoleId);
  const steps: LearningPathStep[] = [];
  
  let order = 1;
  for (const req of requirements.sort((a, b) => b.weight - a.weight)) {
    const userSkill = userSkills.find(us => us.skillId === req.skillId);
    const skill = getSkillById(req.skillId);
    if (!skill) continue;
    
    const currentScore = userSkill?.score ?? 0;
    const requiredScore = LEVEL_SCORES[req.requiredLevel];
    
    if (currentScore < requiredScore) {
      const relevantResources = learningResources.filter(r => 
        r.difficulty === req.requiredLevel || 
        r.difficulty === userSkill?.level
      ).slice(0, 2);
      
      steps.push({
        id: `step-${order}`,
        skillId: req.skillId,
        skill,
        targetLevel: req.requiredLevel,
        order,
        estimatedDuration: `${Math.ceil((requiredScore - currentScore) / 10)} weeks`,
        resources: relevantResources,
        dependencies: [],
        isCompleted: false,
      });
      order++;
    }
  }
  
  const totalWeeks = steps.reduce((sum, step) => {
    const weeks = parseInt(step.estimatedDuration) || 2;
    return sum + weeks;
  }, 0);
  
  return {
    id: 'lp-1',
    userId: 'user-1',
    targetRoleId,
    targetRole: role,
    steps,
    totalDuration: `${totalWeeks} weeks`,
    progress: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
