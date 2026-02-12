import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, CheckCircle2, Loader2, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { skillsApi } from '@/api/skills.api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/auth/AuthContext';


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
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();

  // Get skill data from navigation state or URL params
  const urlParams = new URLSearchParams(window.location.search);
  const urlSkillId = urlParams.get('skillId');
  const urlSkillName = urlParams.get('skillName');
  
  // Try to get from navigation state first, then URL params, then localStorage
  const skillName = location.state?.skillName || urlSkillName || localStorage.getItem('currentSkillName') || 'Unknown Skill';
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

  useEffect(() => {
    const loadExam = async () => {
      try {
        // Wait for auth to finish loading before checking user
        if (isAuthLoading) {
          return;
        }

        if (!user) {
          toast({
            title: "Authentication required",
            description: "Please log in to take the exam.",
            variant: "destructive",
          });
          navigate('/login');
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


        // Load quiz from new API
        const response = await fetch(`http://localhost:5000/api/assessment/start/${currentSkillId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`

          }
        });

        if (!response.ok) {
          throw new Error('Failed to load quiz');
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


  // const generateMockQuestions = (skillName: string): Question[] => {
  //   return Array.from({ length: 10 }, (_, i) => ({
  //     id: i + 1,
  //     question_text: `Question ${i + 1}: What is your understanding of ${skillName} concept ${i + 1}?`,
  //     options: [
  //       `Basic understanding of ${skillName}`,
  //       `Intermediate knowledge with some practical experience`,
  //       `Advanced expertise with multiple projects`,
  //       `Expert level with deep architectural knowledge`
  //     ],
  //     correct_answer: `Advanced expertise with multiple projects`,
  //     difficulty: i < 3 ? 'easy' : i < 7 ? 'medium' : 'hard'
  //   }));
  // };

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

      // Clear localStorage after successful submission
      localStorage.removeItem('currentSkillId');
      localStorage.removeItem('currentSkillName');

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

  const allAnswered = questions.length > 0 && questions.every(q => answers[q.id]);

  if (loading || isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
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

            <div className="flex justify-center gap-4">
              <Button onClick={() => navigate('/skill_selection/assessment')} variant="outline">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back to Assessments
              </Button>
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
    <div className="space-y-2 animate-fade-in max-w-xl mx-auto">
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
      <Card>
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
          <h3 className="text-lg font-medium">
            {currentQ?.question_text}
          </h3>

          <div className="space-y-3">
            {currentQ?.options.map((option, index) => (
              <label
                key={index}
                className={cn(
                  "flex items-center space-x-3 p-5 rounded-lg border cursor-pointer transition-colors",
                  answers[currentQ.id] === option
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <input
                  type="radio"
                  name={`question-${currentQ.id}`}
                  value={option}
                  checked={answers[currentQ.id] === option}
                  onChange={() => handleAnswer(currentQ.id, option)}
                  className="text-primary w-4 h-4"
                />
                <span>{option}</span>
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
              className="w-full min-h-[120px] p-3 rounded-lg border border-border bg-background resize-y focus:outline-none focus:ring-2 focus:ring-primary/50"
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
