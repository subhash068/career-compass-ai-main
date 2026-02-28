import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, CheckCircle2, Loader2, Timer, Maximize, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { skillsApi } from '@/api/skills.api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/auth/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";



interface Question {
  id: number;
  question_text: string;
  options: string[];
  correct_answer: string;
  difficulty: string;
}

export default function SkillExam() {
  const navigate = useNavigate();
  const location = useLocation();
  const { skillName: urlSkillNameParam } = useParams<{ skillName: string }>();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();

  // Get skill data from URL param, navigation state, URL search params, or localStorage
  const urlParams = new URLSearchParams(window.location.search);
  const urlSkillId = urlParams.get('skillId');
  const urlSkillName = urlParams.get('skillName');
  
  // Try to get from URL param first, then navigation state, then URL search params, then localStorage
  const skillName = urlSkillNameParam || location.state?.skillName || urlSkillName || localStorage.getItem('currentSkillName') || 'Unknown Skill';
  const initialSkillId = location.state?.skillId || (urlSkillId ? parseInt(urlSkillId) : null) || (localStorage.getItem('currentSkillId') ? parseInt(localStorage.getItem('currentSkillId')!) : null);




  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{[key: number]: string}>({});
  const [writtenAnswer, setWrittenAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [examComplete, setExamComplete] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [skillId, setSkillId] = useState<number | null>(initialSkillId);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [nextSkill, setNextSkill] = useState<{id: number, name: string} | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSecurityWarning, setShowSecurityWarning] = useState(false);
  const [securityViolations, setSecurityViolations] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const examContainerRef = useRef<HTMLDivElement>(null);
  const violationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Security constants
  const MAX_VIOLATIONS = 3;
  const VIOLATION_WARNING_DURATION = 5000; // 5 seconds

  // Reset state when URL parameter changes (for next exam navigation)

  useEffect(() => {
    setSkillId(initialSkillId);
    setExamComplete(false);
    setResults(null);
    setCurrentQuestion(0);
    setAnswers({});
    setWrittenAnswer('');
    setNextSkill(null);
    setLoading(true);
    window.scrollTo(0, 0);
  }, [urlSkillNameParam, initialSkillId]);

  // Store skill info in localStorage when available
  useEffect(() => {
    if (skillId && skillName && skillName !== 'Unknown Skill') {
      localStorage.setItem('currentSkillId', skillId.toString());
      localStorage.setItem('currentSkillName', skillName);
    }
  }, [skillId, skillName]);



  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Enter fullscreen mode
  const enterFullscreen = useCallback(async () => {
    try {
      const element = examContainerRef.current || document.documentElement;
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if ((element as any).webkitRequestFullscreen) {
        await (element as any).webkitRequestFullscreen();
      } else if ((element as any).msRequestFullscreen) {
        await (element as any).msRequestFullscreen();
      }
      setIsFullscreen(true);
    } catch (err) {
      console.error('Failed to enter fullscreen:', err);
      toast({
        title: "Fullscreen Required",
        description: "Please allow fullscreen mode to start the exam.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Exit fullscreen mode
  const exitFullscreen = useCallback(() => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen();
    } else if ((document as any).msExitFullscreen) {
      (document as any).msExitFullscreen();
    }
    setIsFullscreen(false);
  }, []);

  // Handle security violation
  const handleSecurityViolation = useCallback((reason: string) => {
    if (examComplete) return; // Don't count violations after exam is complete
    
    const newViolations = securityViolations + 1;
    setSecurityViolations(newViolations);
    setShowSecurityWarning(true);
    
    // Clear any existing timeout
    if (violationTimeoutRef.current) {
      clearTimeout(violationTimeoutRef.current);
    }
    
    // Auto-hide warning after duration
    violationTimeoutRef.current = setTimeout(() => {
      setShowSecurityWarning(false);
    }, VIOLATION_WARNING_DURATION);
    
    toast({
      title: "Security Warning!",
      description: `Violation ${newViolations}/${MAX_VIOLATIONS}: ${reason}. ${newViolations >= MAX_VIOLATIONS ? 'Exam will be auto-submitted!' : 'Please follow exam rules.'}`,
      variant: "destructive",
    });
    
    // Auto-submit if max violations reached
    if (newViolations >= MAX_VIOLATIONS) {
      toast({
        title: "Maximum Violations Reached",
        description: "Auto-submitting exam due to security violations...",
        variant: "destructive",
      });
      setTimeout(() => {
        submitExam();
      }, 2000);
    }
  }, [securityViolations, examComplete, toast]);

  // Prevent keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (examComplete) return;
    
    // Prevent Tab switching
    if (e.key === 'Tab') {
      e.preventDefault();
      handleSecurityViolation('Tab key is disabled during exam');
      return;
    }
    
    // Prevent Alt+Tab (Alt key)
    if (e.altKey) {
      e.preventDefault();
      handleSecurityViolation('Alt key combinations are disabled');
      return;
    }
    
    // Prevent Ctrl/Cmd combinations (copy, paste, print, etc.)
    if (e.ctrlKey || e.metaKey) {
      const blockedKeys = ['c', 'v', 'x', 'p', 'a', 'f', 's', 't', 'w', 'n', 'r'];
      if (blockedKeys.includes(e.key.toLowerCase())) {
        e.preventDefault();
        handleSecurityViolation(`Ctrl+${e.key.toUpperCase()} is disabled during exam`);
        return;
      }
    }
    
    // Prevent F-keys (F1-F12)
    if (e.key.startsWith('F') && e.key.length > 1) {
      e.preventDefault();
      handleSecurityViolation('Function keys are disabled during exam');
      return;
    }
    
    // Prevent Escape key (could exit fullscreen)
    if (e.key === 'Escape') {
      e.preventDefault();
      handleSecurityViolation('Escape key is disabled during exam');
      return;
    }
  }, [examComplete, handleSecurityViolation]);

  // Prevent context menu (right-click)
  const handleContextMenu = useCallback((e: MouseEvent) => {
    e.preventDefault();
    handleSecurityViolation('Right-click is disabled during exam');
  }, [handleSecurityViolation]);

  // Prevent copy/paste/cut via events
  const handleCopyPaste = useCallback((e: ClipboardEvent) => {
    e.preventDefault();
    handleSecurityViolation('Copy/Paste is disabled during exam');
  }, [handleSecurityViolation]);

  // Handle visibility change (tab switching, minimizing)
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden && !examComplete) {
      handleSecurityViolation('Window switching is not allowed during exam');
    }
  }, [examComplete, handleSecurityViolation]);

  // Handle window blur (losing focus)
  const handleWindowBlur = useCallback(() => {
    if (!examComplete) {
      handleSecurityViolation('Window focus loss detected');
    }
  }, [examComplete, handleSecurityViolation]);

  // Handle fullscreen change
  const handleFullscreenChange = useCallback(() => {
    const isCurrentlyFullscreen = !!document.fullscreenElement;
    setIsFullscreen(isCurrentlyFullscreen);
    
    if (!isCurrentlyFullscreen && !examComplete && !showExitConfirm) {
      handleSecurityViolation('Fullscreen mode is required during exam');
      // Try to re-enter fullscreen
      setTimeout(() => {
        enterFullscreen();
      }, 100);
    }
  }, [examComplete, showExitConfirm, handleSecurityViolation, enterFullscreen]);

  // Setup security measures
  useEffect(() => {
    if (loading || isAuthLoading || examComplete) return;
    
    // Enter fullscreen when exam loads
    enterFullscreen();
    
    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('cut', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
    
    // Prevent drag and drop
    const preventDragDrop = (e: DragEvent) => {
      e.preventDefault();
    };
    document.addEventListener('dragstart', preventDragDrop);
    document.addEventListener('drop', preventDragDrop);
    
    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('cut', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
      document.removeEventListener('dragstart', preventDragDrop);
      document.removeEventListener('drop', preventDragDrop);
      
      if (violationTimeoutRef.current) {
        clearTimeout(violationTimeoutRef.current);
      }
    };
  }, [loading, isAuthLoading, examComplete, enterFullscreen, handleKeyDown, handleContextMenu, handleCopyPaste, handleVisibilityChange, handleWindowBlur, handleFullscreenChange]);

  // Handle beforeunload (page refresh/close)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!examComplete) {
        e.preventDefault();
        e.returnValue = 'You are in the middle of an exam. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [examComplete]);


  useEffect(() => {
    const loadExam = async () => {
      try {
        // Wait for auth to finish loading before loading exam
        if (isAuthLoading) {
          return;
        }

        // Use skillId from state, URL params, or localStorage

        let currentSkillId = initialSkillId;

        if (!currentSkillId) {
          toast({
            title: "Skill not found",
            description: "No skill ID provided. Please select a skill from the skill selection page.",
            variant: "destructive",
          });
          navigate('/skill_selection');
          return;
        }

        setSkillId(currentSkillId);

        // DEBUG: Log the values being used
        console.log('DEBUG: Loading exam with skillId:', currentSkillId);
        console.log('DEBUG: skillName:', skillName);
        console.log('DEBUG: Auth token exists:', !!localStorage.getItem('authToken'));
        console.log('DEBUG: User:', user);

        // Load quiz from new API
        const response = await fetch(`http://localhost:5000/api/assessment/start/${currentSkillId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`

          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`API Error ${response.status}:`, errorText);
          throw new Error(`Failed to load quiz: ${response.status} - ${errorText}`);
        }


        const data = await response.json();

        setQuestions(data.questions);
        setTimeLeft(data.time_limit);
      } catch (error) {
        console.error('Error loading exam:', error);
        toast({
          title: "Error",
          description: "Failed to load exam questions. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadExam();
  }, [skillName, user, isAuthLoading, navigate, toast, initialSkillId]);

  const handleAnswer = (questionId: number, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  // Timer countdown
  useEffect(() => {
    if (examComplete || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          submitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examComplete, timeLeft]);

  const submitExam = async () => {
    // Validate skillId before submission
    if (!skillId) {
      toast({
        title: "Error",
        description: "Cannot submit exam: Skill ID is missing. Please restart the exam.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Submit to backend first if skillId exists
      let backendResult = null;

      try {
        // Format answers as expected by backend: Record<question_id, answer>
        const formattedAnswers: Record<number, string> = {};
        Object.entries(answers).forEach(([questionId, answer]) => {
          formattedAnswers[parseInt(questionId)] = answer;
        });

        const response = await skillsApi.submitQuiz({
          skill_id: skillId,
          answers: formattedAnswers,
          time_taken: 600 - timeLeft
        });

        // Use backend response if available
        if (response.data && response.data.skill_results && response.data.skill_results.length > 0) {
          backendResult = response.data.skill_results[0];
        }
      } catch (e) {
        console.log('Backend submission failed, using local calculation:', e);
      }

      // Calculate score locally as fallback

      let correctCount = 0;
      questions.forEach(q => {
        if (answers[q.id] === q.correct_answer) {
          correctCount++;
        }
      });

      const localScore = (correctCount / questions.length) * 100;

      // Use backend result if available, otherwise use local calculation
      const score = backendResult ? backendResult.percentage : localScore;
      const finalCorrectCount = backendResult ? backendResult.correct_answers : correctCount;
      
      // Determine level based on score
      let level = 'Beginner';
      if (score >= 80) level = 'Expert';
      else if (score >= 60) level = 'Advanced';
      else if (score >= 40) level = 'Intermediate';

      const result = {
        skill_id: skillId, // Include skill_id for reference
        skill_name: skillName,
        score: score,
        level,
        correct_answers: finalCorrectCount,
        total_questions: questions.length,
        written_assessment: writtenAnswer,
        time_taken: 600 - timeLeft
      };

      setResults(result);
      setExamComplete(true);

      // Trigger dashboard refresh
      window.dispatchEvent(new CustomEvent('assessmentCompleted', { 
        detail: { skillId, skillName, score: result.score } 
      }));
      localStorage.setItem('lastAssessmentCompleted', Date.now().toString());

      // Clear localStorage after successful submission
      localStorage.removeItem('currentSkillId');
      localStorage.removeItem('currentSkillName');


      // Get next skill from localStorage (set during skill selection)
      const pendingSkillsJson = localStorage.getItem('pendingSkills');
      if (pendingSkillsJson) {
        const pendingSkills = JSON.parse(pendingSkillsJson);
        // Find current skill index and get next one
        const currentIndex = pendingSkills.findIndex((s: any) => s.id === skillId);
        if (currentIndex !== -1 && currentIndex < pendingSkills.length - 1) {
          const next = pendingSkills[currentIndex + 1];
          setNextSkill({ id: next.id, name: next.name });
        }
      }

      toast({
        title: "Exam Completed!",
        description: `You scored ${score.toFixed(1)}% - ${level} level`,
      });


    } catch (error) {
      console.error('Error submitting exam:', error);
      toast({
        title: "Error",
        description: "Failed to submit exam. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleSubmit = () => {
    submitExam();
  };

  const startNextExam = () => {
    if (!nextSkill) return;
    
    // Update localStorage to remove current skill from pending
    const pendingSkillsJson = localStorage.getItem('pendingSkills');
    if (pendingSkillsJson) {
      const pendingSkills = JSON.parse(pendingSkillsJson);
      const updatedSkills = pendingSkills.filter((s: any) => s.id !== skillId);
      localStorage.setItem('pendingSkills', JSON.stringify(updatedSkills));
    }

    // Store next skill info in localStorage before navigation
    localStorage.setItem('currentSkillId', nextSkill.id.toString());
    localStorage.setItem('currentSkillName', nextSkill.name);

    // Navigate to next exam using skill name in URL
    const encodedSkillName = encodeURIComponent(nextSkill.name.toLowerCase().replace(/\s+/g, '-'));
    navigate(`/skill_selection/assessment/${encodedSkillName}`, {
      state: { 
        skillId: nextSkill.id, 
        skillName: nextSkill.name 
      }
    });

  };


  const allAnswered = questions.length > 0 && questions.every(q => answers[q.id]);



  if (loading || isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Security warning overlay
  if (showSecurityWarning && !examComplete) {
    return (
      <div className="fixed inset-0 bg-red-900/90 z-50 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-900 p-8 rounded-lg max-w-md text-center animate-pulse">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-600 mb-2">Security Violation!</h2>
          <p className="text-lg mb-4">
            Violation {securityViolations} of {MAX_VIOLATIONS}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Please follow exam rules. {securityViolations >= MAX_VIOLATIONS ? 'Exam will be auto-submitted!' : 'Continue the exam in fullscreen mode.'}
          </p>
          <Button 
            onClick={() => {
              setShowSecurityWarning(false);
              enterFullscreen();
            }}
            className="w-full"
          >
            <Maximize className="w-4 h-4 mr-2" />
            Return to Exam
          </Button>
        </div>
      </div>
    );
  }



  if (examComplete && results) {
    return (
      <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Exam Completed !</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-2">
                {results.score.toFixed(1)}%
              </div>
              <div className="text-lg text-muted-foreground">
                {results.level} Level
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-lg text-center">
                <div className="text-2xl font-bold">{results.correct_answers}</div>
                <div className="text-sm text-muted-foreground">Correct Answers</div>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center">
                <div className="text-2xl font-bold">{results.total_questions}</div>
                <div className="text-sm text-muted-foreground">Total Questions</div>
              </div>
            </div>

            {results.written_assessment && (
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Your Written Assessment:</h4>
                <p className="text-sm text-muted-foreground">{results.written_assessment}</p>
              </div>
            )}

            <div className="flex justify-center gap-4 flex-wrap">
              <Button onClick={() => navigate('/skill_selection/assessment')} variant="outline">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back to Assessments
              </Button>
              {nextSkill && (
                <Button 
                  onClick={() => startNextExam()} 
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Next: {nextSkill.name}
                  <ChevronLeft className="w-4 h-4 ml-2 rotate-180" />
                </Button>
              )}
              <Button onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
            </div>

          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <div 
      ref={examContainerRef}
      className="space-y-2 animate-fade-in max-w-xl mx-auto min-h-screen bg-background p-4"
    >
      {/* Fullscreen Toggle Button */}
      {!isFullscreen && !examComplete && (
        <div className="fixed top-4 right-4 z-40">
          <Button
            onClick={enterFullscreen}
            variant="outline"
            size="sm"
            className="bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200"
          >
            <Maximize className="w-4 h-4 mr-2" />
            Enter Fullscreen
          </Button>
        </div>
      )}

      {/* Security Status Indicator */}
      <div className="fixed top-4 left-4 z-40 flex items-center gap-2">
        <div className={cn(
          "px-3 py-1 rounded-full text-xs font-medium",
          isFullscreen ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
        )}>
          {isFullscreen ? '🔒 Secure Mode' : '⚠️ Not Secure'}
        </div>
        {securityViolations > 0 && (
          <div className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            Violations: {securityViolations}/{MAX_VIOLATIONS}
          </div>
        )}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/skill_selection')}>
          <ChevronLeft className="w-3 h-3 mr-2" />
          Back
        </Button>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Timer className="w-3 h-3" />
          <span className={timeLeft < 60 ? 'text-red-500 font-bold' : ''}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium">Question {currentQuestion + 1} of {questions.length}</span>
          <span className="text-muted-foreground">
            {Object.keys(answers).length} answered
          </span>
        </div>
        <Progress 
          value={((currentQuestion + 1) / questions.length) * 100} 
          className="h-2" 
        />
      </div>

      {/* Question Card */}
      <Card className="select-none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">
              {skillName} Assessment
            </CardTitle>
            <span className={cn(
              "text-xs px-2 py-1 rounded-full",
              currentQ?.difficulty === 'easy' && "bg-green-100 text-green-700",
              currentQ?.difficulty === 'medium' && "bg-yellow-100 text-yellow-700",
              currentQ?.difficulty === 'hard' && "bg-red-100 text-red-700"
            )}>
              {currentQ?.difficulty}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <h3 className="text-lg font-medium select-none">
            {currentQ?.question_text}
          </h3>

          <div className="space-y-3">
            {currentQ?.options.map((option, index) => (
              <label
                key={index}
                className={cn(
                  "flex items-center space-x-3 p-5 rounded-lg border cursor-pointer transition-colors select-none",
                  answers[currentQ.id] === option
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
                onContextMenu={(e) => e.preventDefault()}
              >
                <input
                  type="radio"
                  name={`question-${currentQ.id}`}
                  value={option}
                  checked={answers[currentQ.id] === option}
                  onChange={() => handleAnswer(currentQ.id, option)}
                  className="text-primary w-4 h-4"
                  onCopy={(e) => e.preventDefault()}
                  onCut={(e) => e.preventDefault()}
                  onPaste={(e) => e.preventDefault()}
                />
                <span className="select-none">{option}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>


      {/* Written Assessment (shown after last question) */}
      {currentQuestion === questions.length - 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span>✍️</span> Written Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Describe your experience with {skillName}. Include projects you've worked on, tools you've used, and your proficiency level.
            </p>
            <textarea
              value={writtenAnswer}
              onChange={(e) => setWrittenAnswer(e.target.value)}
              placeholder={`Write about your experience with ${skillName}...`}
              className="w-full min-h-[120px] p-3 rounded-lg border border-border bg-background resize-y focus:outline-none focus:ring-2 focus:ring-primary/50 select-none"
              onCopy={(e) => {
                e.preventDefault();
                handleSecurityViolation('Copy is disabled during exam');
              }}
              onCut={(e) => {
                e.preventDefault();
                handleSecurityViolation('Cut is disabled during exam');
              }}
              onPaste={(e) => {
                e.preventDefault();
                handleSecurityViolation('Paste is disabled during exam');
              }}
              onContextMenu={(e) => e.preventDefault()}
            />
            <div className="mt-2 text-xs text-muted-foreground text-right">
              {writtenAnswer.length} characters
            </div>
          </CardContent>
        </Card>
      )}


      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
        >
          Previous
        </Button>

        {currentQuestion < questions.length - 1 ? (
          <Button
            onClick={handleNext}
            disabled={!answers[currentQ?.id]}
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !allAnswered}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Submit Exam
              </>
            )}
          </Button>
        )}
      </div>

      {/* Question Navigator */}
      <div className="flex flex-wrap gap-2 justify-center">
        {questions.map((q, index) => (
          <button
            key={q.id}
            onClick={() => setCurrentQuestion(index)}
            className={cn(
              "w-10 h-10 rounded-lg text-sm font-medium transition-colors",
              currentQuestion === index && "ring-2 ring-primary",
              answers[q.id] 
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            )}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
