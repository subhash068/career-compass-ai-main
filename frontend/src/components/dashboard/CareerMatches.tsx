import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressRing } from '@/components/ui/progress-ring';
import { ArrowRight, TrendingUp, Briefcase, DollarSign, Clock, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

// API response format
interface CareerMatchFromAPI {
  role_id: number;
  title: string;
  level: string;
  match_percentage: number;
  matched_skills: string[];
  missing_skills: string[];
  explanation?: string;
  average_salary?: {
    min: number;
    max: number;
    currency: string;
  };
  growth_rate?: number;
  market_outlook?: string;
  estimated_time_to_qualify?: string;
  key_skills?: string[];
}

export function CareerMatches() {
  const { careerMatches, isLoadingCareers } = useApp();
  
  // Handle both old and new API formats
  const matches = Array.isArray(careerMatches) ? careerMatches : [];
  const topMatches = matches.slice(0, 3) as any[];

  const formatSalary = (min: number, max: number) => {
    return `$${(min / 1000).toFixed(0)}k-${(max / 1000).toFixed(0)}k`;
  };

  const getOutlookColor = (outlook: string) => {
    switch (outlook) {
      case 'Excellent': return 'bg-green-100 text-green-800';
      case 'Good': return 'bg-blue-100 text-blue-800';
      case 'Moderate': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoadingCareers) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3">
              <Skeleton className="w-14 h-14 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
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
            <CardTitle className="text-lg font-display">Top Career Matches</CardTitle>
            <p className="text-sm text-muted-foreground">Based on your current skills</p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/careers" className="gap-1">
              Explore <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {topMatches.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Complete assessments to see career matches</p>
          </div>
        ) : (
          topMatches.map((match, index) => {
            const matchScore = match.match_percentage || match.matchScore || 0;
            const hasSalary = match.average_salary || match.averageSalary;
            const hasGrowth = match.growth_rate || match.growthRate;
            
            return (
              <div
                key={match.role_id || match.roleId}
                className={cn(
                  "flex items-start gap-4 p-3 rounded-lg border transition-colors hover:bg-muted/50",
                  index === 0 && "border-primary/30 bg-primary/5"
                )}
              >
                <ProgressRing value={matchScore} size={56} strokeWidth={5}>
                  <span className="text-sm font-bold">{Math.round(matchScore)}%</span>
                </ProgressRing>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-sm truncate">{match.title}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground capitalize">
                          {match.level}
                        </span>
                        {match.market_outlook && (
                          <Badge className={cn("text-[10px] px-1.5 py-0", getOutlookColor(match.market_outlook))}>
                            {match.market_outlook}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {index === 0 && (
                      <Star className="w-4 h-4 text-primary fill-primary flex-shrink-0" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {match.matched_skills?.length || match.matchedCount || 0} skills
                    </span>
                    
                    {hasSalary && (
                      <span className="flex items-center gap-1 text-green-600">
                        <DollarSign className="w-3 h-3" />
                        {formatSalary(
                          hasSalary.min || 50000, 
                          hasSalary.max || 100000
                        )}
                      </span>
                    )}
                    
                    {hasGrowth && (
                      <span className="flex items-center gap-1 text-blue-600">
                        <TrendingUp className="w-3 h-3" />
                        +{(hasGrowth || 0).toFixed(0)}%
                      </span>
                    )}
                  </div>

                  {match.estimated_time_to_qualify && match.estimated_time_to_qualify !== 'Ready now' && (
                    <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>Est. {match.estimated_time_to_qualify} to qualify</span>
                    </div>
                  )}

                  {match.key_skills && match.key_skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {match.key_skills.slice(0, 2).map((skill: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
