import axiosClient from './axiosClient';

export interface Note {
  id: number;
  user_id: number;
  title: string;
  content: string;
  code_snippet?: string;
  code_language?: string;
  learning_resource_id?: number;
  learning_path_step_id?: number;
  tags?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateNoteRequest {
  title: string;
  content: string;
  code_snippet?: string;
  code_language?: string;
  learning_resource_id?: number;
  learning_path_step_id?: number;
  tags?: string;
}

export interface UpdateNoteRequest {
  title?: string;
  content?: string;
  code_snippet?: string;
  code_language?: string;
  learning_resource_id?: number;
  learning_path_step_id?: number;
  tags?: string;
}

export interface NotesListResponse {
  notes: Note[];
  total: number;
}

export interface TagsResponse {
  tags: string[];
}

export const notesApi = {
  // Get all notes for current user
  getNotes: async (skip: number = 0, limit: number = 50, tag?: string): Promise<NotesListResponse> => {
    const params: Record<string, string | number> = { skip, limit };
    if (tag) params.tag = tag;
    const response = await axiosClient.get('/api/notes', { params });
    return response.data;
  },

  // Get a specific note
  getNote: async (noteId: number): Promise<Note> => {
    const response = await axiosClient.get(`/api/notes/${noteId}`);
    return response.data;
  },

  // Create a new note
  createNote: async (data: CreateNoteRequest): Promise<Note> => {
    const response = await axiosClient.post('/api/notes', data);
    return response.data;
  },

  // Update a note
  updateNote: async (noteId: number, data: UpdateNoteRequest): Promise<Note> => {
    const response = await axiosClient.put(`/api/notes/${noteId}`, data);
    return response.data;
  },

  // Delete a note
  deleteNote: async (noteId: number): Promise<void> => {
    await axiosClient.delete(`/api/notes/${noteId}`);
  },

  // Search notes
  searchNotes: async (query: string): Promise<NotesListResponse> => {
    const response = await axiosClient.get(`/api/notes/search/${query}`);
    return response.data;
  },

  // Get all tags
  getTags: async (): Promise<TagsResponse> => {
    const response = await axiosClient.get('/api/notes/tags/all');
    return response.data;
  },
};


export default notesApi;
