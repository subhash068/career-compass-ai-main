import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GapBadge } from '@/components/ui/skill-badge';
import { Progress } from '@/components/ui/progress';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function TopGaps() {
  const { allGaps, isLoadingCareers } = useApp();

  // Get unique gaps sorted by priority
  const uniqueGaps = allGaps
    .filter((gap, index, self) =>
      index === self.findIndex(g => g.skillId === gap.skillId)
    )
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 5);

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
        {uniqueGaps.map((gap) => (
          <div key={gap.skillId} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{gap.skill.name}</span>
                <GapBadge severity={gap.severity} />
              </div>
              <span className="text-xs text-muted-foreground">
                {gap.currentScore} → {gap.requiredScore}
              </span>
            </div>
            <div className="relative">
              <Progress value={gap.currentScore} className="h-2" />
              <div
                className="absolute top-0 h-2 w-0.5 bg-destructive"
                style={{ left: `${gap.requiredScore}%` }}
              />
            </div>
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
