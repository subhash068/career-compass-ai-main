import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, TrendingUp, GraduationCap, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useApp } from '@/contexts/AppContext';

const activities = [
  {
    id: 1,
    type: 'assessment',
    icon: Target,
    title: 'Completed TypeScript Assessment',
    time: '2 hours ago',
    color: 'text-primary bg-primary/10',
  },
  {
    id: 2,
    type: 'gap',
    icon: TrendingUp,
    title: 'New gap identified: Docker',
    time: '1 day ago',
    color: 'text-warning bg-warning/10',
  },
  {
    id: 3,
    type: 'learning',
    icon: GraduationCap,
    title: 'Started React Advanced Course',
    time: '2 days ago',
    color: 'text-success bg-success/10',
  },
  {
    id: 4,
    type: 'chat',
    icon: MessageSquare,
    title: 'AI Career consultation',
    time: '3 days ago',
    color: 'text-accent bg-accent/10',
  },
];

export function RecentActivity() {
  const { isLoadingCareers } = useApp();

  if (isLoadingCareers) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-display">Recent Activity</CardTitle>
        <p className="text-sm text-muted-foreground">Your learning journey timeline</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={activity.id} className="flex items-start gap-3">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", activity.color)}>
                <activity.icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{activity.title}</p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
              {index < activities.length - 1 && (
                <div className="absolute left-7 top-10 h-8 w-px bg-border" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
