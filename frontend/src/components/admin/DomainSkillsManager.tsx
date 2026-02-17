import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  ChevronDown, 
  ChevronRight, 
  FolderTree, 
  Code2, 
  Server, 
  Layout, 
  Brain, 
  Cloud, 
  Users,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { domainsApi, Domain, Skill } from '@/api/domains.api';

const domainIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'Frontend': Code2,
  'Backend': Server,
  'Full Stack': Layout,
  'AI / ML': Brain,
  'DevOps': Cloud,
  'QA Engineer': Users,
  'default': FolderTree,
};

export default function DomainSkillsManager() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDomains, setExpandedDomains] = useState<Set<number>>(new Set());
  const [isDomainDialogOpen, setIsDomainDialogOpen] = useState(false);
  const [isSkillDialogOpen, setIsSkillDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ type: 'domain' | 'skill'; item: Domain | Skill } | null>(null);
  const [selectedDomainForSkill, setSelectedDomainForSkill] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [domainName, setDomainName] = useState('');
  const [skillName, setSkillName] = useState('');
  const [skillDescription, setSkillDescription] = useState('');
  const [skillDemandLevel, setSkillDemandLevel] = useState(0);

  const { toast } = useToast();

  useEffect(() => {
    loadDomains();
  }, []);

  const loadDomains = async () => {
    try {
      setLoading(true);
      const response = await domainsApi.getAllDomains(true);
      setDomains(response.domains);
    } catch (error) {
      console.error('Error loading domains:', error);
      toast({
        title: "Error",
        description: "Failed to load domains and skills",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleDomainExpansion = (domainId: number) => {
    setExpandedDomains(prev => {
      const newSet = new Set(prev);
      if (newSet.has(domainId)) {
        newSet.delete(domainId);
      } else {
        newSet.add(domainId);
      }
      return newSet;
    });
  };

  // Domain CRUD operations
  const openCreateDomainDialog = () => {
    setEditingDomain(null);
    setDomainName('');
    setIsDomainDialogOpen(true);
  };

  const openEditDomainDialog = (domain: Domain) => {
    setEditingDomain(domain);
    setDomainName(domain.name);
    setIsDomainDialogOpen(true);
  };

  const handleSaveDomain = async () => {
    if (!domainName.trim()) {
      toast({
        title: "Validation Error",
        description: "Domain name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingDomain) {
        await domainsApi.updateDomain(editingDomain.id, { name: domainName });
        toast({
          title: "Success",
          description: "Domain updated successfully",
        });
      } else {
        await domainsApi.createDomain({ name: domainName });
        toast({
          title: "Success",
          description: "Domain created successfully",
        });
      }
      setIsDomainDialogOpen(false);
      loadDomains();
    } catch (error: any) {
      console.error('Error saving domain:', error);
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to save domain",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Skill CRUD operations
  const openCreateSkillDialog = (domainId: number) => {
    setEditingSkill(null);
    setSelectedDomainForSkill(domainId);
    setSkillName('');
    setSkillDescription('');
    setSkillDemandLevel(0);
    setIsSkillDialogOpen(true);
  };

  const openEditSkillDialog = (skill: Skill) => {
    setEditingSkill(skill);
    setSelectedDomainForSkill(skill.domain_id);
    setSkillName(skill.name);
    setSkillDescription(skill.description || '');
    setSkillDemandLevel(skill.demand_level || 0);
    setIsSkillDialogOpen(true);
  };

  const handleSaveSkill = async () => {
    if (!skillName.trim()) {
      toast({
        title: "Validation Error",
        description: "Skill name is required",
        variant: "destructive",
      });
      return;
    }

    // Only require domain selection when creating a new skill
    if (!editingSkill && !selectedDomainForSkill) {
      toast({
        title: "Validation Error",
        description: "Domain is required",
        variant: "destructive",
      });
      return;
    }


    try {
      setIsSubmitting(true);
      if (editingSkill) {
        await domainsApi.updateSkill(editingSkill.id, {
          name: skillName,
          description: skillDescription,
          domain_id: selectedDomainForSkill,
          demand_level: skillDemandLevel,
        });
        toast({
          title: "Success",
          description: "Skill updated successfully",
        });
      } else {
        await domainsApi.createSkill({
          name: skillName,
          description: skillDescription,
          domain_id: selectedDomainForSkill,
          demand_level: skillDemandLevel,
        });
        toast({
          title: "Success",
          description: "Skill created successfully",
        });
      }
      setIsSkillDialogOpen(false);
      loadDomains();
    } catch (error: any) {
      console.error('Error saving skill:', error);
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to save skill",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete operations
  const openDeleteDialog = (type: 'domain' | 'skill', item: Domain | Skill) => {
    setDeletingItem({ type, item });
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingItem) return;

    try {
      setIsSubmitting(true);
      if (deletingItem.type === 'domain') {
        await domainsApi.deleteDomain(deletingItem.item.id);
        toast({
          title: "Success",
          description: "Domain and its skills deleted successfully",
        });
      } else {
        await domainsApi.deleteSkill(deletingItem.item.id);
        toast({
          title: "Success",
          description: "Skill deleted successfully",
        });
      }
      setIsDeleteDialogOpen(false);
      loadDomains();
    } catch (error: any) {
      console.error('Error deleting:', error);
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to delete",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDomainIcon = (domainName: string) => {
    const IconComponent = domainIcons[domainName] || domainIcons['default'];
    return <IconComponent className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Domain & Skills Management</h2>
          <p className="text-muted-foreground">
            Manage career domains and their associated skills dynamically
          </p>
        </div>
        <Button onClick={openCreateDomainDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Add Domain
        </Button>
      </div>

      {/* Domains List */}
      <div className="space-y-4">
        {domains.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FolderTree className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Domains Found</h3>
              <p className="text-muted-foreground mb-4">
                Get started by creating your first domain
              </p>
              <Button onClick={openCreateDomainDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Create Domain
              </Button>
            </CardContent>
          </Card>
        ) : (
          domains.map((domain) => {
            const isExpanded = expandedDomains.has(domain.id);
            const skillsCount = domain.skills?.length || 0;

            return (
              <Card key={domain.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        {getDomainIcon(domain.name)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{domain.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {skillsCount} {skillsCount === 1 ? 'Skill' : 'Skills'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openCreateSkillDialog(domain.id)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Skill
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDomainDialog(domain)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog('domain', domain)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleDomainExpansion(domain.id)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && domain.skills && domain.skills.length > 0 && (
                  <CardContent className="pt-0">
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">
                        Skills in this domain
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {domain.skills.map((skill) => (
                          <Card key={skill.id} className="bg-muted/50">
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">
                                    {skill.name}
                                  </p>
                                  {skill.description && (
                                    <p className="text-xs text-muted-foreground truncate">
                                      {skill.description}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 ml-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => openEditSkillDialog(skill)}
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => openDeleteDialog('skill', skill)}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                )}

                {isExpanded && (!domain.skills || domain.skills.length === 0) && (
                  <CardContent className="pt-0">
                    <div className="border-t pt-4">
                      <div className="text-center py-4 text-muted-foreground">
                        <p className="text-sm">No skills in this domain yet</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => openCreateSkillDialog(domain.id)}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add First Skill
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Domain Dialog */}
      <Dialog open={isDomainDialogOpen} onOpenChange={setIsDomainDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDomain ? 'Edit Domain' : 'Create New Domain'}
            </DialogTitle>
            <DialogDescription>
              {editingDomain 
                ? 'Update the domain name below.' 
                : 'Enter a name for the new career domain.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="domainName">Domain Name</Label>
              <Input
                id="domainName"
                value={domainName}
                onChange={(e) => setDomainName(e.target.value)}
                placeholder="e.g., Frontend, Backend, DevOps"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDomainDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveDomain} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingDomain ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Skill Dialog */}
      <Dialog open={isSkillDialogOpen} onOpenChange={setIsSkillDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSkill ? 'Edit Skill' : 'Create New Skill'}
            </DialogTitle>
            <DialogDescription>
              {editingSkill
                ? 'Update the skill details below.'
                : 'Enter details for the new skill.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="skillName">Skill Name</Label>
              <Input
                id="skillName"
                value={skillName}
                onChange={(e) => setSkillName(e.target.value)}
                placeholder="e.g., React, Python, Docker"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skillDescription">Description (Optional)</Label>
              <Textarea
                id="skillDescription"
                value={skillDescription}
                onChange={(e) => setSkillDescription(e.target.value)}
                placeholder="Brief description of this skill"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="demandLevel">Demand Level (0-100)</Label>
              <Input
                id="demandLevel"
                type="number"
                min={0}
                max={100}
                value={skillDemandLevel}
                onChange={(e) => setSkillDemandLevel(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSkillDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveSkill} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingSkill ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              {deletingItem?.type === 'domain' ? (
                <>
                  Are you sure you want to delete the domain <strong>{deletingItem?.item.name}</strong>?
                  <br /><br />
                  <span className="text-destructive font-medium">
                    Warning: This will also delete all skills associated with this domain.
                  </span>
                </>
              ) : (
                <>
                  Are you sure you want to delete the skill <strong>{deletingItem?.item.name}</strong>?
                  <br /><br />
                  This action cannot be undone.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
