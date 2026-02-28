import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { SkillBadge } from '@/components/ui/skill-badge';
import { Checkbox } from '@/components/ui/checkbox';
import { StepAssessmentModal } from '@/components/learning/StepAssessmentModal';
import { CertificateDisplay } from '@/components/learning/CertificateDisplay';
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
  Loader2,
  Lock,
  Unlock,
  PlayCircle,
  AlertCircle,
  Trophy,
  Award
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { learningApi } from '@/api/learning.api.ts';
import { certificateApi } from '@/api/certificate.api';
import type { LearningResource, LearningPath, CareerMatch, LearningPathStep, Certificate } from '@/types';

const resourceIcons: Record<LearningResource['type'], React.ComponentType<{ className?: string }>> = {
  course: GraduationCap,
  tutorial: BookOpen,
  book: FileText,
  video: Video,
  project: Target,
};

// Extended step type with UI state
interface StepWithUIState extends LearningPathStep {
  canComplete?: boolean;
  isLocked?: boolean;
  previousCompleted?: boolean;
  assessmentPassed?: boolean;
}

export default function Learning() {
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [selectedCareer, setSelectedCareer] = useState<CareerMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stepStatuses, setStepStatuses] = useState<Record<number, {
    canComplete: boolean;
    isLocked: boolean;
    previousCompleted: boolean;
    assessmentPassed: boolean;
  }>>({});
  
  // Certificate modal state
  const [showCertificate, setShowCertificate] = useState(false);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  
  // Assessment modal state
  const [assessmentModalOpen, setAssessmentModalOpen] = useState(false);
  const [currentAssessment, setCurrentAssessment] = useState<{
    stepId: number;
    skillName: string;
    targetLevel: string;
    questions: Array<{
      id: number;
      question: string;
      options: string[];
    }>;
  } | null>(null);

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
          // Handle both snake_case (API format) and camelCase (TypeScript format)
          const roleId = career.roleId || career.role_id;
          if (!roleId) {
            throw new Error('Invalid career data: missing roleId');
          }
          const pathData = await learningApi.generatePath(roleId);
          setLearningPath(pathData);
          
          // Fetch step statuses for the new path
          await fetchStepStatuses(pathData);
          
          // Check if there's already a certificate for this path
          await checkForCertificate(pathData.id);
        } else {
          // Try to get existing learning path
          const existingPath = await learningApi.getPath();
          if (existingPath) {
            setLearningPath(existingPath);
            await fetchStepStatuses(existingPath);
            // Check if there's already a certificate for this path
            await checkForCertificate(existingPath.id);
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

  const checkForCertificate = async (pathId: number) => {
    try {
      const result = await certificateApi.getCertificateForPath(pathId);
      if (result.exists && result.certificate) {
        setCertificate(result.certificate);
        // Show certificate if path is completed
        if (learningPath?.progress === 100) {
          setShowCertificate(true);
        }
      }
    } catch (error) {
      console.error('Error checking for certificate:', error);
    }
  };

  const fetchStepStatuses = async (path: LearningPath) => {
    if (!path?.steps) return;
    
    const statuses: Record<number, any> = {};
    
    for (const step of path.steps) {
      try {
        const status = await learningApi.canCompleteStep(path.id, step.id);
        statuses[step.id] = {
          canComplete: status.can_complete,
          isLocked: !status.previous_step_completed && status.step_order > 1,
          previousCompleted: status.previous_step_completed,
          assessmentPassed: status.assessment_passed,
        };
      } catch (error) {
        console.error(`Error fetching status for step ${step.id}:`, error);
        statuses[step.id] = {
          canComplete: false,
          isLocked: true,
          previousCompleted: false,
          assessmentPassed: false,
        };
      }
    }
    
    setStepStatuses(statuses);
  };

  const handleOpenAssessment = async (step: LearningPathStep) => {
    if (!learningPath) return;
    
    try {
      const assessment = await learningApi.getStepAssessment(learningPath.id, step.id);
      
      // If already passed, just mark complete
      if (assessment.assessment_already_passed) {
        await handleMarkComplete(step.id);
        return;
      }
      
      setCurrentAssessment({
        stepId: step.id,
        skillName: assessment.skill_name,
        targetLevel: assessment.target_level,
        questions: assessment.questions,
      });
      setAssessmentModalOpen(true);
    } catch (error) {
      console.error('Error loading assessment:', error);
    }
  };

  const handleAssessmentSubmit = async (answers: string[]) => {
    if (!learningPath || !currentAssessment) {
      throw new Error('No active assessment');
    }
    
    return await learningApi.submitStepAssessment(
      learningPath.id,
      currentAssessment.stepId,
      answers
    );
  };

  const handleAssessmentPass = async () => {
    if (!learningPath || !currentAssessment) return;
    
    // Refresh step statuses
    await fetchStepStatuses(learningPath);
    
    // Close modal
    setAssessmentModalOpen(false);
    setCurrentAssessment(null);
  };

  const handleMarkComplete = async (stepId: number) => {
    if (!learningPath) return;
    
    try {
      const result = await learningApi.markStepComplete(learningPath.id, stepId);
      
      // Check if certificate was generated
      if (result.certificate) {
        setCertificate(result.certificate);
        setShowCertificate(true);
      }
      
      // Refresh learning path and statuses
      const updatedPath = await learningApi.getPath();
      if (updatedPath) {
        setLearningPath(updatedPath);
        await fetchStepStatuses(updatedPath);
      }
    } catch (error) {
      console.error('Error marking step complete:', error);
    }
  };

  const targetRole = learningPath?.targetRole || selectedCareer?.role;
  const targetRoleTitle = targetRole?.title || 'Unknown Role';

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

  const steps = learningPath.steps || [];
  
  // Check if user already qualified (no steps needed)
  if (steps.length === 0 && learningPath.progress === 100) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-display">Learning Path</h1>
            <p className="text-muted-foreground mt-1">
              Your roadmap to becoming a <span className="font-medium text-foreground">{targetRoleTitle}</span>
            </p>
          </div>
          <Card className="p-4 min-w-[200px] bg-success/10 border-success/30">
            <div className="text-center">
              <CheckCircle2 className="w-8 h-8 mx-auto text-success mb-2" />
              <p className="font-semibold text-success">Already Qualified!</p>
              <p className="text-xs text-muted-foreground mt-1">100% Complete</p>
            </div>
          </Card>
        </div>

        <Card className="p-12 text-center border-success/50 bg-success/5">
          <Award className="w-16 h-16 mx-auto text-success mb-4" />
          <h3 className="text-2xl font-semibold mb-2">🎉 Congratulations!</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            You already have all the required skills for the <strong>{targetRoleTitle}</strong> role! 
            No learning path is needed - you're ready to apply for this position.
          </p>
          <div className="flex gap-3 justify-center">
            <Button asChild variant="outline">
              <Link to="/careers">
                <Briefcase className="w-4 h-4 mr-2" />
                Explore Other Careers
              </Link>
            </Button>
            <Button asChild>
              <Link to="/assistant">
                <GraduationCap className="w-4 h-4 mr-2" />
                Get Career Advice
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }
  const completedSteps = steps.filter(s => s.isCompleted).length;

  // Debug info
  console.log('Learning Path:', learningPath);
  console.log('Steps:', steps);
  console.log('Step Statuses:', stepStatuses);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="p-3 bg-muted/50 rounded-lg text-xs font-mono">
          <p>Debug: steps={steps.length}, completed={completedSteps}, pathId={learningPath.id}, certificate={!!certificate}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display">Learning Path</h1>
          <p className="text-muted-foreground mt-1">
            Your roadmap to becoming a <span className="font-medium text-foreground">{targetRoleTitle}</span>
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
            {completedSteps} of {steps.length} steps completed
          </p>
          <p className="text-xs text-muted-foreground">
            Est. time: {learningPath.totalDuration}
          </p>
        </Card>
      </div>
      
      {/* Learning Path Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
        
        <div className="space-y-6">
          {steps.length === 0 ? (
            <Card className="p-8 text-center">
              <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Learning Steps Found</h3>
              <p className="text-muted-foreground mb-4">
                This learning path doesn't have any steps yet. Please go back and select a career again.
              </p>
              <Button asChild>
                <Link to="/careers">
                  <Briefcase className="w-4 h-4 mr-2" />
                  Select Career
                </Link>
              </Button>
            </Card>
          ) : steps.map((step, index) => {
            const status = stepStatuses[step.id] || {
              canComplete: false,
              isLocked: index > 0,
              previousCompleted: false,
              assessmentPassed: false,
            };
            
            const isFirstStep = index === 0;
            const isLocked = !isFirstStep && !status.previousCompleted;
            const canMarkComplete = status.canComplete;
            const showAssessmentButton = !isLocked && !step.isCompleted && !status.assessmentPassed;
            
            return (
              <div key={step.id} className="relative pl-14">
                {/* Timeline node */}
                <div 
                  className={cn(
                    "absolute left-4 -translate-x-1/2 w-5 h-5 rounded-full border-2 transition-colors flex items-center justify-center",
                    step.isCompleted 
                      ? "bg-success border-success" 
                      : isLocked
                        ? "bg-muted border-muted-foreground"
                        : "bg-background border-primary"
                  )}
                >
                  {step.isCompleted ? (
                    <CheckCircle2 className="w-full h-full text-success-foreground p-0.5" />
                  ) : isLocked ? (
                    <Lock className="w-3 h-3 text-muted-foreground" />
                  ) : (
                    <Unlock className="w-3 h-3 text-primary" />
                  )}
                </div>
                
                <Card className={cn(
                  "transition-all",
                  step.isCompleted && "opacity-75",
                  isLocked && "opacity-50"
                )}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-muted-foreground">
                            Step {index + 1} of {steps.length}
                          </span>
                          <SkillBadge level={step.targetLevel || step.target_level || 'beginner'} />
                          {isLocked && (
                            <span className="text-xs flex items-center gap-1 text-muted-foreground">
                              <Lock className="w-3 h-3" /> Locked
                            </span>
                          )}
                        </div>
                        <CardTitle className={cn(
                          "text-lg font-display",
                          isLocked && "text-muted-foreground"
                        )}>
                          {step.skill?.name || step.skill_name || `Skill ${index + 1}`}
                        </CardTitle>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {showAssessmentButton ? (
                          <Button
                            size="sm"
                            onClick={() => handleOpenAssessment(step)}
                            className="gap-1"
                          >
                            <PlayCircle className="w-4 h-4" />
                            Take Assessment
                          </Button>
                        ) : canMarkComplete ? (
                          <Checkbox
                            checked={step.isCompleted}
                            onCheckedChange={() => handleMarkComplete(step.id)}
                            className="w-5 h-5"
                          />
                        ) : step.isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-success" />
                        ) : (
                          <div className="w-5 h-5 rounded border border-muted-foreground/30 flex items-center justify-center">
                            <Lock className="w-3 h-3 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {step.estimatedDuration || step.estimated_duration || '1 week'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        Target: {step.targetLevel || step.target_level || 'beginner'}
                      </span>
                      {status.assessmentPassed && (
                        <span className="flex items-center gap-1 text-success">
                          <CheckCircle2 className="w-4 h-4" />
                          Assessment Passed
                        </span>
                      )}
                    </div>
                    
                    {/* Status message */}
                    {isLocked && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                        <AlertCircle className="w-4 h-4" />
                        Complete Step {index} to unlock this module
                      </div>
                    )}
                    
                    {(step.resources || []).length > 0 && !isLocked && (
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
            );
          })}
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
                {learningPath.progress === 100 ? "🎉 Congratulations!" : "Goal: " + targetRoleTitle}
              </h3>
              <p className="text-sm text-muted-foreground">
                {learningPath.progress === 100 
                  ? "You've completed your learning path and are ready for this role!"
                  : "Complete all steps and assessments to qualify for this position"
                }
              </p>
              {learningPath.progress === 100 && (
                <Button 
                  onClick={async () => {
                    // Check if certificate exists, if not generate one
                    if (!certificate) {
                      try {
                        const result = await certificateApi.generateCertificate(learningPath.id);
                        if (result.certificate) {
                          setCertificate(result.certificate);
                          setShowCertificate(true);
                        }
                      } catch (error) {
                        console.error('Error generating certificate:', error);
                      }
                    } else {
                      setShowCertificate(true);
                    }
                  }}
                  className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-white gap-2"
                >
                  <Award className="w-4 h-4" />
                  View Certificate
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Assessment Modal */}
      {currentAssessment && (
        <StepAssessmentModal
          isOpen={assessmentModalOpen}
          onClose={() => {
            setAssessmentModalOpen(false);
            setCurrentAssessment(null);
          }}
          skillName={currentAssessment.skillName}
          targetLevel={currentAssessment.targetLevel}
          questions={currentAssessment.questions}
          onSubmit={handleAssessmentSubmit}
          onPass={handleAssessmentPass}
        />
      )}

      {/* Certificate Modal */}
      {showCertificate && certificate && (
        <CertificateDisplay 
          certificate={certificate} 
          onClose={() => setShowCertificate(false)} 
        />
      )}
    </div>
  );
}
