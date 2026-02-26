import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DialogFooter
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
  Edit3, 
  Plus,
  BookOpen,
  Video,
  FileText,
  ExternalLink,
  X,
  Save
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { adminApi } from '@/api/admin.api';

interface LearningResource {
  id: number;
  title: string;
  description: string;
  type: 'article' | 'video' | 'course' | 'tutorial' | 'documentation';
  url: string;
  skill_id: number;
  skill?: {
    id: number;
    name: string;
  };
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  provider: string;
  cost: 'free' | 'paid';
  rating: number;
  created_at: string;
}

const resourceTypeIcons = {
  article: FileText,
  video: Video,
  course: BookOpen,
  tutorial: BookOpen,
  documentation: FileText,
};

export default function AdminLearningResources() {
  const { toast } = useToast();
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResource, setSelectedResource] = useState<LearningResource | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Form state for create/edit
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'article',
    url: '',
    skill_id: '',
    difficulty: 'beginner',
    duration: '',
    provider: '',
    cost: 'free',
    rating: 0,
  });

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getLearningResources();
      setResources(response.resources || []);
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch learning resources',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.createLearningResource({
        ...formData,
        skill_id: parseInt(formData.skill_id) || 0,
      });
      toast({
        title: 'Success',
        description: 'Learning resource created successfully',
      });
      setIsCreateDialogOpen(false);
      resetForm();
      fetchResources();
    } catch (error) {
      console.error('Error creating resource:', error);
      toast({
        title: 'Error',
        description: 'Failed to create learning resource',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResource) return;

    try {
      await adminApi.updateLearningResource(selectedResource.id, {
        ...formData,
        skill_id: parseInt(formData.skill_id) || 0,
      });
      toast({
        title: 'Success',
        description: 'Learning resource updated successfully',
      });
      setIsEditDialogOpen(false);
      setSelectedResource(null);
      resetForm();
      fetchResources();
    } catch (error) {
      console.error('Error updating resource:', error);
      toast({
        title: 'Error',
        description: 'Failed to update learning resource',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteResource = async (resourceId: number) => {
    if (!confirm('Are you sure you want to delete this resource?')) {
      return;
    }

    try {
      await adminApi.deleteLearningResource(resourceId);
      toast({
        title: 'Success',
        description: 'Learning resource deleted successfully',
      });
      fetchResources();
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete learning resource',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (resource: LearningResource) => {
    setSelectedResource(resource);
    setFormData({
      title: resource.title || '',
      description: resource.description || '',
      type: resource.type || 'article',
      url: resource.url || '',
      skill_id: resource.skill_id?.toString() || '',
      difficulty: resource.difficulty || 'beginner',
      duration: resource.duration || '',
      provider: resource.provider || '',
      cost: resource.cost || 'free',
      rating: resource.rating || 0,
    });
    setIsEditDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'article',
      url: '',
      skill_id: '',
      difficulty: 'beginner',
      duration: '',
      provider: '',
      cost: 'free',
      rating: 0,
    });
  };

  const filteredResources = resources.filter(resource => 
    resource.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.skill?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading resources...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Learning Resources Management</h1>
        <p className="text-muted-foreground">
          Manage videos, articles, courses, and assessments for learning paths
        </p>
      </div>

      {/* Search and Actions */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by title, description, or skill..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={fetchResources} variant="outline">
              Refresh
            </Button>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Add Resource
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resources Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Learning Resources ({filteredResources.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Skill</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResources.map((resource) => {
                const Icon = resourceTypeIcons[resource.type] || BookOpen;
                return (
                  <TableRow key={resource.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <Badge variant="outline">{resource.type}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{resource.title}</p>
                        <p className="text-sm text-muted-foreground">{resource.provider}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {resource.skill?.name || `Skill ${resource.skill_id}`}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{resource.difficulty}</Badge>
                    </TableCell>
                    <TableCell>{resource.duration}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={resource.cost === 'free' ? 'bg-green-100 text-green-800 border-green-200' : ''}>
                        {resource.cost}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span>⭐</span>
                        <span>{resource.rating}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(resource.url, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(resource)}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteResource(resource.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredResources.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No learning resources found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog 
        open={isCreateDialogOpen} 
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent 
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
        >

          <DialogHeader>
            <DialogTitle>Create Learning Resource</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleCreateResource} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-title">Title *</Label>
              <Input
                id="create-title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter resource title"
                className="w-full"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-description">Description</Label>
              <Input
                id="create-description"
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter resource description"
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger id="create-type" className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="course">Course</SelectItem>
                    <SelectItem value="tutorial">Tutorial</SelectItem>
                    <SelectItem value="documentation">Documentation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-difficulty">Difficulty</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
                >
                  <SelectTrigger id="create-difficulty" className="w-full">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-url">URL *</Label>
              <Input
                id="create-url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://example.com/resource"
                className="w-full"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-skill_id">Skill ID *</Label>
                <Input
                  id="create-skill_id"
                  type="number"
                  value={formData.skill_id}
                  onChange={(e) => setFormData({ ...formData, skill_id: e.target.value })}
                  placeholder="Enter skill ID"
                  className="w-full"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-duration">Duration</Label>
                <Input
                  id="create-duration"
                  type="text"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="e.g., 2 hours, 4 weeks"
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-provider">Provider</Label>
                <Input
                  id="create-provider"
                  type="text"
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  placeholder="e.g., Udemy, Coursera"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-cost">Cost</Label>
                <Select
                  value={formData.cost}
                  onValueChange={(value) => setFormData({ ...formData, cost: value })}
                >
                  <SelectTrigger id="create-cost" className="w-full">
                    <SelectValue placeholder="Select cost" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-rating">Rating (0-5)</Label>
              <Input
                id="create-rating"
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) || 0 })}
                className="w-full"
              />
            </div>

            <DialogFooter className="gap-2 pt-4">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  resetForm();
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit">
                <Save className="w-4 h-4 mr-2" />
                Create Resource
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog 
        open={isEditDialogOpen} 
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setSelectedResource(null);
            resetForm();
          }
        }}
      >
        <DialogContent 
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
        >

          <DialogHeader>
            <DialogTitle>Edit Learning Resource</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleUpdateResource} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter resource title"
                className="w-full"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter resource description"
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger id="edit-type" className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="course">Course</SelectItem>
                    <SelectItem value="tutorial">Tutorial</SelectItem>
                    <SelectItem value="documentation">Documentation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-difficulty">Difficulty</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
                >
                  <SelectTrigger id="edit-difficulty" className="w-full">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-url">URL *</Label>
              <Input
                id="edit-url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://example.com/resource"
                className="w-full"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-skill_id">Skill ID *</Label>
                <Input
                  id="edit-skill_id"
                  type="number"
                  value={formData.skill_id}
                  onChange={(e) => setFormData({ ...formData, skill_id: e.target.value })}
                  placeholder="Enter skill ID"
                  className="w-full"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-duration">Duration</Label>
                <Input
                  id="edit-duration"
                  type="text"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="e.g., 2 hours, 4 weeks"
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-provider">Provider</Label>
                <Input
                  id="edit-provider"
                  type="text"
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  placeholder="e.g., Udemy, Coursera"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-cost">Cost</Label>
                <Select
                  value={formData.cost}
                  onValueChange={(value) => setFormData({ ...formData, cost: value })}
                >
                  <SelectTrigger id="edit-cost" className="w-full">
                    <SelectValue placeholder="Select cost" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-rating">Rating (0-5)</Label>
              <Input
                id="edit-rating"
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) || 0 })}
                className="w-full"
              />
            </div>

            <DialogFooter className="gap-2 pt-4">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedResource(null);
                  resetForm();
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit">
                <Save className="w-4 h-4 mr-2" />
                Update Resource
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
