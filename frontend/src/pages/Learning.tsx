import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { SkillBadge } from '@/components/ui/skill-badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  GraduationCap, 
  Clock, 
  BookOpen, 
  Video, 
  FileText,
  ExternalLink,
  CheckCircle2,
  Target,
  Briefcase,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { learningApi } from '@/api/learning.api.ts';
import type { LearningResource, LearningPath, CareerMatch } from '@/types';

const resourceIcons: Record<LearningResource['type'], React.ComponentType<{ className?: string }>> = {
  course: GraduationCap,
  tutorial: BookOpen,
  book: FileText,
  video: Video,
  project: Target,
};

export default function Learning() {
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [selectedCareer, setSelectedCareer] = useState<CareerMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLearningPath = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if there's a selected career from localStorage
        const storedCareer = localStorage.getItem('selectedCareer');
        if (storedCareer) {
          const career = JSON.parse(storedCareer);
          setSelectedCareer(career);

          // Generate learning path for this career
          const pathData = await learningApi.generatePath(career.roleId);
          setLearningPath(pathData);
        } else {
          // Try to get existing learning path
          const existingPath = await learningApi.getPath();
          if (existingPath) {
            setLearningPath(existingPath);
          }
        }
      } catch (err) {
        console.error('Error fetching learning path:', err);
        setError('Failed to load learning path. Please select a career first.');
      } finally {
        setLoading(false);
      }
    };

    fetchLearningPath();
  }, []);

  const targetRole = learningPath?.targetRole || selectedCareer?.role;

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

  if (!learningPath) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold font-display">Learning Path</h1>
          <p className="text-muted-foreground mt-1">
            Your personalized roadmap to career success
          </p>
        </div>

        <Card className="p-12 text-center">
          <GraduationCap className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Learning Path Yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Select a target career from the Career Matches page to generate a personalized learning path.
          </p>
          <Button asChild>
            <Link to="/careers">
              <Briefcase className="w-4 h-4 mr-2" />
              Explore Careers
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display">Learning Path</h1>
          <p className="text-muted-foreground mt-1">
            Your roadmap to becoming a <span className="font-medium text-foreground">{targetRole?.title}</span>
          </p>
        </div>
        <Card className="p-4 min-w-[200px]">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Progress value={learningPath.progress} className="h-2 w-24" />
            </div>
            <span className="font-semibold">{learningPath.progress}%</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Estimated: {learningPath.totalDuration}
          </p>
        </Card>
      </div>
      
      {/* Learning Path Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
        
        <div className="space-y-6">
          {(learningPath.steps || []).map((step, index) => (
            <div key={step.id} className="relative pl-14">
              {/* Timeline node */}
              <div 
                className={cn(
                  "absolute left-4 -translate-x-1/2 w-5 h-5 rounded-full border-2 transition-colors",
                  step.isCompleted 
                    ? "bg-success border-success" 
                    : "bg-background border-primary"
                )}
              >
                {step.isCompleted && (
                  <CheckCircle2 className="w-full h-full text-success-foreground p-0.5" />
                )}
              </div>
              
              <Card className={cn(
                "transition-all",
                step.isCompleted && "opacity-75"
              )}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-muted-foreground">
                          Step {index + 1}
                        </span>
                        <SkillBadge level={step.targetLevel} />
                      </div>
                      <CardTitle className="text-lg font-display">
                        {step.skill?.name || 'Unknown Skill'}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={step.isCompleted}
                        onCheckedChange={async () => {
                          try {
                            if (learningPath) {
                              await learningApi.markStepComplete(learningPath.id, step.id);
                              // Refresh learning path
                              const updatedPath = await learningApi.getPath();
                              setLearningPath(updatedPath);
                            }
                          } catch (error) {
                            console.error('Error marking step complete:', error);
                          }
                        }}
                      />
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {step.estimatedDuration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      Target: {step.targetLevel}
                    </span>
                  </div>
                  
                  {(step.resources || []).length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium mb-2">Recommended Resources</h5>
                      <div className="space-y-2">
                        {(step.resources || []).map(resource => {
                          const ResourceIcon = resourceIcons[resource.type];
                          return (
                            <div 
                              key={resource.id}
                              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                                  <ResourceIcon className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{resource.title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {resource.provider} • {resource.duration} • 
                                    <span className={cn(
                                      "ml-1",
                                      resource.cost === 'free' ? "text-success" : "text-muted-foreground"
                                    )}>
                                      {resource.cost === 'free' ? 'Free' : 'Paid'}
                                    </span>
                                  </p>
                                </div>
                              </div>
                              <Button variant="ghost" size="icon">
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
        
        {/* Completion */}
        <div className="relative pl-14 mt-6">
          <div className={cn(
            "absolute left-4 -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center",
            learningPath.progress === 100 
              ? "bg-success text-success-foreground" 
              : "bg-muted text-muted-foreground"
          )}>
            <Briefcase className="w-4 h-4" />
          </div>
          <Card className={cn(
            "p-6",
            learningPath.progress === 100 && "border-success/50 bg-success/5"
          )}>
            <div className="text-center">
              <h3 className="text-lg font-semibold font-display mb-2">
                {learningPath.progress === 100 ? "🎉 Congratulations!" : "Goal: " + targetRole?.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {learningPath.progress === 100 
                  ? "You've completed your learning path and are ready for this role!"
                  : "Complete all steps to qualify for this position"
                }
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
