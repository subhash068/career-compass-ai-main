import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Save } from 'lucide-react';
import axiosClient from '@/api/axiosClient';

interface CareerRecommendation {
  id?: number;
  title: string;
  description: string;
  industry: string;
  match_score: number;
}

interface CareerRecommendationEditorProps {
  userId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const CareerRecommendationEditor = ({ userId, isOpen, onClose, onSave }: CareerRecommendationEditorProps) => {
  const [recommendations, setRecommendations] = useState<CareerRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId && isOpen) {
      fetchCurrentRecommendations();
    }
  }, [userId, isOpen]);

  const fetchCurrentRecommendations = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const response = await axiosClient.get(`/admin/users/${userId}`);
      setRecommendations(response.data.careerRecommendations || []);
      setError(null);
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  };

  const addNewRecommendation = () => {
    setRecommendations([...recommendations, {
      title: '',
      description: '',
      industry: '',
      match_score: 0
    }]);
  };

  const updateRecommendation = (index: number, field: keyof CareerRecommendation, value: string | number) => {
    const updated = [...recommendations];
    updated[index] = { ...updated[index], [field]: value };
    setRecommendations(updated);
  };

  const removeRecommendation = (index: number) => {
    setRecommendations(recommendations.filter((_, i) => i !== index));
  };

  const saveRecommendations = async () => {
    if (!userId) return;

    try {
      setSaving(true);
      await axiosClient.put(`/admin/users/${userId}/career-recommendations`, {
        recommendations: recommendations
      });
      onSave();
      onClose();
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to save recommendations');
    } finally {
      setSaving(false);
    }
  };

  const industries = [
    'Technology',
    'Healthcare',
    'Finance',
    'Education',
    'Manufacturing',
    'Retail',
    'Consulting',
    'Marketing',
    'Engineering',
    'Other'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Career Recommendations</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-20 w-full" />
                      <div className="flex gap-4">
                        <Skeleton className="h-10 w-32" />
                        <Skeleton className="h-10 w-24" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Career Recommendations</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage career recommendations for this user
                  </p>
                </div>
                <Button onClick={addNewRecommendation}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Recommendation
                </Button>
              </div>

              <div className="space-y-4">
                {recommendations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No career recommendations. Click "Add Recommendation" to create one.
                  </div>
                ) : (
                  recommendations.map((rec, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">
                            Recommendation #{index + 1}
                          </CardTitle>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeRecommendation(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`title-${index}`}>Job Title</Label>
                            <Input
                              id={`title-${index}`}
                              value={rec.title}
                              onChange={(e) => updateRecommendation(index, 'title', e.target.value)}
                              placeholder="e.g. Software Engineer"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`industry-${index}`}>Industry</Label>
                            <Select
                              value={rec.industry}
                              onValueChange={(value) => updateRecommendation(index, 'industry', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select industry" />
                              </SelectTrigger>
                              <SelectContent>
                                {industries.map((industry) => (
                                  <SelectItem key={industry} value={industry}>
                                    {industry}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`description-${index}`}>Description</Label>
                          <Textarea
                            id={`description-${index}`}
                            value={rec.description}
                            onChange={(e) => updateRecommendation(index, 'description', e.target.value)}
                            placeholder="Describe the role and why it matches the user's profile..."
                            rows={3}
                          />
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="space-y-2 flex-1">
                            <Label htmlFor={`score-${index}`}>Match Score (%)</Label>
                            <Input
                              id={`score-${index}`}
                              type="number"
                              min="0"
                              max="100"
                              value={rec.match_score}
                              onChange={(e) => updateRecommendation(index, 'match_score', parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div className="flex items-end">
                            <Badge variant="outline" className="px-3 py-1">
                              {rec.match_score}% Match
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={saveRecommendations} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CareerRecommendationEditor;
