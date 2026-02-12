import { useEffect, useState } from 'react';
import { StatCard } from '@/components/ui/stat-card';
import { SkillsOverview } from '@/components/dashboard/SkillsOverview';
import { TopGaps } from '@/components/dashboard/TopGaps';
import { CareerMatches } from '@/components/dashboard/CareerMatches';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { Target, TrendingUp, Briefcase, GraduationCap, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { skillsApi } from '@/api/skills.api';
import { careerApi } from '@/api/career.api';
import { CareerMatch, SkillGap, UserSkill } from '@/types';

export default function Dashboard() {
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [careerMatches, setCareerMatches] = useState<CareerMatch[]>([]);
  const [allGaps, setAllGaps] = useState<SkillGap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch skills analysis
        const skillsAnalysis = await skillsApi.analyzeSkills();
        setUserSkills(skillsAnalysis.skills || []);
        setAllGaps((skillsAnalysis.gaps || []).map(gap => ({
          skillId: parseInt(gap.skillId),
          skill: { id: parseInt(gap.skillId), name: '', description: '', categoryId: '', demandLevel: 0 },
          currentLevel: 'beginner',
          requiredLevel: 'intermediate',
          currentScore: 0,
          requiredScore: 0,
          gapScore: gap.gapScore,
          severity: gap.severity as 'low' | 'medium' | 'high',
          priority: gap.priority,
        })));

        // Fetch career recommendations
        const careerData = await careerApi.getRecommendations();
        setCareerMatches(careerData.recommendations);

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const avgSkillScore = userSkills.length > 0
    ? Math.round(userSkills.reduce((sum, s) => sum + s.score, 0) / userSkills.length)
    : 0;

  const topMatch = careerMatches[0];
  const uniqueGapCount = [...new Set(allGaps.map(g => g.skillId))].length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display">Welcome back! 👋</h1>
          <p className="text-muted-foreground mt-1">
            Track your skill development and career progress
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link to="/skill_selection">
              <Target className="w-4 h-4 mr-2" />
              Take Assessment
            </Link>
          </Button>
          <Button asChild>
            <Link to="/assistant">
              <Sparkles className="w-4 h-4 mr-2" />
              Ask AI
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Overall Skill Score"
          value={`${avgSkillScore}%`}
          subtitle={`${userSkills.length} skills assessed`}
          icon={Target}
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Skill Gaps"
          value={uniqueGapCount}
          subtitle="Areas for improvement"
          icon={TrendingUp}
          iconClassName="bg-warning/10"
        />
        <StatCard
          title="Best Career Match"
          value={topMatch?.matchScore ? `${topMatch.matchScore}%` : '-'}
          subtitle={topMatch?.role.title || 'Complete assessment'}
          icon={Briefcase}
          iconClassName="bg-success/10"
        />
        <StatCard
          title="Learning Progress"
          value="0%"
          subtitle="Start a learning path"
          icon={GraduationCap}
          iconClassName="bg-accent/10"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SkillsOverview />
        <TopGaps />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <CareerMatches />
        <RecentActivity />
      </div>
    </div>
  );
}
