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
import { TrendingUp, AlertTriangle, CheckCircle2, ArrowRight, Loader2, Filter } from 'lucide-react';
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
  severity: 'low' | 'medium' | 'high' | 'none';
  priority: number;
}

interface CareerMatch {
  [key: string]: any;
}

export default function GapAnalysis() {
  const { allGaps, careerMatches, isLoadingCareers } = useApp();
  const [detailedGaps, setDetailedGaps] = useState<SkillGap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string>('all');

  // Fetch detailed gap analysis from API, but also use AppContext data
  useEffect(() => {
    const fetchGapAnalysis = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch detailed skills analysis to get current/required scores
        let skillsResponse;
        try {
          skillsResponse = await skillsApi.analyzeSkills();
        } catch (apiErr) {
          console.error('API call failed:', apiErr);
          skillsResponse = null;
        }
        
        // Safely extract data from response
        let skillsAnalysis: any = { gaps: [] };
        if (skillsResponse && typeof skillsResponse === 'object') {
          // Handle both {data: {gaps: []}} and {gaps: []} formats
          if (skillsResponse.data && typeof skillsResponse.data === 'object') {
            skillsAnalysis = skillsResponse.data;
          } else if (Array.isArray(skillsResponse.gaps)) {
            skillsAnalysis = skillsResponse;
          }
        }
        
        // Ensure gaps is an array
        const gapsArray = Array.isArray(skillsAnalysis?.gaps) ? skillsAnalysis.gaps : [];
        
        // Map ALL skills from the response (including those with no gap)
        const mappedGaps = Array.isArray(gapsArray) ? gapsArray.map((gap: any) => ({
          skillId: gap?.skillId || '',
          skill: { 
            id: gap?.skill?.id || gap?.skillId || '', 
            name: gap?.skill?.name || 'Unknown Skill', 
            description: gap?.skill?.description || '', 
            categoryId: gap?.skill?.categoryId || '', 
            demandLevel: gap?.skill?.demandLevel || 0 
          },
          currentLevel: gap?.currentLevel || 'beginner',
          requiredLevel: gap?.requiredLevel || 'intermediate',
          currentScore: gap?.currentScore || 0,
          requiredScore: gap?.requiredScore || 0,
          gapScore: gap?.gapScore || 0,
          severity: (gap?.severity as 'low' | 'medium' | 'high' | 'none') || 'none',
          priority: gap?.priority || 0,
        })) : [];
        
        setDetailedGaps(mappedGaps);

      } catch (err) {
        console.error('Error fetching gap analysis:', err);
        setError('Failed to load gap analysis. Please try again.');
        setDetailedGaps([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGapAnalysis();
  }, []);

  // Combine AppContext gaps with detailed gaps for display
  // Use detailedGaps as primary since it has full skill objects from API
  // Enhance with AppContext severity/priority if available
  const safeAllGaps = Array.isArray(allGaps) ? allGaps : [];
  const safeDetailedGaps = Array.isArray(detailedGaps) ? detailedGaps : [];
  
  const combinedGaps = safeDetailedGaps.length > 0 
    ? safeDetailedGaps.map((detailed: any) => {
        // Find matching AppContext gap for severity/priority
        const appGap = safeAllGaps.find((g: any) => {
          const gSkillName = typeof g?.skill === 'object' ? g?.skill?.name : g?.skill;
          return gSkillName === detailed?.skill?.name || g?.skillId === detailed?.skillId;
        });
        return {
          ...detailed,
          severity: appGap?.severity || detailed?.severity || 'none',
          priority: appGap?.priority || detailed?.priority || 5,
        };
      })
    : safeAllGaps.map((appGap: any) => ({
        // Fallback: convert AppContext gaps to full format
        skillId: appGap?.skillId || appGap?.skill || '',
        skill: { 
          id: appGap?.skillId || appGap?.skill || '', 
          name: typeof appGap?.skill === 'object' ? appGap?.skill?.name : appGap?.skill, 
          description: '', 
          categoryId: '', 
          demandLevel: 0 
        },
        currentLevel: 'beginner',
        requiredLevel: 'intermediate',
        currentScore: 0,
        requiredScore: 0,
        gapScore: 0,
        severity: appGap?.severity || 'none',
        priority: appGap?.priority || 5,
      }));

  // Get unique skills - ALL of them, including complete ones
  const uniqueSkills = Array.isArray(combinedGaps) 
    ? combinedGaps
        .filter(gap => gap && gap.skillId) // Only include valid skills
        .filter((gap, index, self) =>
          index === self.findIndex(g => g.skillId === gap.skillId)
        )
        .sort((a, b) => {
          // Sort by priority first (gaps first), then by gap score
          if (a.severity === 'none' && b.severity !== 'none') return 1;
          if (a.severity !== 'none' && b.severity === 'none') return -1;
          return (b?.gapScore || 0) - (a?.gapScore || 0);
        })
    : [];
  
  // Get only gaps for stats (skills with actual gaps)
  const uniqueGaps = uniqueSkills.filter(g => (g?.gapScore || 0) > 0);
  
  // Stats
  const highGaps = uniqueGaps.filter(g => g?.severity === 'high').length;
  const mediumGaps = uniqueGaps.filter(g => g?.severity === 'medium').length;
  const lowGaps = uniqueGaps.filter(g => g?.severity === 'low').length;

  // Get all available domains from skillCategories for filter
  const availableDomains = skillCategories.map(cat => cat.id);
  
  // Filter skills by selected domain (show ALL skills for that domain, not just gaps)
  const filteredSkills = selectedDomain === 'all' 
    ? uniqueSkills 
    : uniqueSkills.filter(skill => {
        // Handle both string and number comparison
        const skillDomain = String(skill?.skill?.categoryId || '');
        const selectedDomainStr = String(selectedDomain);
        return skillDomain === selectedDomainStr;
      });

  // Chart data - use ALL filtered skills (including complete ones)
  const chartData = Array.isArray(filteredSkills) 
    ? filteredSkills.slice(0, 8).map(skill => ({
        name: skill?.skill?.name?.length > 10 ? skill.skill.name.slice(0, 10) + '...' : (skill?.skill?.name || 'Unknown'),
        current: skill?.currentScore || 0,
        required: skill?.requiredScore || 0,
        gap: skill?.gapScore || 0,
        severity: skill?.severity || 'none',
        categoryId: skill?.skill?.categoryId || '',
        isComplete: skill?.severity === 'none' || (skill?.gapScore || 0) <= 0
      }))
    : [];

  if (loading || isLoadingCareers) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading gap analysis...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <p className="text-destructive font-medium">{error}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Skill Gap Analysis</h1>
        <p className="text-muted-foreground">
          Identify and prioritize skills to develop for your target careers
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Start Learning Path</p>
                <p className="text-2xl font-bold">{uniqueGaps.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Critical Gaps</p>
                <p className="text-2xl font-bold text-destructive">{highGaps}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Moderate Gaps</p>
                <p className="text-2xl font-bold text-warning">{mediumGaps}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gap Overview Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Gap Overview
              </CardTitle>
              
              {/* Domain Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="text-sm border rounded-md px-2 py-1 bg-background"
                >
                  <option value="all">All Domains</option>
                  {skillCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Current vs required skill levels
            </p>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      domain={[0, 100]}
                      label={{ value: 'Score (%)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-background border rounded-lg p-3 shadow-lg">
                              <p className="font-semibold mb-1">{data.name}</p>
                              <p className="text-sm text-muted-foreground">Current: {data.current}%</p>
                              <p className="text-sm text-muted-foreground">Required: {data.required}%</p>
                              {data.gap > 0 ? (
                                <p className="text-sm text-destructive">Gap: {data.gap} points</p>
                              ) : (
                                <p className="text-sm text-success">✓ Skill complete!</p>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="current" name="Current" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="required" name="Required" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No skills to display for the selected domain
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gap Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Gap Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">High Priority</span>
                <span className="font-semibold text-destructive">{highGaps}</span>
              </div>
              <Progress value={highGaps > 0 ? 100 : 0} className="h-2 bg-destructive/20" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Medium Priority</span>
                <span className="font-semibold text-warning">{mediumGaps}</span>
              </div>
              <Progress value={mediumGaps > 0 ? 66 : 0} className="h-2 bg-warning/20" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Low Priority</span>
                <span className="font-semibold text-success">{lowGaps}</span>
              </div>
              <Progress value={lowGaps > 0 ? 33 : 0} className="h-2 bg-success/20" />
              
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="font-medium">Complete Skills</span>
                <span className="font-semibold text-success">
                  {uniqueSkills.filter(g => g.severity === 'none').length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gap Details */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Gap Details</CardTitle>
          <p className="text-sm text-muted-foreground">
            All assessed skills sorted by priority
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredSkills.map((gap, index) => {
              const category = skillCategories.find(c => c.id === gap.skill.categoryId);
              const isComplete = gap.severity === 'none' || gap.gapScore <= 0;
              
              return (
                <div 
                  key={`${gap.skillId}-${index}`}
                  className={cn(
                    "p-4 rounded-lg border transition-colors",
                    isComplete ? "bg-success/5 border-success/20" : "bg-card hover:bg-accent/50"
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{gap.skill.name}</h4>
                        {isComplete ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-success/20 text-success">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Complete
                          </span>
                        ) : (
                          <GapBadge severity={gap.severity as 'low' | 'medium' | 'high'} />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {category?.name} • Priority: {gap.priority}/10
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <SkillBadge level={gap.currentLevel} />
                        {!isComplete && (
                          <>
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                            <SkillBadge level={gap.requiredLevel} />
                          </>
                        )}
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
                        className={cn(
                          "absolute left-0 top-0 h-full rounded-full transition-all",
                          isComplete ? "bg-success" : "bg-primary"
                        )}
                        style={{ width: `${gap.currentScore}%` }}
                      />
                      {!isComplete && (
                        <div 
                          className="absolute top-0 h-full w-0.5 bg-destructive"
                          style={{ left: `${gap.requiredScore}%` }}
                        />
                      )}
                    </div>
                    {isComplete ? (
                      <p className="text-xs text-success">
                        ✓ You've met the target for this skill!
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Need to improve by <span className="font-medium text-foreground">{gap.gapScore} points</span>
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            
            {filteredSkills.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-success" />
                <p className="font-medium">No skills found for this domain!</p>
                <p className="text-sm">Try selecting a different domain or take an assessment.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
