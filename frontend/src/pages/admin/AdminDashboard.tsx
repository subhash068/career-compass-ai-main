import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Award, Target, MessageSquare, Activity } from 'lucide-react';
import axiosClient from '@/api/axiosClient';
import UserManagementTable from '@/components/admin/UserManagementTable';
import UserDetailsModal from '@/components/admin/UserDetailsModal';
import CareerRecommendationEditor from '@/components/admin/CareerRecommendationEditor';

interface HealthData {
  status: string;
  timestamp: number;
  version: string;
}

interface MetricsData {
  system: {
    cpu_percent: number;
    memory_percent: number;
    disk_usage_percent: number;
    uptime_seconds: number;
  };
  timestamp: number;
}

interface OverviewMetrics {
  total_users: number;
  active_users: number;
  total_assessments: number;
  total_career_recommendations: number;
  total_chatbot_queries: number;
}

export default function AdminDashboard() {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [metricsData, setMetricsData] = useState<MetricsData | null>(null);
  const [overviewMetrics, setOverviewMetrics] = useState<OverviewMetrics | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  // Modal states
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showCareerEditor, setShowCareerEditor] = useState(false);

  useEffect(() => {
    fetchHealth();
    fetchMetrics();
    fetchOverviewMetrics();
  }, []);

  const fetchHealth = async () => {
    try {
      setHealthLoading(true);
      const response = await axiosClient.get('/admin/health');
      setHealthData(response.data);
      setHealthError(null);
    } catch (error: any) {
      setHealthError(error.response?.data?.detail || 'Failed to fetch health data');
    } finally {
      setHealthLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      setMetricsLoading(true);
      const response = await axiosClient.get('/admin/metrics');
      setMetricsData(response.data);
      setMetricsError(null);
    } catch (error: any) {
      setMetricsError(error.response?.data?.detail || 'Failed to fetch metrics data');
    } finally {
      setMetricsLoading(false);
    }
  };

  const fetchOverviewMetrics = async () => {
    try {
      setOverviewLoading(true);
      const response = await axiosClient.get('/admin/overview-metrics');
      setOverviewMetrics(response.data);
      setOverviewError(null);
    } catch (error: any) {
      setOverviewError(error.response?.data?.detail || 'Failed to fetch overview metrics');
    } finally {
      setOverviewLoading(false);
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Monitor system health and metrics</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          ADMIN
        </Badge>
      </div>

      {/* System Health Section */}
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
        </CardHeader>
        <CardContent>
          {healthLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
          ) : healthError ? (
            <Alert variant="destructive">
              <AlertDescription>{healthError}</AlertDescription>
            </Alert>
          ) : healthData ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">Status:</span>
                <Badge variant={healthData.status === 'healthy' ? 'default' : 'destructive'}>
                  {healthData.status}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Version:</span> {healthData.version}
              </div>
              <div>
                <span className="font-medium">Last Check:</span>{' '}
                {new Date(healthData.timestamp * 1000).toLocaleString()}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Overview Metrics Section */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {overviewLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          ) : overviewError ? (
            <Alert variant="destructive">
              <AlertDescription>{overviewError}</AlertDescription>
            </Alert>
          ) : overviewMetrics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div className="text-sm font-medium text-muted-foreground">Total Users</div>
                </div>
                <div className="text-2xl font-bold">{overviewMetrics.total_users}</div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <div className="text-sm font-medium text-muted-foreground">Active Users</div>
                </div>
                <div className="text-2xl font-bold">{overviewMetrics.active_users}</div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <div className="text-sm font-medium text-muted-foreground">Assessments</div>
                </div>
                <div className="text-2xl font-bold">{overviewMetrics.total_assessments}</div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <div className="text-sm font-medium text-muted-foreground">Career Recs</div>
                </div>
                <div className="text-2xl font-bold">{overviewMetrics.total_career_recommendations}</div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <div className="text-sm font-medium text-muted-foreground">Chat Queries</div>
                </div>
                <div className="text-2xl font-bold">{overviewMetrics.total_chatbot_queries}</div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* System Metrics Section */}
      <Card>
        <CardHeader>
          <CardTitle>System Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          {metricsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          ) : metricsError ? (
            <Alert variant="destructive">
              <AlertDescription>{metricsError}</AlertDescription>
            </Alert>
          ) : metricsData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">CPU Usage</div>
                <div className="text-2xl font-bold">{metricsData.system.cpu_percent.toFixed(1)}%</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Memory Usage</div>
                <div className="text-2xl font-bold">{metricsData.system.memory_percent.toFixed(1)}%</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Disk Usage</div>
                <div className="text-2xl font-bold">{metricsData.system.disk_usage_percent.toFixed(1)}%</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Uptime</div>
                <div className="text-2xl font-bold">{formatUptime(metricsData.system.uptime_seconds)}</div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* User Management Section */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="mt-6">
          <UserManagementTable
            onViewUser={(userId) => {
              setSelectedUserId(userId);
              setShowUserDetails(true);
            }}
            onEditUser={(userId) => {
              setSelectedUserId(userId);
              setShowCareerEditor(true);
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <UserDetailsModal
        userId={selectedUserId}
        isOpen={showUserDetails}
        onClose={() => {
          setShowUserDetails(false);
          setSelectedUserId(null);
        }}
        onEditCareer={(userId) => {
          setShowUserDetails(false);
          setSelectedUserId(userId);
          setShowCareerEditor(true);
        }}
      />

      <CareerRecommendationEditor
        userId={selectedUserId}
        isOpen={showCareerEditor}
        onClose={() => {
          setShowCareerEditor(false);
          setSelectedUserId(null);
        }}
        onSave={() => {
          // Refresh data if needed
          fetchOverviewMetrics();
        }}
      />
    </div>
  );
};
