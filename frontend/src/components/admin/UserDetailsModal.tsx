import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { User, Mail, Calendar, Award, Target, BookOpen, Edit } from 'lucide-react';
import axiosClient from '@/api/axiosClient';

interface UserDetails {
  id: number;
  email: string;
  name: string;
  role: string;
  currentRole: string;
  created_at: string;
  updated_at: string;
  skills?: any[];
  assessments?: any[];
  careerRecommendations?: any[];
  learningPath?: any;
}

interface UserDetailsModalProps {
  userId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onEditCareer: (userId: number) => void;
}

const UserDetailsModal = ({ userId, isOpen, onClose, onEditCareer }: UserDetailsModalProps) => {
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId && isOpen) {
      fetchUserDetails();
    }
  }, [userId, isOpen]);

  const fetchUserDetails = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const response = await axiosClient.get(`/admin/users/${userId}`);
      setUserDetails(response.data);
      setError(null);
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to fetch user details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getSkillLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'expert':
        return 'bg-green-500';
      case 'advanced':
        return 'bg-blue-500';
      case 'intermediate':
        return 'bg-yellow-500';
      case 'beginner':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };

  const renderProfileTab = () => {
    if (!userDetails) return null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{userDetails.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{userDetails.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={userDetails.role === 'ADMIN' ? 'destructive' : 'default'}>
                  {userDetails.role}
                </Badge>
              </div>
              {userDetails.currentRole && (
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span>Current Role: {userDetails.currentRole}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Account Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Joined</div>
                <div className="font-medium">{formatDate(userDetails.created_at)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Last Updated</div>
                <div className="font-medium">{formatDate(userDetails.updated_at)}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderSkillsTab = () => {
    if (!userDetails?.skills) return null;

    return (
      <div className="space-y-4">
        {userDetails.skills.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No skills assessed yet
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userDetails.skills.map((skill, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{skill.name}</span>
                    <Badge variant="outline">{skill.level}</Badge>
                  </div>
                  <Progress value={skill.confidence} className="mb-2" />
                  <div className="text-sm text-muted-foreground">
                    Confidence: {skill.confidence}%
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderAssessmentsTab = () => {
    if (!userDetails?.assessments) return null;

    return (
      <div className="space-y-4">
        {userDetails.assessments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No assessments completed
          </div>
        ) : (
          <div className="space-y-4">
            {userDetails.assessments.map((assessment, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Assessment #{assessment.id}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Status</div>
                      <Badge variant={assessment.status === 'completed' ? 'default' : 'secondary'}>
                        {assessment.status}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Completed</div>
                      <div>{formatDate(assessment.completed_at)}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Skills Assessed</div>
                    <div className="flex flex-wrap gap-2">
                      {assessment.skills?.map((skill, skillIndex) => (
                        <Badge key={skillIndex} variant="outline">
                          {skill.skill_name} ({skill.level})
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderCareerTab = () => {
    if (!userDetails?.careerRecommendations) return null;

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Career Recommendations</h3>
          <Button onClick={() => onEditCareer(userDetails.id)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Recommendations
          </Button>
        </div>

        {userDetails.careerRecommendations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No career recommendations yet
          </div>
        ) : (
          <div className="space-y-4">
            {userDetails.careerRecommendations.map((rec, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{rec.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{rec.description}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Industry</div>
                      <div>{rec.industry}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Match Score</div>
                      <div>{rec.match_score}%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderLearningTab = () => {
    if (!userDetails?.learningPath) return null;

    const path = userDetails.learningPath;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Learning Path
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-sm text-muted-foreground">Target Role</div>
                <div className="font-medium">{path.target_role_title}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Progress</div>
                <div className="flex items-center gap-2">
                  <Progress value={path.progress} className="flex-1" />
                  <span className="text-sm">{path.progress}%</span>
                </div>
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-2">Duration</div>
              <div>{path.total_duration}</div>
            </div>
          </CardContent>
        </Card>

        <div>
          <h4 className="font-semibold mb-4">Learning Steps</h4>
          <div className="space-y-3">
            {path.steps?.map((step, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step.is_completed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium">{step.title}</h5>
                      <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={step.is_completed ? 'default' : 'secondary'}>
                          {step.is_completed ? 'Completed' : 'Pending'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Duration: {step.duration}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : userDetails ? (
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
              <TabsTrigger value="assessments">Assessments</TabsTrigger>
              <TabsTrigger value="career">Career</TabsTrigger>
              <TabsTrigger value="learning">Learning</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-6">
              {renderProfileTab()}
            </TabsContent>

            <TabsContent value="skills" className="mt-6">
              {renderSkillsTab()}
            </TabsContent>

            <TabsContent value="assessments" className="mt-6">
              {renderAssessmentsTab()}
            </TabsContent>

            <TabsContent value="career" className="mt-6">
              {renderCareerTab()}
            </TabsContent>

            <TabsContent value="learning" className="mt-6">
              {renderLearningTab()}
            </TabsContent>
          </Tabs>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailsModal;
