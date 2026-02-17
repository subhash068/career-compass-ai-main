import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Target, Play, CheckCircle2, Clock, Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Skill {
  id: number;
  name: string;
  description?: string;
  difficulty?: string;
}

export default function AssessmentLanding() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [completedSkills, setCompletedSkills] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const loadSelectedSkills = async () => {
      try {
        const assessmentId = sessionStorage.getItem('assessmentId');
        if (!assessmentId) {
          toast({
            title: "No assessment found",
            description: "Please go back and select skills first.",
            variant: "destructive",
          });
          navigate('/skill_selection');
          return;
        }

        // Get selected skills from session storage or API
        const selectedSkillsData = sessionStorage.getItem('selectedSkills');
        let loadedSkills: Skill[] = [];
        if (selectedSkillsData) {
          loadedSkills = JSON.parse(selectedSkillsData);
          setSkills(loadedSkills);
        } else {
          // Fallback: fetch from API
          const response = await fetch(`http://localhost:5000/api/assessment/selected-skills?assessment_id=${assessmentId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`

            }
          });

          if (response.ok) {
            const data = await response.json();
            loadedSkills = data.skills;
            setSkills(loadedSkills);
            sessionStorage.setItem('selectedSkills', JSON.stringify(data.skills));
          } else {
            throw new Error('Failed to load skills');
          }
        }

        // Store pending skills in localStorage for exam navigation
        localStorage.setItem('pendingSkills', JSON.stringify(loadedSkills));

      } catch (error) {
        console.error('Error loading skills:', error);
        toast({
          title: "Error",
          description: "Failed to load selected skills.",
          variant: "destructive",
        });
        navigate('/skill_selection');
      } finally {
        setLoading(false);
      }
    };

    loadSelectedSkills();
  }, [navigate, toast]);

  const handleStartExam = (skill: Skill) => {
    // Check if already completed
    if (completedSkills.has(skill.id)) {
      toast({
        title: "Already completed",
        description: `You have already completed the ${skill.name} assessment.`,
        variant: "destructive",
      });
      return;
    }

    // Store skill info in localStorage for exam page to access
    localStorage.setItem('currentSkillId', skill.id.toString());
    localStorage.setItem('currentSkillName', skill.name);

    // Navigate to exam page with skill name in URL
    const encodedSkillName = encodeURIComponent(skill.name.toLowerCase().replace(/\s+/g, '-'));
    navigate(`/skill_selection/assessment/${encodedSkillName}`, {
      state: {
        skillId: skill.id,
        skillName: skill.name,
        fromAssessment: true
      }
    });
  };


  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-2">
          <Target className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-3xl font-bold font-display">
          Assessment Ready
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          You've selected {skills.length} skill{skills.length !== 1 ? 's' : ''} to assess.
          Click "Start Exam" for each skill to begin your assessment.
        </p>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium">Assessment Progress</span>
          <span className="text-muted-foreground">
            {completedSkills.size} of {skills.length} completed
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(completedSkills.size / skills.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Skills List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Selected Skills</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {skills.map((skill) => {
            const isCompleted = completedSkills.has(skill.id);

            return (
              <Card key={skill.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{skill.name}</CardTitle>
                      {skill.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {skill.description}
                        </p>
                      )}
                    </div>
                    {isCompleted && (
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {skill.difficulty && (
                        <Badge className={getDifficultyColor(skill.difficulty)}>
                          {skill.difficulty}
                        </Badge>
                      )}
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 mr-1" />
                        10 min
                      </div>
                    </div>
                    <Button
                      onClick={() => handleStartExam(skill)}
                      disabled={isCompleted}
                      className="min-w-[120px]"
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Completed
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Start Exam
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate('/skill_selection')}
        >
          Back to Selection
        </Button>
        {completedSkills.size === skills.length && (
          <Button onClick={() => navigate('/results')}>
            View Results
          </Button>
        )}
      </div>
    </div>
  );
}
