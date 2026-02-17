import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  GraduationCap, 
  Clock, 
  CheckCircle2, 
  Play,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

export function LearningPathCard() {
  const { learningPath, isLoadingLearning } = useApp();

  if (isLoadingLearning) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-2 w-full" />
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!learningPath) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-purple-500" />
            Learning Path
          </CardTitle>
          <p className="text-sm text-muted-foreground">Your personalized learning journey</p>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-muted-foreground mb-4">No active learning path</p>
            <Button asChild>
              <Link to="/careers">
                Explore Careers
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const completedSteps = learningPath.steps?.filter((s: any) => s.isCompleted).length || 0;
  const totalSteps = learningPath.steps?.length || 0;
  const progress = learningPath.progress || 0;
  const nextStep = learningPath.steps?.find((s: any) => !s.isCompleted);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-purple-500" />
              Learning Path
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {completedSteps} of {totalSteps} steps completed
            </p>
          </div>
          <Badge variant={progress === 100 ? "default" : "outline"}>
            {progress === 100 ? 'Completed' : `${progress}%`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">{learningPath.targetRole?.title || 'Career Goal'}</span>
            <span className="text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {nextStep && (
          <div className="p-3 rounded-lg border border-border bg-muted/50">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Play className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Next: {nextStep.skill?.name || 'Next Step'}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {nextStep.estimatedDuration || '2-3 hours'}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {learningPath.steps?.slice(0, 3).map((step: any, index: number) => (
            <div 
              key={step.id || index} 
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                step.isCompleted 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {step.isCompleted ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <span className="text-xs font-medium">{index + 1}</span>
                )}
              </div>
              <span className={`text-sm truncate ${step.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                {step.skill?.name || `Step ${index + 1}`}
              </span>
            </div>
          ))}
        </div>

        <Button variant="outline" className="w-full" asChild>
          <Link to="/learning">
            {progress === 100 ? 'View Certificate' : 'Continue Learning'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
