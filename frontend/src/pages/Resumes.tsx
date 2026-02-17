import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Edit, 
  Upload, 
  BarChart3, 
  Loader2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { resumeApi, Resume } from '@/api/resume.api';
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

export default function Resumes() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resumeToDelete, setResumeToDelete] = useState<Resume | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = async () => {
    try {
      setLoading(true);
      const response = await resumeApi.getUserResumes();
      if (response.success) {
        setResumes(response.resumes);
      }
    } catch (error) {
      console.error('Error loading resumes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load resumes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!resumeToDelete) return;
    
    try {
      setDeleting(true);
      const response = await resumeApi.deleteResume(resumeToDelete.id);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Resume deleted successfully',
        });
        setResumes(resumes.filter(r => r.id !== resumeToDelete.id));
      }
    } catch (error) {
      console.error('Error deleting resume:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete resume',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setResumeToDelete(null);
    }
  };

  const getScoreColor = (score: number | undefined) => {
    if (!score) return 'bg-gray-100 text-gray-600';
    if (score >= 80) return 'bg-green-100 text-green-700';
    if (score >= 60) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const getScoreIcon = (score: number | undefined) => {
    if (!score) return <AlertCircle className="w-4 h-4" />;
    if (score >= 80) return <CheckCircle2 className="w-4 h-4" />;
    if (score >= 60) return <AlertCircle className="w-4 h-4" />;
    return <AlertCircle className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Resumes</h1>
          <p className="text-gray-600 mt-1">
            Manage your resumes and check ATS compatibility scores
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/resumes/ats-checker')}
          >
            <Upload className="w-4 h-4 mr-2" />
            ATS Checker
          </Button>
          <Button onClick={() => navigate('/resumes/builder')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Resume
          </Button>
        </div>
      </div>

      {/* Resumes Grid */}
      {resumes.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No resumes yet</h3>
            <p className="text-gray-600 text-center max-w-md mb-6">
              Create your first resume or upload an existing one to get started with your job search
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/resumes/ats-checker')}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Resume
              </Button>
              <Button onClick={() => navigate('/resumes/builder')}>
                <Plus className="w-4 h-4 mr-2" />
                Create New
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resumes.map((resume) => (
            <Card key={resume.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate" title={resume.title}>
                      {resume.title}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {new Date(resume.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <FileText className="w-8 h-8 text-primary flex-shrink-0 ml-2" />
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* ATS Score */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">ATS Score</span>
                  <Badge 
                    variant="secondary" 
                    className={`${getScoreColor(resume.ats_score)} flex items-center gap-1`}
                  >
                    {getScoreIcon(resume.ats_score)}
                    {resume.ats_score ? `${resume.ats_score.toFixed(1)}%` : 'Not analyzed'}
                  </Badge>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="bg-gray-50 rounded p-2">
                    <div className="font-semibold text-gray-900">
                      {resume.experience?.length || 0}
                    </div>
                    <div className="text-gray-600 text-xs">Jobs</div>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <div className="font-semibold text-gray-900">
                      {resume.education?.length || 0}
                    </div>
                    <div className="text-gray-600 text-xs">Education</div>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <div className="font-semibold text-gray-900">
                      {resume.skills?.length || 0}
                    </div>
                    <div className="text-gray-600 text-xs">Skills</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/resumes/builder?id=${resume.id}`)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/resumes/ats-checker?resumeId=${resume.id}`)}
                  >
                    <BarChart3 className="w-4 h-4 mr-1" />
                    ATS Score
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      setResumeToDelete(resume);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Add New Card */}
          <Card 
            className="border-dashed border-2 hover:border-primary hover:bg-primary/5 cursor-pointer transition-colors"
            onClick={() => navigate('/resumes/builder')}
          >
            <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px]">
              <Plus className="w-12 h-12 text-gray-400 mb-3" />
              <span className="text-gray-600 font-medium">Create New Resume</span>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resume</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{resumeToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
