import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { skillCategories } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GapBadge, SkillBadge } from '@/components/ui/skill-badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { TrendingUp, AlertTriangle, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { skillsApi } from '@/api/skills.api.ts';
import { careerApi } from '@/api/career.api.ts';

interface SkillGap {
  skillId: string;
  skill: { id: string; name: string; description: string; categoryId: string; demandLevel: number };
  currentLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  requiredLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  currentScore: number;
  requiredScore: number;
  gapScore: number;
  severity: 'low' | 'medium' | 'high';
  priority: number;
}

interface CareerMatch {
  [key: string]: any;
}

export default function GapAnalysis() {
  const [allGaps, setAllGaps] = useState<SkillGap[]>([]);
  const [careerMatches, setCareerMatches] = useState<CareerMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGapAnalysis = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch skills analysis to get gaps
        const skillsAnalysis = await skillsApi.analyzeSkills();
        setAllGaps((skillsAnalysis.gaps || []).map(gap => ({
          skillId: gap.skillId,
          skill: { id: gap.skillId, name: gap.skill.name || 'Unknown Skill', description: '', categoryId: '', demandLevel: 0 },
          currentLevel: 'beginner',
          requiredLevel: 'intermediate',
          currentScore: gap.currentScore || 0,
          requiredScore: gap.requiredScore || 0,
          gapScore: gap.gapScore,
          severity: gap.severity as 'low' | 'medium' | 'high',
          priority: gap.priority,
        })));

        // Fetch career recommendations
        const careerData = await careerApi.getRecommendations();
        setCareerMatches(careerData.recommendations);

      } catch (err) {
        console.error('Error fetching gap analysis:', err);
        setError('Failed to load gap analysis. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchGapAnalysis();
  }, []);

  // Get unique gaps
  const uniqueGaps = allGaps
    .filter((gap, index, self) =>
      index === self.findIndex(g => g.skillId === gap.skillId)
    )
    .sort((a, b) => b.gapScore - a.gapScore);

  // Stats
  const highGaps = uniqueGaps.filter(g => g.severity === 'high').length;
  const mediumGaps = uniqueGaps.filter(g => g.severity === 'medium').length;
  const lowGaps = uniqueGaps.filter(g => g.severity === 'low').length;

  // Chart data
  const chartData = uniqueGaps.slice(0, 8).map(gap => ({
    name: gap.skill.name.length > 10 ? gap.skill.name.slice(0, 10) + '...' : gap.skill.name,
    current: gap.currentScore,
    required: gap.requiredScore,
    gap: gap.gapScore,
    severity: gap.severity,
  }));

  const getBarColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'hsl(var(--gap-high))';
      case 'medium': return 'hsl(var(--gap-medium))';
      default: return 'hsl(var(--gap-low))';
    }
  };

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
          <h1 className="text-3xl font-bold font-display">Skill Gap Analysis</h1>
          <p className="text-muted-foreground mt-1">
            Identify and prioritize skills to develop for your target careers
          </p>
        </div>
        <Button asChild>
          <Link to="/learning">
            Start Learning Path <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </div>
      
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-gap-high">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gap-high/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-gap-high" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display">{highGaps}</p>
              <p className="text-sm text-muted-foreground">Critical Gaps</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-gap-medium">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gap-medium/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-gap-medium" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display">{mediumGaps}</p>
              <p className="text-sm text-muted-foreground">Moderate Gaps</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-gap-low">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gap-low/10 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-gap-low" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display">{lowGaps}</p>
              <p className="text-sm text-muted-foreground">Minor Gaps</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Gap Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Gap Overview</CardTitle>
          <p className="text-sm text-muted-foreground">Current vs required skill levels</p>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <XAxis type="number" domain={[0, 100]} />
                <YAxis type="category" dataKey="name" width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number, name: string) => [
                    `${value}%`,
                    name === 'current' ? 'Current' : name === 'required' ? 'Required' : 'Gap'
                  ]}
                />
                <Bar dataKey="current" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                <Bar dataKey="required" fill="hsl(var(--muted))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Detailed Gap List */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Gap Details</CardTitle>
          <p className="text-sm text-muted-foreground">All identified skill gaps sorted by priority</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {uniqueGaps.map((gap) => {
              const category = skillCategories.find(c => c.id === gap.skill.categoryId);
              return (
                <div 
                  key={gap.skillId}
                  className={cn(
                    "p-4 rounded-lg border transition-colors hover:bg-muted/30",
                    gap.severity === 'high' && "border-gap-high/30",
                    gap.severity === 'medium' && "border-gap-medium/30",
                    gap.severity === 'low' && "border-gap-low/30"
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{gap.skill.name}</h4>
                        <GapBadge severity={gap.severity} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {category?.name} • Priority: {gap.priority}/10
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <SkillBadge level={gap.currentLevel} />
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        <SkillBadge level={gap.requiredLevel} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Current: {gap.currentScore}%</span>
                      <span className="text-muted-foreground">Required: {gap.requiredScore}%</span>
                    </div>
                    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all"
                        style={{ width: `${gap.currentScore}%` }}
                      />
                      <div 
                        className="absolute top-0 h-full w-0.5 bg-destructive"
                        style={{ left: `${gap.requiredScore}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Need to improve by <span className="font-medium text-foreground">{gap.gapScore} points</span>
                    </p>
                  </div>
                </div>
              );
            })}
            
            {uniqueGaps.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-success" />
                <p className="font-medium">No skill gaps detected!</p>
                <p className="text-sm">You're well-prepared for your target careers.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
