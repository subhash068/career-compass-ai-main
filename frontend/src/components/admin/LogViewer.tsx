import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Search, 
  Download, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2,
  Clock,
  FileCode,
  Trash2,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axiosClient from '@/api/axiosClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface LogFile {
  name: string;
  path: string;
  size: number;
  modified: string;
  size_human: string;
}

interface LogEntry {
  timestamp: string | null;
  file: string;
  message: string;
  context: string[];
  line_number: number;
  type: string;
}

export default function LogViewer() {
  const { toast } = useToast();
  const [logFiles, setLogFiles] = useState<LogFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string[]>([]);
  const [errors, setErrors] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [linesToShow, setLinesToShow] = useState(100);
  const [timeRange, setTimeRange] = useState('24');
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingFile, setViewingFile] = useState<LogFile | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Initial data load
  useEffect(() => {
    fetchLogFiles();
    fetchErrors();
  }, [timeRange]);

  // Auto-refresh interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchLogFiles();
        fetchErrors();
      }, 10000); // Refresh every 10 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, timeRange]);


  const fetchLogFiles = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get('/admin/logs/files');
      setLogFiles(response.data.log_files);
    } catch (error) {
      console.error('Error fetching log files:', error);
      toast({
        title: "Error",
        description: "Failed to fetch log files",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchErrors = async () => {
    try {
      const response = await axiosClient.get(`/admin/logs/errors?hours=${timeRange}&limit=100`);
      setErrors(response.data.errors);
    } catch (error) {
      console.error('Error fetching errors:', error);
    }
  };

  const viewLogFile = async (file: LogFile) => {
    try {
      const response = await axiosClient.get('/admin/logs/view', {
        params: {
          file_path: file.path,
          lines: linesToShow,
          search: searchQuery || undefined
        }
      });
      
      setFileContent(response.data.content);
      setViewingFile(file);
      setIsViewModalOpen(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to read log file",
        variant: "destructive",
      });
    }
  };

  const downloadLogFile = async (file: LogFile) => {
    try {
      const response = await axiosClient.get('/admin/logs/view', {
        params: {
          file_path: file.path,
          lines: 10000 // Get more lines for download
        }
      });
      
      const blob = new Blob([response.data.content.join('\n')], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast({
        title: "Success",
        description: "Log file downloaded",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download log file",
        variant: "destructive",
      });
    }
  };

  const getFileIcon = (filename: string) => {
    if (filename.includes('error')) return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (filename.includes('access')) return <Eye className="h-4 w-4 text-blue-500" />;
    return <FileCode className="h-4 w-4 text-gray-500" />;
  };

  const getErrorColor = (message: string) => {
    if (message.includes('CRITICAL') || message.includes('FATAL')) return 'bg-red-500/10 text-red-600 border-red-500/20';
    if (message.includes('ERROR')) return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
    if (message.includes('WARNING')) return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search in logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Last 1 hour</SelectItem>
                <SelectItem value="6">Last 6 hours</SelectItem>
                <SelectItem value="24">Last 24 hours</SelectItem>
                <SelectItem value="48">Last 48 hours</SelectItem>
                <SelectItem value="168">Last 7 days</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant={autoRefresh ? "default" : "outline"}
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'Live Updates On' : 'Live Updates Off'}
            </Button>
            <Button variant="outline" onClick={() => {
              fetchLogFiles();
              fetchErrors();
            }}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Now
            </Button>

          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Log Files */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Log Files
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : logFiles.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>No log files found</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2">
                {logFiles.map((file) => (
                  <div
                    key={file.path}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {getFileIcon(file.name)}
                      <div>
                        <p className="font-medium text-sm">{file.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{file.size_human}</span>
                          <span>•</span>
                          <span>{new Date(file.modified).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewLogFile(file)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadLogFile(file)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Errors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Recent Errors
              <Badge variant="outline" className="ml-2">
                {errors.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {errors.length === 0 ? (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>No errors found in the selected time range</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {errors.map((error, index) => (
                  <div
                    key={index}
                    className={`p-3 border rounded-lg ${getErrorColor(error.message)}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {error.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs">
                          <Clock className="h-3 w-3" />
                          {error.timestamp ? new Date(error.timestamp).toLocaleString() : 'Unknown time'}
                          <span>•</span>
                          <span>{error.file}</span>
                          <span>•</span>
                          <span>Line {error.line_number}</span>
                        </div>
                        {error.context.length > 0 && (
                          <div className="mt-2 p-2 bg-black/5 rounded text-xs font-mono">
                            {error.context.map((line, i) => (
                              <div key={i} className={line === error.message ? 'font-bold' : ''}>
                                {line}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Log Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{viewingFile?.name}</span>
              <Badge variant="outline">{viewingFile?.size_human}</Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter lines..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select 
                value={linesToShow.toString()} 
                onValueChange={(v) => setLinesToShow(parseInt(v))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50 lines</SelectItem>
                  <SelectItem value="100">100 lines</SelectItem>
                  <SelectItem value="500">500 lines</SelectItem>
                  <SelectItem value="1000">1000 lines</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                onClick={() => viewingFile && viewLogFile(viewingFile)}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Apply
              </Button>
            </div>
            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
              {fileContent.length === 0 ? (
                <p className="text-gray-500">No content to display</p>
              ) : (
                fileContent.map((line, index) => (
                  <div key={index} className="hover:bg-white/5 px-2 py-0.5">
                    <span className="text-gray-500 select-none mr-2">
                      {(index + 1).toString().padStart(4, '0')}
                    </span>
                    <span className={line.includes('ERROR') ? 'text-red-400' : line.includes('WARNING') ? 'text-yellow-400' : ''}>
                      {line}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
