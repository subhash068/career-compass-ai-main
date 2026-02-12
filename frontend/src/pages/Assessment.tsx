import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Code2, Layout, Server, Brain, Cloud, Users,
  CheckCircle2, Target, Loader2, TrendingUp, TrendingDown, Minus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { skillsApi } from '@/api/skills.api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/auth/AuthContext';
import { QuizData, QuizResult, QuizAnswer } from '@/types';

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'cat-1': Code2,
  'cat-2': Layout,
  'cat-3': Server,
  'cat-4': Brain,
  'cat-5': Cloud,
  'cat-6': Users,
};

type AssessmentPhase = 'quiz' | 'results';

export default function Assessment() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<AssessmentPhase>('quiz');
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<{[skillId: string]: {[questionId: number]: string}}>({});
  const [writtenAssessments, setWrittenAssessments] = useState<{[skillId: string]: string}>({});
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        // Get selected skills from session storage
        const selectedSkillsData = sessionStorage.getItem('selectedSkills');
        if (!selectedSkillsData) {
          toast({
            title: "No skills selected",
            description: "Please go back and select skills to assess.",
            variant: "destructive",
          });
          navigate('/skill_selection');
          return;
        }

        const selectedSkills = JSON.parse(selectedSkillsData);
        if (!user) {
          toast({
            title: "Authentication required",
            description: "Please log in to take the assessment.",
            variant: "destructive",
          });
          navigate('/login');
          return;
        }

        // Start assessment
        const quizData = await skillsApi.startAssessment(user.id, selectedSkills);
        setQuizData(quizData);
      } catch (error) {
        console.error('Error loading quiz:', error);
        toast({
          title: "Error",
          description: "Failed to load quiz questions. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [toast, navigate]);







  const handleSubmitQuiz = async () => {
    setIsSubmitting(true);
    try {
      // Get assessment ID from quiz data
      const assessmentId = quizData?.assessment_id;
      if (!assessmentId) {
        throw new Error('Assessment ID not found');
      }

      // Prepare answers in the format expected by the API
      const answers: {[key: number]: string} = {};

      Object.values(quizAnswers).forEach(skillAnswers => {
        Object.entries(skillAnswers).forEach(([questionId, answer]) => {
          answers[parseInt(questionId)] = answer;
        });
      });

      // Submit assessment with written assessments
      const result = await skillsApi.submitQuizAssessment(assessmentId, answers, writtenAssessments);
      setQuizResult(result);
      setPhase('results');

      toast({
        title: "Quiz Submitted",
        description: "Your assessment has been completed successfully!",
      });
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast({
        title: "Error",
        description: "Failed to submit quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-2">
          <Target className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-3xl font-bold font-display">
          {phase === 'quiz' && 'Skill Assessment Quiz'}
          {phase === 'results' && 'Assessment Results'}
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          {phase === 'quiz' && 'Answer the questions for each selected skill. Each skill has 10 questions.'}
          {phase === 'results' && 'Here are your assessment results based on the quiz.'}
        </p>
      </div>

      {/* Progress */}
      {phase === 'quiz' && quizData && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Quiz Progress</span>
            <span className="text-muted-foreground">
              {Object.keys(quizAnswers).length} of {quizData.total_skills} skills completed
            </span>
          </div>
          <Progress value={(Object.keys(quizAnswers).length / quizData.total_skills) * 100} className="h-2" />
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      )}

      {/* Quiz Phase */}
      {!loading && phase === 'quiz' && quizData && (
        <div className="space-y-6">
          {Object.entries(quizData.questions).map(([skillId, skillData]) => {
            const skillAnswers = quizAnswers[skillId] || {};
            const answeredCount = Object.keys(skillAnswers).length;

            return (
              <Card key={skillId}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{skillData.skill_name}</span>
                    <span className="text-sm text-muted-foreground">
                      {answeredCount} of {skillData.questions.length} answered
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {skillData.questions.map((question, index) => {
                    const selectedAnswer = skillAnswers[question.id];

                    return (
                      <div key={question.id} className="space-y-3">
                        <h4 className="font-medium">
                          {index + 1}. {question.question_text}
                        </h4>
                        <div className="space-y-2">
                          {question.options.map((option, optionIndex) => (
                            <label
                              key={optionIndex}
                              className={cn(
                                "flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-colors",
                                selectedAnswer === option
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50"
                              )}
                            >
                              <input
                                type="radio"
                                name={`question-${question.id}`}
                                value={option}
                                checked={selectedAnswer === option}
                                onChange={(e) => {
                                  setQuizAnswers(prev => ({
                                    ...prev,
                                    [skillId]: {
                                      ...prev[skillId],
                                      [question.id]: e.target.value
                                    }
                                  }));
                                }}
                                className="text-primary"
                              />
                              <span>{option}</span>
                            </label>
                          ))}
                    </div>
                  </div>
                );
              })}

              {/* Written Assessment Section */}
              <div className="mt-8 pt-6 border-t">
                <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <span>✍️</span> Written Assessment
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Describe your experience with {skillData.skill_name}. Include projects you've worked on, tools you've used, and your proficiency level.
                </p>
                <textarea
                  value={writtenAssessments[skillId] || ''}
                  onChange={(e) => {
                    setWrittenAssessments(prev => ({
                      ...prev,
                      [skillId]: e.target.value
                    }));
                  }}
                  placeholder={`Write about your experience with ${skillData.skill_name}...`}
                  className="w-full min-h-[120px] p-3 rounded-lg border border-border bg-background resize-y focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <div className="mt-2 text-xs text-muted-foreground text-right">
                  {writtenAssessments[skillId]?.length || 0} characters
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

        </div>
      )}

      {/* Results Phase */}
      {!loading && phase === 'results' && quizResult && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Complete!</CardTitle>
              <CardDescription>
                Overall Score: {quizResult.overall_score.toFixed(1)}%
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(quizResult.skill_scores).map(([skillId, score]) => (
                  <div key={skillId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Skill {skillId}</h4>
                      <p className="text-sm text-muted-foreground">
                        {score.correct_answers} of {score.total_questions} correct
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{score.score.toFixed(1)}%</div>
                      <div className="text-sm text-muted-foreground capitalize">{score.level}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        {phase === 'quiz' && quizData && (
          <Button
            onClick={handleSubmitQuiz}
            disabled={isSubmitting || Object.keys(quizAnswers).length < quizData.total_skills}
            size="lg"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
            <CheckCircle2 className="w-4 h-4 ml-2" />
          </Button>
        )}

        {phase === 'results' && (
          <Button onClick={() => navigate('/results')} size="lg">
            View Results
            <Target className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
