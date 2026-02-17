import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2, XCircle, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Question {
  id: number;
  question: string;
  options: string[];
}

interface StepAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  skillName: string;
  targetLevel: string;
  questions: Question[];
  onSubmit: (answers: string[]) => Promise<{
    passed: boolean;
    score: number;
    correct_answers: number;
    total_questions: number;
    message: string;
  }>;
  onPass: () => void;
}

export function StepAssessmentModal({
  isOpen,
  onClose,
  skillName,
  targetLevel,
  questions,
  onSubmit,
  onPass,
}: StepAssessmentModalProps) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    passed: boolean;
    score: number;
    correct_answers: number;
    total_questions: number;
    message: string;
  } | null>(null);

  const handleSubmit = async () => {
    // Check if all questions are answered
    if (Object.keys(answers).length !== questions.length) {
      return;
    }

    setIsSubmitting(true);
    try {
      const answerArray = questions.map((q) => answers[q.id]);
      const response = await onSubmit(answerArray);
      setResult(response);

      if (response.passed) {
        onPass();
      }
    } catch (error) {
      console.error('Error submitting assessment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setResult(null);
  };

  const allAnswered = Object.keys(answers).length === questions.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-display">
            {result ? 'Assessment Result' : 'Module Assessment'}
          </DialogTitle>
          <DialogDescription>
            {result ? (
              <span className={cn(
                "font-medium",
                result.passed ? "text-success" : "text-destructive"
              )}>
                {result.message}
              </span>
            ) : (
              <>
                Test your knowledge of <strong>{skillName}</strong> ({targetLevel} level).
                <br />
                You need 70% to pass. Answer all {questions.length} questions.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-6">
            {/* Result Display */}
            <div className={cn(
              "p-6 rounded-lg text-center",
              result.passed ? "bg-success/10 border border-success/30" : "bg-destructive/10 border border-destructive/30"
            )}>
              {result.passed ? (
                <Trophy className="w-16 h-16 mx-auto mb-4 text-success" />
              ) : (
                <XCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
              )}
              
              <div className="text-4xl font-bold mb-2">
                {result.score}%
              </div>
              <p className="text-muted-foreground">
                {result.correct_answers} out of {result.total_questions} correct
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              {!result.passed && (
                <Button variant="outline" onClick={handleRetry}>
                  Try Again
                </Button>
              )}
              <Button onClick={onClose}>
                {result.passed ? 'Continue Learning' : 'Close'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Questions */}
            <div className="space-y-6">
              {questions.map((question, index) => (
                <div key={question.id} className="space-y-3">
                  <div className="font-medium">
                    <span className="text-primary mr-2">Q{index + 1}.</span>
                    {question.question}
                  </div>
                  
                  <RadioGroup
                    value={answers[question.id] || ''}
                    onValueChange={(value) => {
                      setAnswers((prev) => ({
                        ...prev,
                        [question.id]: value,
                      }));
                    }}
                    className="space-y-2"
                  >
                    {question.options.map((option, optIndex) => (
                      <div
                        key={optIndex}
                        className={cn(
                          "flex items-center space-x-2 p-3 rounded-lg border transition-colors cursor-pointer",
                          answers[question.id] === option
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted/50"
                        )}
                        onClick={() => {
                          setAnswers((prev) => ({
                            ...prev,
                            [question.id]: option,
                          }));
                        }}
                      >
                        <RadioGroupItem
                          value={option}
                          id={`q${question.id}-opt${optIndex}`}
                        />
                        <Label
                          htmlFor={`q${question.id}-opt${optIndex}`}
                          className="flex-1 cursor-pointer"
                        >
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              ))}
            </div>

            {/* Progress */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Answered: {Object.keys(answers).length} / {questions.length}
              </span>
              <span>
                {Math.round((Object.keys(answers).length / questions.length) * 100)}% complete
              </span>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={!allAnswered || isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Submit Assessment
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
