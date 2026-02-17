import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, TrendingUp, GraduationCap, CheckCircle2, Award, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useApp } from '@/contexts/AppContext';
import { useEffect, useState } from 'react';

interface Activity {
  id: number;
  type: 'assessment' | 'gap' | 'learning' | 'achievement' | 'career';
  icon: React.ElementType;
  title: string;
  time: string;
  color: string;
}

export function RecentActivity() {
  const { userSkills, isLoadingSkills, careerMatches, learningPath } = useApp();
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    const newActivities: Activity[] = [];

    // Add recent assessments (from user skills)
    if (userSkills.length > 0) {
      const recentSkills = [...userSkills]
        .sort((a, b) => {
          const dateA = a.assessedAt || a.assessed_at || new Date(0);
          const dateB = b.assessedAt || b.assessed_at || new Date(0);
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        })
        .slice(0, 3);

      recentSkills.forEach((skill, index) => {
        const skillName = skill.skill?.name || skill.skill_name || `Skill ${skill.skill_id}`;
        const assessedAt = skill.assessedAt || skill.assessed_at || new Date();
        newActivities.push({
          id: index,
          type: 'assessment',
          icon: Target,
          title: `Completed ${skillName} Assessment - ${(skill.score || 0).toFixed(0)}%`,
          time: formatTimeAgo(new Date(assessedAt)),
          color: 'text-primary bg-primary/10',
        });
      });
    }

    // Add career match info
    const matches = Array.isArray(careerMatches) ? careerMatches : [];
    if (matches.length > 0) {
      const topMatch = matches[0];
      newActivities.push({
        id: newActivities.length,
        type: 'career',
        icon: Briefcase,
        title: `Top career match: ${topMatch.title || 'Unknown'} (${topMatch.match_percentage || 0}%)`,
        time: 'Based on your skills',
        color: 'text-blue-600 bg-blue-100',
      });
    }

    // Add gap identification if there are missing skills
    const allMissingSkills = matches.flatMap((m: any) => m.missing_skills || []);
    if (allMissingSkills.length > 0) {
      newActivities.push({
        id: newActivities.length,
        type: 'gap',
        icon: TrendingUp,
        title: `${allMissingSkills.length} skill gaps identified`,
        time: 'Recently',
        color: 'text-warning bg-warning/10',
      });
    }

    // Add learning path progress
    if (learningPath && (learningPath.progress || 0) > 0) {
      newActivities.push({
        id: newActivities.length,
        type: 'learning',
        icon: GraduationCap,
        title: `Learning path progress: ${learningPath.progress}%`,
        time: 'In progress',
        color: 'text-success bg-success/10',
      });
    }

    // Add achievement if user has high scores
    const highScores = userSkills.filter(s => (s.score || 0) >= 80);
    if (highScores.length > 0) {
      newActivities.push({
        id: newActivities.length,
        type: 'achievement',
        icon: Award,
        title: `Achievement: ${highScores.length} expert level skills!`,
        time: 'Earned',
        color: 'text-yellow-600 bg-yellow-100',
      });
    }

    setActivities(newActivities.slice(0, 5));
  }, [userSkills, careerMatches, learningPath]);

  if (isLoadingSkills) {
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

  if (activities.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-display">Recent Activity</CardTitle>
          <p className="text-sm text-muted-foreground">Your learning journey timeline</p>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Complete assessments to see your activity</p>
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
            <div key={activity.id} className="flex items-start gap-3 relative">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", activity.color)}>
                <activity.icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{activity.title}</p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
              {index < activities.length - 1 && (
                <div className="absolute left-4 top-8 h-6 w-px bg-border" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return date.toLocaleDateString();
}
