import { useState, useEffect, useCallback } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  Code,
  BookOpen,
  Tag,
  X,
  Loader2,
  FileText,
  Save
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { notesApi, Note, CreateNoteRequest } from '@/api/notes.api';

const CODE_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'sql', label: 'SQL' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'bash', label: 'Bash/Shell' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'other', label: 'Other' },
];

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<CreateNoteRequest>({
    title: '',
    content: '',
    code_snippet: '',
    code_language: '',
    tags: '',
  });
  
  const { toast } = useToast();

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await notesApi.getNotes(0, 50, selectedTag || undefined);
      setNotes(response.notes);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [selectedTag, toast]);

  const fetchTags = useCallback(async () => {
    try {
      const response = await notesApi.getTags();
      setTags(response.tags);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  }, []);



  useEffect(() => {
    fetchNotes();
    fetchTags();
  }, [fetchNotes, fetchTags]);


  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchNotes();
      return;
    }
    
    try {
      setLoading(true);
      const response = await notesApi.searchNotes(searchQuery);
      setNotes(response.notes);
    } catch (error) {
      console.error('Error searching notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to search notes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async () => {
    try {
      await notesApi.createNote(formData);
      toast({
        title: 'Success',
        description: 'Note created successfully',
      });
      setIsCreateDialogOpen(false);
      resetForm();
      fetchNotes();
      fetchTags();
    } catch (error) {
      console.error('Error creating note:', error);
      toast({
        title: 'Error',
        description: 'Failed to create note',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateNote = async () => {
    if (!editingNote) return;
    
    try {
      await notesApi.updateNote(editingNote.id, formData);
      toast({
        title: 'Success',
        description: 'Note updated successfully',
      });
      setEditingNote(null);
      resetForm();
      fetchNotes();
      fetchTags();
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: 'Error',
        description: 'Failed to update note',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    try {
      await notesApi.deleteNote(noteId);
      toast({
        title: 'Success',
        description: 'Note deleted successfully',
      });
      fetchNotes();
      fetchTags();
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete note',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      code_snippet: '',
      code_language: '',
      tags: '',
    });
  };

  const openEditDialog = (note: Note) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      content: note.content,
      code_snippet: note.code_snippet || '',
      code_language: note.code_language || '',
      tags: note.tags || '',
    });
  };

  const openViewDialog = (note: Note) => {
    setViewingNote(note);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getLanguageLabel = (value: string) => {
    return CODE_LANGUAGES.find(lang => lang.value === value)?.label || value;
  };

  if (loading && notes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display">My Notes</h1>
          <p className="text-muted-foreground mt-1">
            Save your learning notes and code snippets
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Note
        </Button>
      </div>

      {/* Search and Filter */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={handleSearch}>
              Search
            </Button>
          </div>
          
          {tags.length > 0 && (
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <Select value={selectedTag} onValueChange={(value) => {
                setSelectedTag(value);
                fetchNotes();
              }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All tags</SelectItem>
                  {tags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </Card>

      {/* Notes Grid */}
      {notes.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No notes yet</h3>
          <p className="text-muted-foreground mb-4">
            Start saving your learning notes and code snippets
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create your first note
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <Card
              key={note.id}
              className="card-hover cursor-pointer group"
              onClick={() => openViewDialog(note)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg font-display line-clamp-2">
                    {note.title}
                  </CardTitle>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(note);
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNote(note.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Content preview */}
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {note.content}
                </p>
                
                {/* Code indicator */}
                {note.code_snippet && (
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <Code className="w-4 h-4" />
                    <span>
                      {note.code_language 
                        ? getLanguageLabel(note.code_language) 
                        : 'Code snippet'}
                    </span>
                  </div>
                )}
                
                {/* Tags */}
                {note.tags && (
                  <div className="flex flex-wrap gap-1">
                    {note.tags.split(',').map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                )}
                
                {/* Date */}
                <p className="text-xs text-muted-foreground">
                  {formatDate(note.created_at)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog 
        open={isCreateDialogOpen || !!editingNote} 
        onOpenChange={() => {
          setIsCreateDialogOpen(false);
          setEditingNote(null);
          resetForm();
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display">
              {editingNote ? 'Edit Note' : 'Create New Note'}
            </DialogTitle>
            <DialogDescription>
              {editingNote 
                ? 'Update your note and code snippet' 
                : 'Save your learning notes and code snippets'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                placeholder="Enter note title..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Content</label>
              <Textarea
                placeholder="Write your notes here..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={6}
              />
            </div>

            {/* Code Snippet */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Code className="w-4 h-4" />
                Code Snippet (Optional)
              </label>
              <Select
                value={formData.code_language}
                onValueChange={(value) => setFormData({ ...formData, code_language: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select programming language" />
                </SelectTrigger>
                <SelectContent>
                  {CODE_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Paste your code here..."
                value={formData.code_snippet}
                onChange={(e) => setFormData({ ...formData, code_snippet: e.target.value })}
                rows={6}
                className="font-mono text-sm"
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Tags
              </label>
              <Input
                placeholder="Enter tags separated by commas (e.g., javascript, react, tutorial)"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setEditingNote(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingNote ? handleUpdateNote : handleCreateNote}
              disabled={!formData.title || !formData.content}
            >
              <Save className="w-4 h-4 mr-2" />
              {editingNote ? 'Update Note' : 'Save Note'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Note Dialog */}
      <Dialog open={!!viewingNote} onOpenChange={() => setViewingNote(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {viewingNote && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <DialogTitle className="text-2xl font-display pr-8">
                    {viewingNote.title}
                  </DialogTitle>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setViewingNote(null);
                        openEditDialog(viewingNote);
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => {
                        handleDeleteNote(viewingNote.id);
                        setViewingNote(null);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <DialogDescription>
                  {formatDate(viewingNote.created_at)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Content */}
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{viewingNote.content}</p>
                </div>

                {/* Code Snippet */}
                {viewingNote.code_snippet && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Code className="w-4 h-4" />
                      <span>
                        {viewingNote.code_language 
                          ? getLanguageLabel(viewingNote.code_language) 
                          : 'Code'}
                      </span>
                    </div>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                      <code className="text-sm font-mono">
                        {viewingNote.code_snippet}
                      </code>
                    </pre>
                  </div>
                )}

                {/* Tags */}
                {viewingNote.tags && (
                  <div className="flex flex-wrap gap-2">
                    {viewingNote.tags.split(',').map((tag, i) => (
                      <Badge key={i} variant="secondary">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
