import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressRing } from '@/components/ui/progress-ring';
import { ArrowRight, TrendingUp, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export function CareerMatches() {
  const { careerMatches, isLoadingCareers } = useApp();
  const topMatches = careerMatches.slice(0, 3);

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
        {topMatches.map((match, index) => (
          <div
            key={match.roleId}
            className={cn(
              "flex items-center gap-4 p-3 rounded-lg border transition-colors hover:bg-muted/50",
              index === 0 && "border-primary/30 bg-primary/5"
            )}
          >
            <ProgressRing value={match.matchScore} size={56} strokeWidth={5}>
              <span className="text-sm font-bold">{match.matchScore}%</span>
            </ProgressRing>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate">{match.role.title}</h4>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  ${Math.round(match.role.averageSalary.min / 1000)}k-${Math.round(match.role.averageSalary.max / 1000)}k
                </span>
                <span className="flex items-center gap-1 text-success">
                  <TrendingUp className="w-3 h-3" />
                  +{match.role.growthRate}%
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">
                {match.gaps.length > 0 ? (
                  <span className="text-warning">{match.gaps.length} gaps</span>
                ) : (
                  <span className="text-success">Ready!</span>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {match.estimatedTimeToQualify}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
