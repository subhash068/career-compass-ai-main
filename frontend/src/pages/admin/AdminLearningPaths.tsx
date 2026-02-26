import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Loader2, 
  Search, 
  Trash2, 
  Eye, 
  Edit3, 
  BookOpen,
  Video,
  FileQuestion,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  CheckCircle2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { adminApi } from '@/api/admin.api';

interface LearningPath {
  id: number;
  user_id: number;
  target_role_id: number;
  target_role?: {
    id: number;
    title: string;
    description: string;
  };
  progress: number;
  total_duration: string;
  created_at: string;
  updated_at: string;
  steps?: LearningStep[];
}

interface LearningStep {
  id: number;
  skill_id: number;
  skill?: {
    id: number;
    name: string;
    description: string;
  };
  target_level: string;
  order: number;
  estimated_duration: string;
  is_completed: boolean;
  resources?: any[];
  assessment_questions?: any[];
}

interface StepFormData {
  target_level: string;
  estimated_duration: string;
  resources: string;
  assessment_questions: string;
}

export default function AdminLearningPaths() {
  const { toast } = useToast();
  
  // State declarations
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [pathDetails, setPathDetails] = useState<LearningPath | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [editingStep, setEditingStep] = useState<LearningStep | null>(null);
  const [isEditStepDialogOpen, setIsEditStepDialogOpen] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  
  const [stepFormData, setStepFormData] = useState<StepFormData>({
    target_level: 'beginner',
    estimated_duration: '',
    resources: '',
    assessment_questions: ''
  });

  // Fetch learning paths on mount
  useEffect(() => {
    fetchLearningPaths();
  }, []);

  const fetchLearningPaths = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getLearningPaths();
      setPaths(response.paths || []);
    } catch (error) {
      console.error('Error fetching learning paths:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch learning paths',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPathDetails = async (pathId: number) => {
    try {
      setDetailsLoading(true);
      const response = await adminApi.getLearningPathDetails(pathId);
      setPathDetails(response);
    } catch (error) {
      console.error('Error fetching path details:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch path details',
        variant: 'destructive',
      });
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDeletePath = async (pathId: number) => {
    if (!confirm('Are you sure you want to delete this learning path?')) {
      return;
    }

    try {
      await adminApi.deleteLearningPath(pathId);
      toast({
        title: 'Success',
        description: 'Learning path deleted successfully',
      });
      fetchLearningPaths();
    } catch (error) {
      console.error('Error deleting path:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete learning path',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateStep = async () => {
    if (!selectedPath || !editingStep) return;

    try {
      const resources = stepFormData.resources ? JSON.parse(stepFormData.resources) : [];
      const assessmentQuestions = stepFormData.assessment_questions ? JSON.parse(stepFormData.assessment_questions) : [];
      
      await adminApi.updateLearningStep(selectedPath.id, editingStep.id, {
        target_level: stepFormData.target_level,
        estimated_duration: stepFormData.estimated_duration,
        resources: resources,
        assessment_questions: assessmentQuestions
      });
      
      toast({
        title: 'Success',
        description: 'Learning step updated successfully',
      });
      
      setIsEditStepDialogOpen(false);
      setEditingStep(null);
      fetchPathDetails(selectedPath.id);
    } catch (error) {
      console.error('Error updating step:', error);
      toast({
        title: 'Error',
        description: 'Failed to update learning step. Check JSON format.',
        variant: 'destructive',
      });
    }
  };

  const openEditStepDialog = (step: LearningStep) => {
    setEditingStep(step);
    setStepFormData({
      target_level: step.target_level || 'beginner',
      estimated_duration: step.estimated_duration || '',
      resources: step.resources ? JSON.stringify(step.resources, null, 2) : '[]',
      assessment_questions: step.assessment_questions ? JSON.stringify(step.assessment_questions, null, 2) : '[]'
    });
    setIsEditStepDialogOpen(true);
  };

  const handleEditStepSuccess = () => {
    setIsEditStepDialogOpen(false);
    setEditingStep(null);
    if (selectedPath) {
      fetchPathDetails(selectedPath.id);
    }
  };


  const toggleStepExpansion = (stepId: number) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const filteredPaths = paths.filter(path => 
    path.target_role?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    path.user_id?.toString().includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading learning paths...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Learning Path Management</h1>
        <p className="text-muted-foreground">
          Manage user learning paths, modules, and resources
        </p>
      </div>

      {/* Search and Actions */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by role title or user ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={fetchLearningPaths} variant="outline">
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Learning Paths Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Learning Paths ({filteredPaths.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Target Role</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPaths.map((path) => (
                <TableRow key={path.id}>
                  <TableCell>{path.id}</TableCell>
                  <TableCell>{path.user_id}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {path.target_role?.title || `Role ${path.target_role_id}`}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary"
                          style={{ width: `${path.progress}%` }}
                        />
                      </div>
                      <span className="text-sm">{path.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{path.total_duration}</TableCell>
                  <TableCell>
                    {new Date(path.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedPath(path);
                              fetchPathDetails(path.id);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>
                              Learning Path Details - {path.target_role?.title}
                            </DialogTitle>
                          </DialogHeader>
                          
                          {detailsLoading ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="w-6 h-6 animate-spin" />
                            </div>
                          ) : pathDetails ? (
                            <div className="space-y-6">
                              {/* Path Info */}
                              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                                <div>
                                  <p className="text-sm text-muted-foreground">User ID</p>
                                  <p className="font-medium">{pathDetails.user_id}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Progress</p>
                                  <p className="font-medium">{pathDetails.progress}%</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Total Duration</p>
                                  <p className="font-medium">{pathDetails.total_duration}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Steps</p>
                                  <p className="font-medium">{pathDetails.steps?.length || 0}</p>
                                </div>
                              </div>

                              {/* Steps */}
                              <div>
                                <h3 className="font-semibold mb-4">Learning Steps</h3>
                                <div className="space-y-4">
                                  {pathDetails.steps?.map((step, index) => (
                                    <Card key={step.id}>
                                      <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="p-0 h-auto"
                                                onClick={() => toggleStepExpansion(step.id)}
                                              >
                                                {expandedSteps.has(step.id) ? (
                                                  <ChevronUp className="w-4 h-4" />
                                                ) : (
                                                  <ChevronDown className="w-4 h-4" />
                                                )}
                                              </Button>
                                              <Badge variant={step.is_completed ? "default" : "secondary"} className={step.is_completed ? "bg-green-100 text-green-800" : ""}>
                                                Step {index + 1}
                                              </Badge>
                                              <Badge variant="outline">
                                                {step.target_level}
                                              </Badge>
                                            </div>
                                            <h4 className="font-medium ml-6">
                                              {step.skill?.name || `Skill ${step.skill_id}`}
                                            </h4>
                                            <p className="text-sm text-muted-foreground ml-6">
                                              Duration: {step.estimated_duration || 'Not set'}
                                            </p>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                openEditStepDialog(step);
                                              }}
                                              className="text-blue-600 hover:text-blue-800"
                                            >
                                              <Edit3 className="w-4 h-4 mr-1" />
                                              Edit
                                            </Button>
                                          </div>

                                        </div>

                                        {/* Expanded Content */}
                                        {expandedSteps.has(step.id) && (
                                          <>
                                            {/* Resources */}
                                            <div className="mt-4 ml-6">
                                              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                                                <BookOpen className="w-4 h-4" />
                                                Resources ({step.resources?.length || 0})
                                              </p>
                                              {step.resources && step.resources.length > 0 ? (
                                                <div className="space-y-2">
                                                  {step.resources.map((resource: any, idx: number) => (
                                                    <div key={idx} className="flex items-center gap-2 text-sm p-2 bg-muted rounded">
                                                      <Video className="w-4 h-4" />
                                                      <span>{resource.title || resource}</span>
                                                      {resource.url && (
                                                        <a 
                                                          href={resource.url} 
                                                          target="_blank" 
                                                          rel="noopener noreferrer"
                                                          className="text-blue-600 hover:underline ml-auto"
                                                        >
                                                          View
                                                        </a>
                                                      )}
                                                    </div>
                                                  ))}
                                                </div>
                                              ) : (
                                                <p className="text-sm text-muted-foreground">No resources added</p>
                                              )}
                                            </div>

                                            {/* Assessment Questions */}
                                            <div className="mt-4 ml-6">
                                              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                                                <FileQuestion className="w-4 h-4" />
                                                Assessment Questions ({step.assessment_questions?.length || 0})
                                              </p>
                                              {step.assessment_questions && step.assessment_questions.length > 0 ? (
                                                <div className="space-y-2">
                                                  {step.assessment_questions.map((q: any, idx: number) => (
                                                    <div key={idx} className="text-sm p-2 bg-muted rounded">
                                                      <p className="font-medium">Q{idx + 1}: {q.question || q}</p>
                                                      {q.options && (
                                                        <ul className="mt-1 ml-4 list-disc text-muted-foreground">
                                                          {q.options.map((opt: string, optIdx: number) => (
                                                            <li key={optIdx} className={opt === q.correct_answer ? 'text-green-600 font-medium' : ''}>
                                                              {opt} {opt === q.correct_answer && '✓'}
                                                            </li>
                                                          ))}
                                                        </ul>
                                                      )}
                                                    </div>
                                                  ))}
                                                </div>
                                              ) : (
                                                <p className="text-sm text-muted-foreground">No assessment questions</p>
                                              )}
                                            </div>
                                          </>
                                        )}
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-muted-foreground">No details available</p>
                          )}
                        </DialogContent>
                      </Dialog>

                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeletePath(path.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredPaths.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-success" />
              <p className="font-medium">No learning paths found!</p>
              <p className="text-sm">Try adjusting your search or create a new path.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Step Dialog - Separate from View Dialog */}
      <Dialog 
        open={isEditStepDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setIsEditStepDialogOpen(false);
            setEditingStep(null);
          }
        }}
      >
        <DialogContent 
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              Edit Learning Step - {editingStep?.skill?.name || `Skill ${editingStep?.skill_id}`}
            </DialogTitle>
          </DialogHeader>
          
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleUpdateStep();
            }}
            className="space-y-6 py-4"
          >
            {/* Target Level */}
            <div className="space-y-2">
              <Label htmlFor="target_level">Target Level *</Label>
              <Select
                value={stepFormData.target_level}
                onValueChange={(value) => setStepFormData({ ...stepFormData, target_level: value })}
              >
                <SelectTrigger id="target_level" className="w-full">
                  <SelectValue placeholder="Select target level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Estimated Duration */}
            <div className="space-y-2">
              <Label htmlFor="estimated_duration">Estimated Duration *</Label>
              <Input
                id="estimated_duration"
                type="text"
                value={stepFormData.estimated_duration}
                onChange={(e) => setStepFormData({ ...stepFormData, estimated_duration: e.target.value })}
                placeholder="e.g., 2 hours, 3 days, 1 week"
                className="w-full"
              />
            </div>

            {/* Resources JSON */}
            <div className="space-y-2">
              <Label htmlFor="resources">
                Resources (JSON format)
                <span className="text-xs text-muted-foreground ml-2">Array of objects with title, url, type</span>
              </Label>
              <Textarea
                id="resources"
                value={stepFormData.resources}
                onChange={(e) => setStepFormData({ ...stepFormData, resources: e.target.value })}
                placeholder={`[
  {
    "title": "Introduction Video",
    "url": "https://example.com/video",
    "type": "video"
  }
]`}
                rows={6}
                className="font-mono text-sm w-full"
              />
            </div>

            {/* Assessment Questions JSON */}
            <div className="space-y-2">
              <Label htmlFor="assessment_questions">
                Assessment Questions (JSON format)
                <span className="text-xs text-muted-foreground ml-2">Array of objects with question, options, correct_answer</span>
              </Label>
              <Textarea
                id="assessment_questions"
                value={stepFormData.assessment_questions}
                onChange={(e) => setStepFormData({ ...stepFormData, assessment_questions: e.target.value })}
                placeholder={`[
  {
    "question": "What is...?",
    "options": ["A", "B", "C", "D"],
    "correct_answer": "A"
  }
]`}
                rows={8}
                className="font-mono text-sm w-full"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => {
                  setIsEditStepDialogOpen(false);
                  setEditingStep(null);
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
