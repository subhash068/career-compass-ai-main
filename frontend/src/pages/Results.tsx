import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Trophy, TrendingUp, TrendingDown, Minus, Target,
  CheckCircle2, AlertTriangle, XCircle, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { skillsApi } from '@/api/skills.api';
import { useToast } from '@/hooks/use-toast';

interface SkillResult {
  score: number;
  percentage: number;
  level: string;
  gap: string;
  correct_answers: number;
  total_questions: number;
}

interface ResultsData {
  overall_score: number;
  skill_scores: Record<string, SkillResult>;
  recommendations: string[];
  strong_skills: string[];
  weak_skills: string[];
  learning_path: string[];
}

const getGapIcon = (gap: string) => {
  switch (gap.toLowerCase()) {
    case 'high':
      return <XCircle className="w-4 h-4 text-red-500" />;
    case 'medium':
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    case 'low':
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    default:
      return <Minus className="w-4 h-4 text-gray-500" />;
  }
};

const getGapColor = (gap: string) => {
  switch (gap.toLowerCase()) {
    case 'high':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'medium':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'low':
      return 'text-green-600 bg-green-50 border-green-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

const getLevelIcon = (level: string) => {
  switch (level.toLowerCase()) {
    case 'beginner':
      return <TrendingDown className="w-4 h-4" />;
    case 'intermediate':
      return <Minus className="w-4 h-4" />;
    case 'advanced':
      return <TrendingUp className="w-4 h-4" />;
    default:
      return <Target className="w-4 h-4" />;
  }
};

export default function Results() {
  const [results, setResults] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const loadResults = async () => {
      try {
        // Get assessment ID from session storage
        const assessmentId = sessionStorage.getItem('assessmentId');
        if (!assessmentId) {
          toast({
            title: "No assessment found",
            description: "Please complete an assessment first.",
            variant: "destructive",
          });
          navigate('/skill_selection');
          return;
        }

        // Get selected skills to show results for each
        const selectedSkillsData = sessionStorage.getItem('selectedSkills');
        if (!selectedSkillsData) {
          toast({
            title: "No skills found",
            description: "Please select skills first.",
            variant: "destructive",
          });
          navigate('/skill_selection');
          return;
        }

        const selectedSkills = JSON.parse(selectedSkillsData);

        // Get results for each skill
        const skillResults: Record<string, SkillResult> = {};
        let totalScore = 0;
        let totalQuestions = 0;
        let totalCorrect = 0;

        for (const skill of selectedSkills) {
          try {
            const response = await fetch(`http://localhost:5000/api/assessment/result/${skill.id}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`

              }
            });

            if (response.ok) {
              const skillResult = await response.json();
              skillResults[skill.name] = {
                score: skillResult.score,
                percentage: skillResult.percentage,
                level: skillResult.level,
                gap: skillResult.confidence < 50 ? 'High' : skillResult.confidence < 70 ? 'Medium' : 'Low',
                correct_answers: Math.round((skillResult.percentage / 100) * 10), // Assuming 10 questions
                total_questions: 10
              };

              totalScore += skillResult.percentage;
              totalCorrect += Math.round((skillResult.percentage / 100) * 10);
              totalQuestions += 10;
            }
          } catch (e) {
            console.log(`Could not get result for ${skill.name}:`, e);
          }
        }

        const overallScore = totalQuestions > 0 ? (totalScore / selectedSkills.length) : 0;

        // Generate recommendations based on results
        const weakSkills = Object.entries(skillResults)
          .filter(([_, result]) => result.gap === 'High')
          .map(([name, _]) => name);

        const strongSkills = Object.entries(skillResults)
          .filter(([_, result]) => result.gap === 'Low')
          .map(([name, _]) => name);

        const recommendations = weakSkills.map(skill =>
          `Focus on improving ${skill} through targeted practice and learning resources.`
        );

        const learningPath = [
          "Review weak areas with additional practice questions",
          "Complete targeted learning modules for identified gaps",
          "Apply skills in practical projects",
          "Retake assessment to track improvement"
        ];

        setResults({
          overall_score: overallScore,
          skill_scores: skillResults,
          recommendations,
          strong_skills: strongSkills,
          weak_skills: weakSkills,
          learning_path: learningPath
        });

      } catch (error) {
        console.error('Error loading results:', error);
        toast({
          title: "Error",
          description: "Failed to load assessment results. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [toast, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!results) {
    return (
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">No Results Found</h1>
        <p>Please complete an assessment first.</p>
        <Button onClick={() => navigate('/skill_selection')}>
          Start New Assessment
        </Button>
      </div>
    );
  }

  const overallLevel = results.overall_score >= 80 ? 'Advanced' :
                      results.overall_score >= 60 ? 'Intermediate' : 'Beginner';

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-2">
          <Trophy className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-3xl font-bold font-display">
          Assessment Results
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Here's your skill assessment breakdown and personalized recommendations.
        </p>
      </div>

      {/* Overall Score */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Overall Score</CardTitle>
          <div className="text-6xl font-bold text-primary my-4">
            {results.overall_score.toFixed(1)}%
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {overallLevel} Level
          </Badge>
        </CardHeader>
      </Card>

      {/* Skill-wise Results */}
      <Card>
        <CardHeader>
          <CardTitle>Skill Breakdown</CardTitle>
          <CardDescription>
            Detailed results for each assessed skill
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(results.skill_scores).map(([skillName, skillResult]) => (
            <div key={skillName} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h4 className="font-semibold">{skillName}</h4>
                  <Badge className={cn("flex items-center gap-1", getGapColor(skillResult.gap))}>
                    {getGapIcon(skillResult.gap)}
                    {skillResult.level}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">{skillResult.percentage.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">
                    {skillResult.correct_answers} / {skillResult.total_questions} correct
                  </div>
                </div>
              </div>
              <Progress value={skillResult.percentage} className="h-2" />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Skill Gap: {skillResult.gap}</span>
                <span>Level: {skillResult.level}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strong Skills */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="w-5 h-5" />
              Strong Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {results.strong_skills.map((skill, index) => (
                <li key={index} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  {skill}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Weak Skills */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {results.weak_skills.map((skill, index) => (
                <li key={index} className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  {skill}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Learning Path */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Recommended Learning Path
          </CardTitle>
          <CardDescription>
            Personalized steps to improve your skills
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {results.learning_path.map((step, index) => (
              <li key={index} className="flex items-start gap-3">
                <Badge variant="outline" className="mt-0.5">
                  {index + 1}
                </Badge>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <Button onClick={() => navigate('/skill_selection')} variant="outline">
          Take Another Assessment
        </Button>
        <Button onClick={() => navigate('/dashboard')}>
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
