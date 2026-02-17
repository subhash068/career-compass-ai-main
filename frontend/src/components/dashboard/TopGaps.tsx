import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

// API response format
interface CareerMatchFromAPI {
  role_id: number;
  title: string;
  level: string;
  match_percentage: number;
  matched_skills: string[];
  missing_skills: string[];
  missing_severity?: { skill: string; severity: string; priority: number }[];
  improvement_priority?: string[];
  explanation?: string;
}

export function TopGaps() {
  const { careerMatches, isLoadingCareers } = useApp();

  // Extract gaps from career matches
  const matches = Array.isArray(careerMatches) ? careerMatches : [];
  
  // Get missing skills from all career matches and flatten
  const allMissingSkills = matches.flatMap((match: any) => {
    if (!match) return [];
    
    // If missing_severity is available, use it for detailed info
    if (Array.isArray(match.missing_severity) && match.missing_severity.length > 0) {
      return match.missing_severity.map((item: any) => ({
        skill: item?.skill || 'Unknown',
        severity: item?.severity || 'medium',
        priority: item?.priority || 5,
      }));
    }
    // Otherwise just use missing_skills array
    return (Array.isArray(match.missing_skills) ? match.missing_skills : []).map((skill: string) => ({
      skill: skill || 'Unknown',
      severity: 'medium',
      priority: 5,
    }));
  });

  // Remove duplicates and sort by priority
  const uniqueGaps = Array.isArray(allMissingSkills) 
    ? allMissingSkills
        .filter((gap, index, self) => 
          gap && gap.skill && index === self.findIndex(g => g?.skill === gap?.skill)
        )
        .sort((a, b) => (b?.priority || 0) - (a?.priority || 0))
        .slice(0, 5)
    : [];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (isLoadingCareers) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-display">Priority Skill Gaps</CardTitle>
            <p className="text-sm text-muted-foreground">Focus areas for maximum impact</p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/gaps" className="gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {uniqueGaps.map((gap, index) => (
          <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-warning" />
              </div>
              <div>
                <span className="font-medium text-sm block">{gap.skill}</span>
                <span className="text-xs text-muted-foreground">Priority: {gap.priority}/10</span>
              </div>
            </div>
            <Badge variant="outline" className={getSeverityColor(gap.severity)}>
              {gap.severity}
            </Badge>
          </div>
        ))}
        {uniqueGaps.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Complete your skill assessment to see gaps</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
