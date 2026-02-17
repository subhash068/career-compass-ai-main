import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Trophy, 
  Calendar, 
  ArrowLeft, 
  Target, 
  TrendingUp, 
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
  RotateCcw
} from 'lucide-react';

import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CompletedAssessment {

  skill_id: number;
  skill_name: string;
  score: number;
  level: string;
  confidence: number;
  completed_at: string;
  correct_answers?: number;
  total_questions?: number;
}

export default function AssessmentHistory() {
  const [assessments, setAssessments] = useState<CompletedAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assessmentToDelete, setAssessmentToDelete] = useState<CompletedAssessment | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();


  useEffect(() => {
    const fetchCompletedAssessments = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('Please login to view your assessment history');
          setLoading(false);
          return;
        }
        
        // Fetch from API endpoint
        const response = await fetch('http://localhost:5000/api/assessment/completed', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setAssessments(data.assessments || []);
        } else {
          const errorData = await response.json();
          setError(errorData.detail || 'Failed to fetch assessments');
        }
      } catch (error) {
        console.error('Error fetching completed assessments:', error);
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedAssessments();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100 border-green-200';
    if (score >= 60) return 'text-blue-600 bg-blue-100 border-blue-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    return 'text-red-600 bg-red-100 border-red-200';
  };

  const getLevelBadgeVariant = (level: string) => {
    const lowerLevel = level.toLowerCase();
    if (lowerLevel === 'expert') return 'default';
    if (lowerLevel === 'advanced') return 'secondary';
    if (lowerLevel === 'intermediate') return 'outline';
    return 'secondary';
  };

  const getLevelIcon = (level: string) => {
    const lowerLevel = level.toLowerCase();
    if (lowerLevel === 'expert') return <Trophy className="w-4 h-4 text-yellow-500" />;
    if (lowerLevel === 'advanced') return <Award className="w-4 h-4 text-blue-500" />;
    if (lowerLevel === 'intermediate') return <TrendingUp className="w-4 h-4 text-green-500" />;
    return <Target className="w-4 h-4 text-gray-500" />;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateStats = () => {
    if (assessments.length === 0) return null;
    
    const totalAssessments = assessments.length;
    const averageScore = assessments.reduce((sum, a) => sum + a.score, 0) / totalAssessments;
    const expertCount = assessments.filter(a => a.level.toLowerCase() === 'expert').length;
    const advancedCount = assessments.filter(a => a.level.toLowerCase() === 'advanced').length;
    
    return {
      totalAssessments,
      averageScore: averageScore.toFixed(1),
      expertCount,
      advancedCount
    };
  };

  const handleDeleteAssessment = async (assessment: CompletedAssessment) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast({
          title: "Error",
          description: "Please login to delete assessments",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`http://localhost:5000/api/assessment/delete/${assessment.skill_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setAssessments(prev => prev.filter(a => a.skill_id !== assessment.skill_id));
        toast({
          title: "Success",
          description: `Assessment for ${assessment.skill_name} has been deleted.`,
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.detail || 'Failed to delete assessment',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting assessment:', error);
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    }
    setDeleteDialogOpen(false);
    setAssessmentToDelete(null);
  };

  const handleRetakeExam = (assessment: CompletedAssessment) => {
    const encodedSkillName = encodeURIComponent(assessment.skill_name.toLowerCase().replace(/\s+/g, '-'));
    navigate(`/skill_selection/assessment/${encodedSkillName}`, {
      state: { 
        skillId: assessment.skill_id, 
        skillName: assessment.skill_name 
      }
    });
  };


  const confirmDelete = (assessment: CompletedAssessment) => {
    setAssessmentToDelete(assessment);
    setDeleteDialogOpen(true);
  };

  const stats = calculateStats();

  if (loading) {

    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
        
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
        
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertCircle className="w-6 h-6" />
              <h2 className="text-lg font-semibold">Error Loading Assessments</h2>
            </div>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-display">Assessment History</h1>
            <p className="text-muted-foreground mt-1">
              View all your completed skill assessments
            </p>
          </div>
        </div>
        <Button onClick={() => navigate('/skill_selection')}>
          <Trophy className="w-4 h-4 mr-2" />
          Take New Assessment
        </Button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Assessments</p>
                  <p className="text-3xl font-bold">{stats.totalAssessments}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Average Score</p>
                  <p className="text-3xl font-bold">{stats.averageScore}%</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Expert Level</p>
                  <p className="text-3xl font-bold">{stats.expertCount}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Advanced Level</p>
                  <p className="text-3xl font-bold">{stats.advancedCount}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Award className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assessment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the assessment for "{assessmentToDelete?.skill_name}"? 
              This action cannot be undone and you will lose your score of {assessmentToDelete?.score.toFixed(1)}%.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAssessmentToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => assessmentToDelete && handleDeleteAssessment(assessmentToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assessments List */}
      {assessments.length === 0 ? (
        <Card className="border-dashed">

          <CardContent className="pt-12 pb-12 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Assessments Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              You haven't completed any skill assessments. Start your first assessment to track your progress and see your scores here.
            </p>
            <Button onClick={() => navigate('/skill_selection')} size="lg">
              Start Your First Assessment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {assessments.map((assessment, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">


              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Skill Info */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{assessment.skill_name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(assessment.completed_at)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Middle: Level Badge */}
                  <div className="flex items-center gap-2">
                    {getLevelIcon(assessment.level)}
                    <Badge variant={getLevelBadgeVariant(assessment.level)} className="text-sm px-3 py-1">
                      {assessment.level}
                    </Badge>
                  </div>
                  
                  {/* Right: Score */}
                  <div className={`px-6 py-3 rounded-lg border-2 font-bold text-lg ${getScoreColor(assessment.score)}`}>
                    {assessment.score.toFixed(1)}%
                  </div>
                </div>
                
                {/* Additional Details */}
                <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Confidence</p>
                    <p className="font-medium">{assessment.confidence.toFixed(0)}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Skill ID</p>
                    <p className="font-medium">#{assessment.skill_id}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="font-medium">Completed</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 pt-4 border-t flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRetakeExam(assessment)}
                    className="flex-1"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Retake Exam
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => confirmDelete(assessment)}
                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>

          ))}
        </div>
      )}
    </div>
  );
}
