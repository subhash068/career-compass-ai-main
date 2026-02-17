import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Trophy, 
  Star, 
  Target, 
  Zap, 
  Crown, 
  Medal,
  Flame,
  Rocket,
  Brain,
  Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  unlocked: boolean;
  progress: number;
  color: string;
}

export function Achievements() {
  const { userSkills, isLoadingSkills, careerMatches, learningPath } = useApp();

  // Calculate achievements based on user data
  const achievements = [

    {
      id: 'first-assessment',
      title: 'First Steps',
      description: 'Complete your first skill assessment',
      icon: Target,
      unlocked: userSkills.length >= 1,
      progress: Math.min((userSkills.length / 1) * 100, 100),
      color: 'bg-blue-500'
    },
    {
      id: 'skill-master',
      title: 'Skill Master',
      description: 'Achieve expert level in 3 skills',
      icon: Crown,
      unlocked: userSkills.filter((s: any) => (s.score || 0) >= 80).length >= 3,
      progress: Math.min((userSkills.filter((s: any) => (s.score || 0) >= 80).length / 3) * 100, 100),
      color: 'bg-yellow-500'
    },
    {
      id: 'assessment-streak',
      title: 'Assessment Streak',
      description: 'Complete 10 skill assessments',
      icon: Flame,
      unlocked: userSkills.length >= 10,
      progress: Math.min((userSkills.length / 10) * 100, 100),
      color: 'bg-orange-500'
    },
    {
      id: 'career-explorer',
      title: 'Career Explorer',
      description: 'View 5 career matches',
      icon: Rocket,
      unlocked: careerMatches.length >= 5,
      progress: Math.min((careerMatches.length / 5) * 100, 100),
      color: 'bg-purple-500'
    },
    {
      id: 'learning-starter',
      title: 'Learning Starter',
      description: 'Begin your first learning path',
      icon: Brain,
      unlocked: learningPath !== null,
      progress: learningPath ? 100 : 0,
      color: 'bg-green-500'
    },
    {
      id: 'path-completer',
      title: 'Path Completer',
      description: 'Complete a learning path',
      icon: Medal,
      unlocked: (learningPath?.progress || 0) === 100,
      progress: learningPath?.progress || 0,
      color: 'bg-pink-500'
    },
    {
      id: 'quick-learner',
      title: 'Quick Learner',
      description: 'Score 90%+ on any assessment',
      icon: Zap,
      unlocked: userSkills.some((s: any) => (s.score || 0) >= 90),
      progress: userSkills.some((s: any) => (s.score || 0) >= 90) ? 100 : 
        Math.max(...userSkills.map((s: any) => s.score || 0), 0),
      color: 'bg-red-500'
    },
    {
      id: 'knowledge-seeker',
      title: 'Knowledge Seeker',
      description: 'Complete 20 assessments',
      icon: Lightbulb,
      unlocked: userSkills.length >= 20,
      progress: Math.min((userSkills.length / 20) * 100, 100),
      color: 'bg-indigo-500'
    }
  ];

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  if (isLoadingSkills) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Achievements
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {unlockedCount} of {totalCount} unlocked
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="font-bold">{unlockedCount}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-3">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={cn(
                "relative aspect-square rounded-lg p-2 flex flex-col items-center justify-center text-center transition-all cursor-pointer group",
                achievement.unlocked 
                  ? "bg-muted hover:bg-muted/80" 
                  : "bg-muted/30 opacity-60 grayscale"
              )}
              title={`${achievement.title}: ${achievement.description} (${Math.round(achievement.progress)}%)`}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center mb-1",
                achievement.unlocked ? achievement.color : "bg-gray-300",
                "text-white"
              )}>
                <achievement.icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-medium leading-tight line-clamp-2">
                {achievement.title}
              </span>
              
              {/* Progress bar for locked achievements */}
              {!achievement.unlocked && achievement.progress > 0 && (
                <div className="absolute bottom-1 left-1 right-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full rounded-full", achievement.color)}
                    style={{ width: `${achievement.progress}%` }}
                  />
                </div>
              )}
              
              {/* Unlocked indicator */}
              {achievement.unlocked && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <Star className="w-2.5 h-2.5 text-white fill-white" />
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
