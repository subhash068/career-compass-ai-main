import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  LayoutDashboard, 
  Users, 
  HelpCircle, 
  Activity, 
  FileText, 
  TrendingUp,
  Shield,
  LogOut,
  Menu,
  X,
  FolderTree
} from 'lucide-react';

import { cn } from '@/lib/utils';
import axiosClient from '@/api/axiosClient';

// Import admin components
import UserManagementTable from '@/components/admin/UserManagementTable';
import UserDetailsModal from '@/components/admin/UserDetailsModal';
import CareerRecommendationEditor from '@/components/admin/CareerRecommendationEditor';
import QuizManager from '@/components/admin/QuizManager';
import SystemMonitor from '@/components/admin/SystemMonitor';
import LogViewer from '@/components/admin/LogViewer';
import CareerAnalytics from '@/components/admin/CareerAnalytics';
import UserForm from '@/components/admin/UserForm';
import DomainSkillsManager from '@/components/admin/DomainSkillsManager';


interface SystemStats {
  total_users: number;
  active_users: number;
  total_assessments: number;
  total_career_recommendations: number;
  total_chatbot_queries: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user: contextUser, logout } = useAuth();
  

  
  // Check localStorage as fallback for immediate access after login
  let user = contextUser;
  if (!user) {
    const userStr = localStorage.getItem('user');
    if (userStr && userStr !== 'undefined') {
      try {
        user = JSON.parse(userStr);
        console.log('AdminDashboard: Using user from localStorage:', user);
      } catch (e) {
        console.error('AdminDashboard: Error parsing user from localStorage:', e);
      }
    }
  }

  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Fetch system stats

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const response = await axiosClient.get('/admin/overview-metrics');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleViewUser = (userId: number) => {
    setSelectedUserId(userId);
    setIsEditMode(false);
    setIsUserModalOpen(true);
  };

  const handleEditUser = (userId: number) => {
    setSelectedUserId(userId);
    setIsEditMode(true);
    setIsUserFormOpen(true);
  };

  const handleCreateUser = () => {
    setSelectedUserId(null);
    setIsEditMode(false);
    setIsUserFormOpen(true);
  };

  const handleCloseUserModal = () => {
    setIsUserModalOpen(false);
    setSelectedUserId(null);
  };

  const handleCloseUserForm = () => {
    setIsUserFormOpen(false);
    setSelectedUserId(null);
    setIsEditMode(false);
  };

  const handleUserFormSuccess = () => {
    // Refresh user list if needed
    handleCloseUserForm();
  };


  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'domains', label: 'Domain & Skills', icon: FolderTree },
    { id: 'quiz', label: 'Quiz Management', icon: HelpCircle },
    { id: 'monitoring', label: 'System Monitor', icon: Activity },
    { id: 'logs', label: 'Logs & Errors', icon: FileText },
    { id: 'analytics', label: 'Career Analytics', icon: TrendingUp },
  ];


  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Sidebar Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-2 left-0 z-50 bg-lime-300 lg:hidden border-y-sidebar-border"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="h-10 w-10 border-gray-950" /> : <Menu className="h-20 w-20" />}
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-8 inset-y-0 left-0 z-40 w-64 bg-card border-r transform transition-transform duration-200 lg:translate-x-0 lg:static",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 my-7">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Admin Panel</h1>
              <p className="text-xs text-muted-foreground">Career Compass AI</p>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    activeTab === item.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="absolute bottom-6 left-6 right-6">
            <div className="p-4 rounded-lg bg-muted mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full bg-red-500 text-white hover:bg-rose-400 hover:text-black"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold">
                {navItems.find(item => item.id === activeTab)?.label}
              </h2>
              <p className="text-muted-foreground">
                Manage your platform and monitor performance
              </p>
            </div>
            <Badge variant="outline" className="px-3 py-1">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
              System Online
            </Badge>
          </div>

          {/* Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statsLoading ? (
                  <>
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                  </>
                ) : (
                  <>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Total Users
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{stats?.total_users || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {stats?.active_users || 0} active users
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Assessments
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{stats?.total_assessments || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Total completed
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Career Recommendations
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">
                          {stats?.total_career_recommendations || 0}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Generated by AI
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Chatbot Queries
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">
                          {stats?.total_chatbot_queries || 0}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Total interactions
                        </p>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setActiveTab('users')}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Manage Users
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setActiveTab('quiz')}
                    >
                      <HelpCircle className="h-4 w-4 mr-2" />
                      Manage Quiz Questions
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setActiveTab('monitoring')}
                    >
                      <Activity className="h-4 w-4 mr-2" />
                      View System Status
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setActiveTab('logs')}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Check Logs
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>System Health</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Database</span>
                        <Badge variant="default" className="bg-green-500">Connected</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">API Services</span>
                        <Badge variant="default" className="bg-green-500">Running</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">AI/LLM Service</span>
                        <Badge variant="default" className="bg-green-500">Available</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Vector Store</span>
                        <Badge variant="outline">Not Configured</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users">
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button onClick={handleCreateUser}>
                    <Users className="h-4 w-4 mr-2" />
                    Create New User
                  </Button>
                </div>
                <UserManagementTable 
                  onViewUser={handleViewUser}
                  onEditUser={handleEditUser}
                />
              </div>
            </TabsContent>

            {/* Domain & Skills Tab */}
            <TabsContent value="domains">
              <DomainSkillsManager />
            </TabsContent>

            {/* Quiz Tab */}

            <TabsContent value="quiz">
              <QuizManager />
            </TabsContent>

            {/* Monitoring Tab */}
            <TabsContent value="monitoring">
              <SystemMonitor />
            </TabsContent>

            {/* Logs Tab */}
            <TabsContent value="logs">
              <LogViewer />
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics">
              <CareerAnalytics />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* User Details Modal */}
      {selectedUserId && (
        <UserDetailsModal
          userId={selectedUserId}
          isOpen={isUserModalOpen}
          onClose={handleCloseUserModal}
          onEditCareer={(userId) => {
            // Handle career edit
            console.log('Edit career for user:', userId);
          }}
        />
      )}


      {/* User Form Modal (Create/Edit) */}
      <UserForm
        userId={selectedUserId}
        isOpen={isUserFormOpen}
        onClose={handleCloseUserForm}
        onSuccess={handleUserFormSuccess}
        isEditMode={isEditMode}
      />
    </div>

  );
}
