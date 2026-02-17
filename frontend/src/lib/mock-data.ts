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

// Domain IDs must match the database (2-7)
export const skillCategories: SkillCategory[] = [
  { id: '2', name: 'Frontend', description: 'Client-side web technologies and UI development', icon: 'Layout', color: 'chart-1' },
  { id: '3', name: 'Backend', description: 'Server-side technologies and APIs', icon: 'Server', color: 'chart-2' },
  { id: '4', name: 'Full Stack', description: 'End-to-end web application development', icon: 'Layers', color: 'chart-3' },
  { id: '5', name: 'AI / ML', description: 'Artificial intelligence and machine learning', icon: 'Brain', color: 'chart-4' },
  { id: '6', name: 'DevOps', description: 'Infrastructure, deployment, and CI/CD', icon: 'Cloud', color: 'chart-5' },
  { id: '7', name: 'QA Engineer', description: 'Quality assurance and testing', icon: 'CheckCircle', color: 'primary' },
];

// Skills with categoryIds matching database domain_ids (2-7)
export const skills: Skill[] = [
  // Frontend (domain_id: 2)
  { id: 1, name: 'JavaScript', description: 'Modern JavaScript ES6+', categoryId: '2', demandLevel: 95 },
  { id: 2, name: 'TypeScript', description: 'Typed superset of JavaScript', categoryId: '2', demandLevel: 90 },
  { id: 6, name: 'React', description: 'Component-based UI library', categoryId: '2', demandLevel: 94 },
  { id: 7, name: 'Vue.js', description: 'Progressive JS framework', categoryId: '2', demandLevel: 72 },
  { id: 8, name: 'CSS/Tailwind', description: 'Styling and design systems', categoryId: '2', demandLevel: 88 },
  { id: 9, name: 'Next.js', description: 'React meta-framework', categoryId: '2', demandLevel: 85 },
  
  // Backend (domain_id: 3)
  { id: 3, name: 'Python', description: 'General purpose programming', categoryId: '3', demandLevel: 92 },
  { id: 4, name: 'Java', description: 'Enterprise development', categoryId: '3', demandLevel: 75 },
  { id: 5, name: 'Go', description: 'Systems programming', categoryId: '3', demandLevel: 70 },
  { id: 10, name: 'Node.js', description: 'Server-side JavaScript', categoryId: '3', demandLevel: 88 },
  { id: 11, name: 'PostgreSQL', description: 'Relational database', categoryId: '3', demandLevel: 82 },
  { id: 12, name: 'REST APIs', description: 'API design and implementation', categoryId: '3', demandLevel: 90 },
  { id: 13, name: 'GraphQL', description: 'Query language for APIs', categoryId: '3', demandLevel: 65 },
  
  // Full Stack (domain_id: 4)
  { id: 25, name: 'Full Stack Architecture', description: 'End-to-end system design', categoryId: '4', demandLevel: 90 },
  { id: 26, name: 'Database Design', description: 'Schema design and optimization', categoryId: '4', demandLevel: 85 },
  { id: 27, name: 'API Integration', description: 'Frontend-backend integration', categoryId: '4', demandLevel: 88 },
  { id: 28, name: 'System Design', description: 'Scalable architecture patterns', categoryId: '4', demandLevel: 82 },
  
  // AI / ML (domain_id: 5)
  { id: 14, name: 'Machine Learning', description: 'ML algorithms and models', categoryId: '5', demandLevel: 85 },
  { id: 15, name: 'Data Analysis', description: 'Data processing and visualization', categoryId: '5', demandLevel: 80 },
  { id: 16, name: 'SQL', description: 'Database querying', categoryId: '5', demandLevel: 88 },
  { id: 29, name: 'Deep Learning', description: 'Neural networks and AI', categoryId: '5', demandLevel: 78 },
  { id: 30, name: 'NLP', description: 'Natural language processing', categoryId: '5', demandLevel: 75 },
  
  // DevOps (domain_id: 6)
  { id: 17, name: 'Docker', description: 'Containerization', categoryId: '6', demandLevel: 85 },
  { id: 18, name: 'AWS', description: 'Amazon Web Services', categoryId: '6', demandLevel: 88 },
  { id: 19, name: 'CI/CD', description: 'Continuous integration/deployment', categoryId: '6', demandLevel: 82 },
  { id: 20, name: 'Kubernetes', description: 'Container orchestration', categoryId: '6', demandLevel: 78 },
  { id: 31, name: 'Terraform', description: 'Infrastructure as code', categoryId: '6', demandLevel: 72 },
  { id: 32, name: 'Monitoring', description: 'System monitoring and logging', categoryId: '6', demandLevel: 70 },
  
  // QA Engineer (domain_id: 7)
  { id: 33, name: 'Manual Testing', description: 'Functional and regression testing', categoryId: '7', demandLevel: 85 },
  { id: 34, name: 'Automation Testing', description: 'Selenium, Cypress, Playwright', categoryId: '7', demandLevel: 88 },
  { id: 35, name: 'Test Planning', description: 'Test strategy and documentation', categoryId: '7', demandLevel: 82 },
  { id: 36, name: 'Performance Testing', description: 'Load and stress testing', categoryId: '7', demandLevel: 75 },
  { id: 37, name: 'API Testing', description: 'Postman, REST API validation', categoryId: '7', demandLevel: 80 },
  { id: 38, name: 'Bug Tracking', description: 'JIRA, Bugzilla, issue management', categoryId: '7', demandLevel: 78 },
];

