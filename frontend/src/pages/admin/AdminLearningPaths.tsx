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
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  CheckCircle2,
  Target,
  Clock,
  User,
  TrendingUp,
  Filter,
  Download,
  Plus,
  LayoutGrid,
  List,
  PlayCircle,
  Calendar,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { adminApi } from '@/api/admin.api';
import { cn } from '@/lib/utils';

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
  skill_name: string;
}

export default function AdminLearningPaths() {
  const { toast } = useToast();
  
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [pathDetails, setPathDetails] = useState<LearningPath | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [editingStep, setEditingStep] = useState<LearningStep | null>(null);
  const [isEditStepDialogOpen, setIsEditStepDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<'all' | 'in-progress' | 'completed' | 'not-started'>('all');
  const [isAddingNewStep, setIsAddingNewStep] = useState(false);
  
  const [stepFormData, setStepFormData] = useState<StepFormData>({
    target_level: 'beginner',
    estimated_duration: '',
    resources: '',
    assessment_questions: '',
    skill_name: ''
  });

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
      
      if (isAddingNewStep) {
        // Create new step using POST endpoint
        const createData: any = {
          skill_name: stepFormData.skill_name,
          target_level: stepFormData.target_level,
          estimated_duration: stepFormData.estimated_duration,
          resources: resources,
          assessment_questions: assessmentQuestions
        };
        
        await adminApi.createLearningStep(selectedPath.id, createData);
      } else {
        // Update existing step using PUT endpoint
        const updateData: any = {
          target_level: stepFormData.target_level,
          estimated_duration: stepFormData.estimated_duration,
          resources: resources,
          assessment_questions: assessmentQuestions
        };
        
        await adminApi.updateLearningStep(selectedPath.id, editingStep.id, updateData);
      }
      
      toast({
        title: 'Success',
        description: isAddingNewStep ? 'Learning step added successfully' : 'Learning step updated successfully',
      });
      
      setIsEditStepDialogOpen(false);
      setEditingStep(null);
      setIsAddingNewStep(false);
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

  const handleDeleteStep = async (stepId: number) => {
    if (!selectedPath) return;
    
    if (!confirm('Are you sure you want to delete this learning step?')) {
      return;
    }

    try {
      await adminApi.deleteLearningStep(selectedPath.id, stepId);
      toast({
        title: 'Success',
        description: 'Learning step deleted successfully',
      });
      fetchPathDetails(selectedPath.id);
    } catch (error) {
      console.error('Error deleting step:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete learning step',
        variant: 'destructive',
      });
    }
  };

  const openEditStepDialog = (step: LearningStep) => {
    setIsAddingNewStep(false);
    setEditingStep(step);
    setStepFormData({
      target_level: step.target_level || 'beginner',
      estimated_duration: step.estimated_duration || '',
      resources: step.resources ? JSON.stringify(step.resources, null, 2) : '[]',
      assessment_questions: step.assessment_questions ? JSON.stringify(step.assessment_questions, null, 2) : '[]',
      skill_name: step.skill?.name || ''
    });
    setIsEditStepDialogOpen(true);
  };

  const openAddStepDialog = () => {
    setIsAddingNewStep(true);
    const newStep: LearningStep = {
      id: 0,
      skill_id: 0,
      target_level: 'beginner',
      order: (pathDetails?.steps?.length || 0) + 1,
      estimated_duration: '',
      is_completed: false,
      resources: [],
      assessment_questions: []
    };
    setEditingStep(newStep);
    setStepFormData({
      target_level: 'beginner',
      estimated_duration: '',
      resources: '[]',
      assessment_questions: '[]',
      skill_name: ''
    });
    setIsEditStepDialogOpen(true);
  };

  const getStatusColor = (progress: number) => {
    if (progress === 0) return 'bg-slate-500';
    if (progress === 100) return 'bg-green-500';
    return 'bg-blue-500';
  };

  const getStatusBadge = (progress: number): { label: string; variant: 'secondary' | 'default' | 'outline' } => {
    if (progress === 0) {
      return { label: 'Not Started', variant: 'secondary' };
    }
    if (progress === 100) {
      return { label: 'Completed', variant: 'default' };
    }
    return { label: 'In Progress', variant: 'outline' };
  };


  const filteredPaths = paths.filter(path => {
    const matchesSearch = path.target_role?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      path.user_id?.toString().includes(searchTerm);
    
    const matchesFilter = filterStatus === 'all' ||
      (filterStatus === 'completed' && path.progress === 100) ||
      (filterStatus === 'in-progress' && path.progress > 0 && path.progress < 100) ||
      (filterStatus === 'not-started' && path.progress === 0);
    
    return matchesSearch && matchesFilter;
  });

  const totalCount = paths.length;
  const completedCount = paths.filter(p => p.progress === 100).length;
  const inProgressCount = paths.filter(p => p.progress > 0 && p.progress < 100).length;
  const notStartedCount = paths.filter(p => p.progress === 0).length;

  const stats = {
    total: totalCount,
    completed: completedCount,
    inProgress: inProgressCount,
    notStarted: notStartedCount,
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">Loading learning paths...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Learning Path Management
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Advanced roadmap configuration and progress tracking
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Path
            </Button>
          </div>
        </div>
      </div>

      {/* Stats - Simplified to 2 cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Paths</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-3xl font-bold text-blue-600">
                  {new Set(paths.map(p => p.user_id)).size}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4 flex-1 w-full">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="Search by role title or user ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 text-lg"
                />
              </div>
              <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
                <SelectTrigger className="w-[180px] h-12">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="not-started">Not Started</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-muted rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="gap-2"
                >
                  <LayoutGrid className="w-4 h-4" />
                  Grid
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="gap-2"
                >
                  <List className="w-4 h-4" />
                  List
                </Button>
              </div>
              <Button onClick={fetchLearningPaths} variant="outline" className="h-12 px-6">
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPaths.map((path) => {
            const status = getStatusBadge(path.progress);
            return (
              <Card key={path.id} className="group border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className={cn("h-2", getStatusColor(path.progress))} />
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <Badge variant={status.variant} className="mb-2">
                        {status.label}
                      </Badge>
                      <h3 className="text-xl font-bold mb-1">
                        {path.target_role?.title || `Role ${path.target_role_id}`}
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <User className="w-4 h-4" />
                        User ID: {path.user_id}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              setSelectedPath(path);
                              fetchPathDetails(path.id);
                            }}
                            className="hover:bg-primary/10"
                          >
                            <Eye className="w-5 h-5" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden p-0">
                          <div className="bg-gradient-to-r from-primary/5 to-purple-500/5 p-6 border-b">
                            <DialogHeader>
                              <DialogTitle className="text-2xl flex items-center gap-3">
                                <Target className="w-8 h-8 text-primary" />
                                {path.target_role?.title || `Role ${path.target_role_id}`}
                              </DialogTitle>
                            </DialogHeader>
                          </div>
                          
                          <ScrollArea className="max-h-[60vh]">
                            <div className="p-6">
                              {detailsLoading ? (
                                <div className="flex items-center justify-center py-12">
                                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                </div>
                              ) : pathDetails ? (
                                <div className="space-y-6">
                                  {/* Simplified stats - removed progress and completed count */}
                                  <div className="grid grid-cols-2 gap-4">
                                    <Card className="bg-blue-50 border-0">
                                      <CardContent className="p-4 text-center">
                                        <p className="text-2xl font-bold text-blue-600">{pathDetails.steps?.length || 0}</p>
                                        <p className="text-xs text-muted-foreground">Total Steps</p>
                                      </CardContent>
                                    </Card>
                                    <Card className="bg-purple-50 border-0">
                                      <CardContent className="p-4 text-center">
                                        <p className="text-2xl font-bold text-purple-600">{pathDetails.total_duration}</p>
                                        <p className="text-xs text-muted-foreground">Duration</p>
                                      </CardContent>
                                    </Card>
                                  </div>

                                  <Separator />

                                  <div>
                                    <div className="flex items-center justify-between mb-4">
                                      <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <BarChart3 className="w-5 h-5" />
                                        Learning Steps
                                      </h3>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        className="gap-2"
                                        onClick={openAddStepDialog}
                                      >
                                        <Plus className="w-4 h-4" />
                                        Add Step
                                      </Button>
                                    </div>

                                    <div className="space-y-3">
                                      {pathDetails.steps?.map((step, index) => (
                                        <Card key={step.id} className="border-l-4 border-l-primary">
                                          <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-primary/10 text-primary">
                                                  {index + 1}
                                                </div>
                                                <div>
                                                  <p className="font-semibold">{step.skill?.name || `Skill ${step.skill_id}`}</p>
                                                  <p className="text-sm text-muted-foreground">
                                                    {step.estimated_duration} • Target: {step.target_level}
                                                  </p>
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => openEditStepDialog(step)}
                                                >
                                                  <Edit3 className="w-4 h-4 mr-1" />
                                                  Edit
                                                </Button>
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => handleDeleteStep(step.id)}
                                                  className="text-destructive hover:bg-destructive/10"
                                                >
                                                  <Trash2 className="w-4 h-4 mr-1" />
                                                  Delete
                                                </Button>
                                              </div>
                                            </div>
                                          </CardContent>
                                        </Card>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-muted-foreground text-center py-8">No details available</p>
                              )}
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeletePath(path.id)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {path.total_duration}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {new Date(path.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* List View */
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold">ID</TableHead>
                  <TableHead className="font-semibold">User</TableHead>
                  <TableHead className="font-semibold">Target Role</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Duration</TableHead>
                  <TableHead className="font-semibold">Created</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPaths.map((path) => {
                  const status = getStatusBadge(path.progress);
                  return (
                    <TableRow key={path.id} className="group">
                      <TableCell className="font-medium">#{path.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <span>User {path.user_id}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-medium">
                          {path.target_role?.title || `Role ${path.target_role_id}`}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant} className="text-xs">
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{path.total_duration}</TableCell>
                      <TableCell>{new Date(path.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden p-0">
                              <div className="bg-gradient-to-r from-primary/5 to-purple-500/5 p-6 border-b">
                                <DialogHeader>
                                  <DialogTitle className="text-2xl flex items-center gap-3">
                                    <Target className="w-8 h-8 text-primary" />
                                    {path.target_role?.title || `Role ${path.target_role_id}`}
                                  </DialogTitle>
                                </DialogHeader>
                              </div>
                              
                              <ScrollArea className="max-h-[60vh]">
                                <div className="p-6">
                                  {detailsLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    </div>
                                  ) : pathDetails ? (
                                    <div className="space-y-6">
                                      {/* Simplified stats - removed progress and completed count */}
                                      <div className="grid grid-cols-2 gap-4">
                                        <Card className="bg-blue-50 border-0">
                                          <CardContent className="p-4 text-center">
                                            <p className="text-2xl font-bold text-blue-600">{pathDetails.steps?.length || 0}</p>
                                            <p className="text-xs text-muted-foreground">Total Steps</p>
                                          </CardContent>
                                        </Card>
                                        <Card className="bg-purple-50 border-0">
                                          <CardContent className="p-4 text-center">
                                            <p className="text-2xl font-bold text-purple-600">{pathDetails.total_duration}</p>
                                            <p className="text-xs text-muted-foreground">Duration</p>
                                          </CardContent>
                                        </Card>
                                      </div>

                                      <Separator />

                                      <div>
                                        <div className="flex items-center justify-between mb-4">
                                          <h3 className="text-lg font-semibold">Learning Steps</h3>
                                          <Button 
                                            variant="outline" 
                                            size="sm"
                                            className="gap-2"
                                            onClick={openAddStepDialog}
                                          >
                                            <Plus className="w-4 h-4" />
                                            Add Step
                                          </Button>
                                        </div>

                                        <div className="space-y-3">
                                          {pathDetails.steps?.map((step, index) => (
                                            <Card key={step.id} className="border-l-4 border-l-primary">
                                              <CardContent className="p-4">
                                                <div className="flex items-center justify-between">
                                                  <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-primary/10 text-primary">
                                                      {index + 1}
                                                    </div>
                                                    <div>
                                                      <p className="font-semibold">{step.skill?.name || `Skill ${step.skill_id}`}</p>
                                                      <p className="text-sm text-muted-foreground">
                                                        {step.estimated_duration} • Target: {step.target_level}
                                                      </p>
                                                    </div>
                                                  </div>
                                                  <div className="flex items-center gap-2">
                                                    <Button
                                                      variant="outline"
                                                      size="sm"
                                                      onClick={() => openEditStepDialog(step)}
                                                    >
                                                      <Edit3 className="w-4 h-4 mr-1" />
                                                      Edit
                                                    </Button>
                                                    <Button
                                                      variant="outline"
                                                      size="sm"
                                                      onClick={() => handleDeleteStep(step.id)}
                                                      className="text-destructive hover:bg-destructive/10"
                                                    >
                                                      <Trash2 className="w-4 h-4 mr-1" />
                                                      Delete
                                                    </Button>
                                                  </div>
                                                </div>
                                              </CardContent>
                                            </Card>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-muted-foreground text-center py-8">No details available</p>
                                  )}
                                </div>
                              </ScrollArea>
                            </DialogContent>
                          </Dialog>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeletePath(path.id)}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {filteredPaths.length === 0 && (
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No learning paths found</h3>
            <p className="text-muted-foreground mb-4">Try adjusting your search or create a new learning path</p>
            <Button onClick={() => setSearchTerm('')} variant="outline">
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit/Add Step Dialog */}
      <Dialog 
        open={isEditStepDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setIsEditStepDialogOpen(false);
            setEditingStep(null);
            setIsAddingNewStep(false);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-2xl flex items-center gap-3">
              <Edit3 className="w-6 h-6 text-primary" />
              {isAddingNewStep ? 'Add New Step' : 'Edit Learning Step'}
            </DialogTitle>
            <p className="text-muted-foreground">
              {isAddingNewStep ? 'Create a new learning step' : (editingStep?.skill?.name || `Skill ${editingStep?.skill_id}`)}
            </p>
          </DialogHeader>
          
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleUpdateStep();
            }}
            className="space-y-6 py-4"
          >
            {/* Skill Name Input - Only for new steps */}
            {isAddingNewStep && (
              <div className="space-y-2">
                <Label htmlFor="skill_name">Skill Name *</Label>
                <Input
                  id="skill_name"
                  type="text"
                  value={stepFormData.skill_name}
                  onChange={(e) => setStepFormData({ ...stepFormData, skill_name: e.target.value })}
                  placeholder="e.g., Python, CSS, Docker, React..."
                  className="w-full"
                  required
                />
                <p className="text-xs text-muted-foreground">Enter the skill name (e.g., Python, CSS, JavaScript)</p>
              </div>
            )}

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
                  setIsAddingNewStep(false);
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit">
                <Save className="w-4 h-4 mr-2" />
                {isAddingNewStep ? 'Add Step' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
