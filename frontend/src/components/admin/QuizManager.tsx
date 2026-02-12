import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, 
  Search, 
  Upload, 
  Download, 
  Edit2, 
  Trash2, 
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axiosClient from '@/api/axiosClient';

interface Question {
  id: number;
  skill_id: number;
  skill_name: string;
  question_text: string;
  question_type: string;
  options: string[];
  correct_answer: string;
  difficulty: string;
  explanation: string | null;
  created_at: string;
  updated_at: string;
}

interface Skill {
  id: number;
  name: string;
}

export default function QuizManager() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
  const limit = 10;

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadSkillId, setUploadSkillId] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    skill_id: '',
    question_text: '',
    options: ['', '', '', ''],
    correct_answer: '',
    difficulty: 'medium',
    explanation: ''
  });

  useEffect(() => {
    fetchQuestions();
    fetchSkills();
  }, [search, skillFilter, difficultyFilter, page]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('skip', ((page - 1) * limit).toString());
      params.append('limit', limit.toString());
      if (search) params.append('search', search);
      if (skillFilter !== 'all') params.append('skill_id', skillFilter);
      if (difficultyFilter !== 'all') params.append('difficulty', difficultyFilter);

      const response = await axiosClient.get(`/admin/quiz/questions?${params.toString()}`);

      setQuestions(response.data.questions);
      setTotal(response.data.total);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch questions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSkills = async () => {
    try {
      const response = await axiosClient.get('/skills');
      setSkills(response.data.skills || []);
    } catch (error) {
      console.error('Error fetching skills:', error);
    }
  };

  const handleCreateQuestion = async () => {
    try {
      const data = {
        ...formData,
        skill_id: parseInt(formData.skill_id),
        options: formData.options.filter(opt => opt.trim() !== '')
      };

      await axiosClient.post('/admin/quiz/questions', data);
      
      toast({
        title: "Success",
        description: "Question created successfully",
      });
      
      setIsCreateModalOpen(false);
      resetForm();
      fetchQuestions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to create question",
        variant: "destructive",
      });
    }
  };

  const handleUpdateQuestion = async () => {
    if (!editingQuestion) return;

    try {
      const data = {
        ...formData,
        skill_id: parseInt(formData.skill_id),
        options: formData.options.filter(opt => opt.trim() !== '')
      };

      await axiosClient.put(`/admin/quiz/questions/${editingQuestion.id}`, data);
      
      toast({
        title: "Success",
        description: "Question updated successfully",
      });
      
      setIsEditModalOpen(false);
      setEditingQuestion(null);
      resetForm();
      fetchQuestions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to update question",
        variant: "destructive",
      });
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      await axiosClient.delete(`/admin/quiz/questions/${questionId}`);
      
      toast({
        title: "Success",
        description: "Question deleted successfully",
      });
      
      fetchQuestions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to delete question",
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedQuestions.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedQuestions.length} questions?`)) return;

    try {
      await axiosClient.post('/admin/quiz/questions/bulk-delete', selectedQuestions);
      
      toast({
        title: "Success",
        description: `${selectedQuestions.length} questions deleted successfully`,
      });
      
      setSelectedQuestions([]);
      fetchQuestions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to delete questions",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFile) {
      toast({
        title: "Error",
        description: "Please select a file",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadFile);
    if (uploadSkillId) {
      formData.append('skill_id', uploadSkillId);
    }

    try {
      const response = await axiosClient.post('/admin/quiz/upload-excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast({
        title: "Upload Complete",
        description: `Created ${response.data.created_count} questions. ${response.data.error_count} errors.`,
      });

      setIsUploadModalOpen(false);
      setUploadFile(null);
      setUploadSkillId('');
      fetchQuestions();
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.response?.data?.detail || "Failed to upload file",
        variant: "destructive",
      });
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await axiosClient.get('/admin/quiz/download-template', {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'question_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download template",
        variant: "destructive",
      });
    }
  };

  const openEditModal = (question: Question) => {
    setEditingQuestion(question);
    setFormData({
      skill_id: question.skill_id.toString(),
      question_text: question.question_text,
      options: [...question.options, '', '', '', ''].slice(0, 4),
      correct_answer: question.correct_answer,
      difficulty: question.difficulty,
      explanation: question.explanation || ''
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      skill_id: '',
      question_text: '',
      options: ['', '', '', ''],
      correct_answer: '',
      difficulty: 'medium',
      explanation: ''
    });
  };

  const toggleSelectAll = () => {
    if (selectedQuestions.length === questions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(questions.map(q => q.id));
    }
  };

  const toggleSelectQuestion = (questionId: number) => {
    if (selectedQuestions.includes(questionId)) {
      setSelectedQuestions(selectedQuestions.filter(id => id !== questionId));
    } else {
      setSelectedQuestions([...selectedQuestions, questionId]);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'hard': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex gap-2">
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
          <Button variant="outline" onClick={() => setIsUploadModalOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Excel
          </Button>
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Template
          </Button>
        </div>
        {selectedQuestions.length > 0 && (
          <Button variant="destructive" onClick={handleBulkDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected ({selectedQuestions.length})
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={skillFilter} onValueChange={setSkillFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by skill" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Skills</SelectItem>
                {skills.map(skill => (
                  <SelectItem key={skill.id} value={skill.id.toString()}>
                    {skill.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Questions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Questions ({total})</span>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedQuestions.length === questions.length && questions.length > 0}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm font-normal text-muted-foreground">
                Select All
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : questions.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No questions found. Create your first question or upload from Excel.</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {questions.map((question) => (
                <div
                  key={question.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    checked={selectedQuestions.includes(question.id)}
                    onCheckedChange={() => toggleSelectQuestion(question.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-medium mb-2">{question.question_text}</p>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <Badge variant="outline" className={getDifficultyColor(question.difficulty)}>
                            {question.difficulty}
                          </Badge>
                          <Badge variant="outline">{question.skill_name}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Options:</span> {question.options.join(', ')}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Answer:</span> {question.correct_answer}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(question)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteQuestion(question.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {total > limit && (
                <div className="flex justify-between items-center pt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page * limit >= total}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Question Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Question</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Skill</Label>
              <Select 
                value={formData.skill_id} 
                onValueChange={(value) => setFormData({...formData, skill_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a skill" />
                </SelectTrigger>
                <SelectContent>
                  {skills.map(skill => (
                    <SelectItem key={skill.id} value={skill.id.toString()}>
                      {skill.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Question Text</Label>
              <Textarea
                value={formData.question_text}
                onChange={(e) => setFormData({...formData, question_text: e.target.value})}
                placeholder="Enter your question..."
                rows={3}
              />
            </div>
            <div>
              <Label>Options (one per line)</Label>
              {formData.options.map((option, index) => (
                <Input
                  key={index}
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...formData.options];
                    newOptions[index] = e.target.value;
                    setFormData({...formData, options: newOptions});
                  }}
                  placeholder={`Option ${index + 1}`}
                  className="mb-2"
                />
              ))}
            </div>
            <div>
              <Label>Correct Answer</Label>
              <Input
                value={formData.correct_answer}
                onChange={(e) => setFormData({...formData, correct_answer: e.target.value})}
                placeholder="Enter the correct answer"
              />
            </div>
            <div>
              <Label>Difficulty</Label>
              <Select 
                value={formData.difficulty} 
                onValueChange={(value) => setFormData({...formData, difficulty: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Explanation (Optional)</Label>
              <Textarea
                value={formData.explanation}
                onChange={(e) => setFormData({...formData, explanation: e.target.value})}
                placeholder="Explain why this is the correct answer..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateModalOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreateQuestion}>Create Question</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Question Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Same form fields as create */}
            <div>
              <Label>Skill</Label>
              <Select 
                value={formData.skill_id} 
                onValueChange={(value) => setFormData({...formData, skill_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a skill" />
                </SelectTrigger>
                <SelectContent>
                  {skills.map(skill => (
                    <SelectItem key={skill.id} value={skill.id.toString()}>
                      {skill.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Question Text</Label>
              <Textarea
                value={formData.question_text}
                onChange={(e) => setFormData({...formData, question_text: e.target.value})}
                placeholder="Enter your question..."
                rows={3}
              />
            </div>
            <div>
              <Label>Options (one per line)</Label>
              {formData.options.map((option, index) => (
                <Input
                  key={index}
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...formData.options];
                    newOptions[index] = e.target.value;
                    setFormData({...formData, options: newOptions});
                  }}
                  placeholder={`Option ${index + 1}`}
                  className="mb-2"
                />
              ))}
            </div>
            <div>
              <Label>Correct Answer</Label>
              <Input
                value={formData.correct_answer}
                onChange={(e) => setFormData({...formData, correct_answer: e.target.value})}
                placeholder="Enter the correct answer"
              />
            </div>
            <div>
              <Label>Difficulty</Label>
              <Select 
                value={formData.difficulty} 
                onValueChange={(value) => setFormData({...formData, difficulty: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Explanation (Optional)</Label>
              <Textarea
                value={formData.explanation}
                onChange={(e) => setFormData({...formData, explanation: e.target.value})}
                placeholder="Explain why this is the correct answer..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditModalOpen(false);
              setEditingQuestion(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpdateQuestion}>Update Question</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Questions from Excel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert>
              <FileSpreadsheet className="h-4 w-4" />
              <AlertDescription>
                Upload an Excel file with columns: question_text, options, correct_answer, difficulty, explanation, skill_id
              </AlertDescription>
            </Alert>
            <div>
              <Label>Default Skill (optional)</Label>
              <Select 
                value={uploadSkillId} 
                onValueChange={setUploadSkillId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select default skill" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Use skill_id from file</SelectItem>
                  {skills.map(skill => (
                    <SelectItem key={skill.id} value={skill.id.toString()}>
                      {skill.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Excel File</Label>
              <Input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                ref={fileInputRef}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsUploadModalOpen(false);
              setUploadFile(null);
              setUploadSkillId('');
            }}>
              Cancel
            </Button>
            <Button onClick={handleFileUpload} disabled={!uploadFile}>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