export const jobRoles: JobRole[] = [
  {
    id: 1,
    title: 'Frontend Developer',
    description: 'Build responsive, performant user interfaces using modern web technologies.',
    level: 'mid',
    averageSalary: { min: 80000, max: 130000, currency: 'USD' },
    demandScore: 92,
    growthRate: 15,
  },
  {
    id: 2,
    title: 'Full Stack Developer',
    description: 'Develop end-to-end web applications spanning frontend and backend.',
    level: 'mid',
    averageSalary: { min: 95000, max: 160000, currency: 'USD' },
    demandScore: 95,
    growthRate: 18,
  },
  {
    id: 3,
    title: 'Backend Engineer',
    description: 'Design and implement server-side logic, APIs, and data systems.',
    level: 'mid',
    averageSalary: { min: 90000, max: 150000, currency: 'USD' },
    demandScore: 88,
    growthRate: 12,
  },
  {
    id: 4,
    title: 'Data Scientist',
    description: 'Extract insights from data using statistical methods and ML.',
    level: 'mid',
    averageSalary: { min: 100000, max: 170000, currency: 'USD' },
    demandScore: 85,
    growthRate: 22,
  },
  {
    id: 5,
    title: 'DevOps Engineer',
    description: 'Automate infrastructure, deployments, and system reliability.',
    level: 'mid',
    averageSalary: { min: 95000, max: 165000, currency: 'USD' },
    demandScore: 90,
    growthRate: 20,
  },
  {
    id: 6,
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
  { id: 1, roleId: 1, skillId: 1, requiredLevel: 'advanced', importance: 'required', weight: 0.9 },
  { id: 2, roleId: 1, skillId: 2, requiredLevel: 'intermediate', importance: 'required', weight: 0.8 },
  { id: 3, roleId: 1, skillId: 6, requiredLevel: 'advanced', importance: 'required', weight: 0.95 },
  { id: 4, roleId: 1, skillId: 8, requiredLevel: 'advanced', importance: 'required', weight: 0.85 },
  { id: 5, roleId: 1, skillId: 9, requiredLevel: 'intermediate', importance: 'preferred', weight: 0.6 },
  
  // Full Stack Developer
  { id: 6, roleId: 2, skillId: 1, requiredLevel: 'advanced', importance: 'required', weight: 0.9 },
  { id: 7, roleId: 2, skillId: 2, requiredLevel: 'advanced', importance: 'required', weight: 0.85 },
  { id: 8, roleId: 2, skillId: 6, requiredLevel: 'advanced', importance: 'required', weight: 0.9 },
  { id: 9, roleId: 2, skillId: 10, requiredLevel: 'advanced', importance: 'required', weight: 0.85 },
  { id: 10, roleId: 2, skillId: 11, requiredLevel: 'intermediate', importance: 'required', weight: 0.7 },
  { id: 11, roleId: 2, skillId: 12, requiredLevel: 'advanced', importance: 'required', weight: 0.8 },
  { id: 12, roleId: 2, skillId: 17, requiredLevel: 'intermediate', importance: 'preferred', weight: 0.5 },
  
  // Backend Engineer
  { id: 13, roleId: 3, skillId: 3, requiredLevel: 'advanced', importance: 'required', weight: 0.9 },
  { id: 14, roleId: 3, skillId: 10, requiredLevel: 'advanced', importance: 'required', weight: 0.85 },
  { id: 15, roleId: 3, skillId: 11, requiredLevel: 'advanced', importance: 'required', weight: 0.9 },
  { id: 16, roleId: 3, skillId: 12, requiredLevel: 'advanced', importance: 'required', weight: 0.9 },
  { id: 17, roleId: 3, skillId: 17, requiredLevel: 'intermediate', importance: 'required', weight: 0.7 },
  
  // Data Scientist
  { id: 18, roleId: 4, skillId: 3, requiredLevel: 'advanced', importance: 'required', weight: 0.95 },
  { id: 19, roleId: 4, skillId: 14, requiredLevel: 'advanced', importance: 'required', weight: 0.95 },
  { id: 20, roleId: 4, skillId: 15, requiredLevel: 'advanced', importance: 'required', weight: 0.9 },
  { id: 21, roleId: 4, skillId: 16, requiredLevel: 'advanced', importance: 'required', weight: 0.85 },
  
  // DevOps Engineer
  { id: 22, roleId: 5, skillId: 17, requiredLevel: 'advanced', importance: 'required', weight: 0.95 },
  { id: 23, roleId: 5, skillId: 18, requiredLevel: 'advanced', importance: 'required', weight: 0.9 },
  { id: 24, roleId: 5, skillId: 19, requiredLevel: 'advanced', importance: 'required', weight: 0.9 },
  { id: 25, roleId: 5, skillId: 20, requiredLevel: 'intermediate', importance: 'required', weight: 0.8 },
  { id: 26, roleId: 5, skillId: 3, requiredLevel: 'intermediate', importance: 'preferred', weight: 0.6 },
];

// Sample user skills (simulating an assessed user)
export const sampleUserSkills: UserSkill[] = [
  { id: 1, userId: 1, skillId: 1, level: 'advanced', confidence: 85, score: 78, assessedAt: new Date(), version: 1 },
  { id: 2, userId: 1, skillId: 2, level: 'intermediate', confidence: 70, score: 55, assessedAt: new Date(), version: 1 },
  { id: 3, userId: 1, skillId: 3, level: 'beginner', confidence: 40, score: 30, assessedAt: new Date(), version: 1 },
  { id: 4, userId: 1, skillId: 6, level: 'advanced', confidence: 90, score: 82, assessedAt: new Date(), version: 1 },
  { id: 5, userId: 1, skillId: 8, level: 'advanced', confidence: 85, score: 75, assessedAt: new Date(), version: 1 },
  { id: 6, userId: 1, skillId: 10, level: 'intermediate', confidence: 65, score: 48, assessedAt: new Date(), version: 1 },
  { id: 7, userId: 1, skillId: 11, level: 'beginner', confidence: 50, score: 35, assessedAt: new Date(), version: 1 },
  { id: 8, userId: 1, skillId: 12, level: 'intermediate', confidence: 70, score: 52, assessedAt: new Date(), version: 1 },
  { id: 9, userId: 1, skillId: 17, level: 'beginner', confidence: 45, score: 28, assessedAt: new Date(), version: 1 },
  { id: 10, userId: 1, skillId: 33, level: 'advanced', confidence: 85, score: 80, assessedAt: new Date(), version: 1 },
  { id: 11, userId: 1, skillId: 34, level: 'advanced', confidence: 80, score: 75, assessedAt: new Date(), version: 1 },
];

// Helper function to get skill by ID
export function getSkillById(skillId: number): Skill | undefined {
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
  { id: 1, title: 'Modern JavaScript Complete Guide', type: 'course', provider: 'Udemy', url: '#', duration: '40 hours', difficulty: 'intermediate', rating: 4.8, cost: 'paid' },
  { id: 2, title: 'TypeScript Deep Dive', type: 'book', provider: 'Basarat', url: '#', duration: '15 hours', difficulty: 'intermediate', rating: 4.9, cost: 'free' },
  { id: 3, title: 'React - The Complete Guide', type: 'course', provider: 'Udemy', url: '#', duration: '48 hours', difficulty: 'intermediate', rating: 4.8, cost: 'paid' },
  { id: 4, title: 'Node.js Design Patterns', type: 'book', provider: "O'Reilly", url: '#', duration: '20 hours', difficulty: 'advanced', rating: 4.7, cost: 'paid' },
  { id: 5, title: 'PostgreSQL Tutorial', type: 'tutorial', provider: 'PostgreSQL.org', url: '#', duration: '10 hours', difficulty: 'beginner', rating: 4.5, cost: 'free' },
  { id: 6, title: 'Docker Mastery', type: 'course', provider: 'Docker', url: '#', duration: '22 hours', difficulty: 'intermediate', rating: 4.7, cost: 'paid' },
  { id: 7, title: 'AWS Certified Solutions Architect', type: 'course', provider: 'A Cloud Guru', url: '#', duration: '35 hours', difficulty: 'advanced', rating: 4.8, cost: 'paid' },
  { id: 8, title: 'Machine Learning Crash Course', type: 'course', provider: 'Google', url: '#', duration: '15 hours', difficulty: 'beginner', rating: 4.6, cost: 'free' },
];

// Generate a learning path for a target role
export function generateLearningPath(userSkills: UserSkill[], targetRoleId: number): LearningPath {
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
        id: order,
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
    id: 1,
    userId: 1,
    targetRoleId,
    targetRole: role,
    steps,
    totalDuration: `${totalWeeks} weeks`,
    progress: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
