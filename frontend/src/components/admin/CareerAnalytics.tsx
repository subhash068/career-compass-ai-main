import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  Users, 
  Target, 
  Award, 
  Search,
  Download,
  RefreshCw,
  Eye,
  GraduationCap,
  Briefcase
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axiosClient from '@/api/axiosClient';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface UserAssessment {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  skill_name: string;
  score: number;
  status: string;
  completed_at: string;
}

interface CareerStats {
  total_assessments: number;
  completed_assessments: number;
  average_score: number;
  top_skills: Array<{ name: string; count: number }>;
  career_paths: Array<{ name: string; count: number }>;
  recent_assessments: UserAssessment[];
}

export default function CareerAnalytics() {
  const { toast } = useToast();
  const [stats, setStats] = useState<CareerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAssessment, setSelectedAssessment] = useState<UserAssessment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchCareerStats();
  }, []);

  const fetchCareerStats = async () => {
    try {
      setLoading(true);
      // Fetch assessments from the admin API
      const response = await axiosClient.get('/admin/assessments?limit=1000');
      
      // Process the data to create stats
      const assessments = response.data.assessments || [];
      
      // Calculate stats
      const completed = assessments.filter((a: any) => a.status === 'completed');
      const avgScore = completed.length > 0 
        ? completed.reduce((sum: number, a: any) => sum + (a.score || 0), 0) / completed.length 
        : 0;

      // Get skill counts
      const skillCounts: Record<string, number> = {};
      assessments.forEach((a: any) => {
        const skillName = a.skill_name || 'Unknown';
        skillCounts[skillName] = (skillCounts[skillName] || 0) + 1;
      });

      // Get recent assessments
      const recent = assessments
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);

      setStats({
        total_assessments: assessments.length,
        completed_assessments: completed.length,
        average_score: Math.round(avgScore),
        top_skills: Object.entries(skillCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
        career_paths: [], // Would need career data
        recent_assessments: recent
      });
    } catch (error) {
      console.error('Error fetching career stats:', error);
      toast({
        title: "Error",
        description: "Failed to fetch career analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    if (!stats) return;
    
    const csvContent = [
      ['User ID', 'User Name', 'Email', 'Skill', 'Score', 'Status', 'Completed At'].join(','),
      ...stats.recent_assessments.map(a => [
        a.user_id,
        `"${a.user_name}"`,
        a.user_email,
        `"${a.skill_name}"`,
        a.score,
        a.status,
        a.completed_at
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `career_analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    toast({
      title: "Success",
      description: "Analytics data exported",
    });
  };

  const filteredAssessments = stats?.recent_assessments.filter(assessment => {
    const matchesSearch = 
      assessment.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assessment.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assessment.skill_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || assessment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchCareerStats}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Total Assessments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.total_assessments || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All time assessments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.completed_assessments || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Successfully completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Average Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.average_score || 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all assessments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {new Set(stats?.recent_assessments.map(a => a.user_id)).size || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Users with assessments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Skills Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Top Skills Assessed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.top_skills || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Assessment Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Assessment Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Completed', value: stats?.completed_assessments || 0 },
                      { name: 'Pending', value: (stats?.total_assessments || 0) - (stats?.completed_assessments || 0) }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats && [
                      <Cell key="completed" fill="#00C49F" />,
                      <Cell key="pending" fill="#FFBB28" />
                    ]}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Assessments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Recent Assessments</span>
            <Badge variant="outline">{filteredAssessments.length} results</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user, email, or skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="space-y-2">
            {filteredAssessments.length === 0 ? (
              <Alert>
                <AlertDescription>No assessments found</AlertDescription>
              </Alert>
            ) : (
              filteredAssessments.map((assessment) => (
                <div
                  key={assessment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{assessment.user_name}</p>
                      <span className="text-muted-foreground">•</span>
                      <p className="text-sm text-muted-foreground">{assessment.user_email}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline">{assessment.skill_name}</Badge>
                      <Badge 
                        variant={assessment.status === 'completed' ? 'default' : 'outline'}
                        className={assessment.status === 'completed' ? 'bg-green-500' : ''}
                      >
                        {assessment.status}
                      </Badge>
                      {assessment.score > 0 && (
                        <span className="text-muted-foreground">
                          Score: {assessment.score}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      {new Date(assessment.completed_at).toLocaleDateString()}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedAssessment(assessment);
                        setIsModalOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Assessment Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assessment Details</DialogTitle>
          </DialogHeader>
          {selectedAssessment && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">User</p>
                  <p className="font-medium">{selectedAssessment.user_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedAssessment.user_email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Skill</p>
                  <p className="font-medium">{selectedAssessment.skill_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge 
                    variant={selectedAssessment.status === 'completed' ? 'default' : 'outline'}
                    className={selectedAssessment.status === 'completed' ? 'bg-green-500' : ''}
                  >
                    {selectedAssessment.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Score</p>
                  <p className="font-medium">{selectedAssessment.score}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="font-medium">
                    {new Date(selectedAssessment.completed_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
