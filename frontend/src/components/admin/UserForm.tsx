import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axiosClient from '@/api/axiosClient';

interface UserFormProps {
  userId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isEditMode: boolean;
}

interface UserData {
  id?: number;
  email: string;
  name: string;
  role: string;
  currentRole: string;
  password?: string;
}

export default function UserForm({ userId, isOpen, onClose, onSuccess, isEditMode }: UserFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetchingUser, setFetchingUser] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<UserData>({
    email: '',
    name: '',
    role: 'user',
    currentRole: '',
    password: ''
  });

  useEffect(() => {
    if (isOpen && isEditMode && userId) {
      fetchUserData();
    } else if (isOpen && !isEditMode) {
      // Reset form for new user
      setFormData({
        email: '',
        name: '',
        role: 'user',
        currentRole: '',
        password: ''
      });
      setError(null);
    }
  }, [isOpen, userId, isEditMode]);

  const fetchUserData = async () => {
    if (!userId) return;
    
    try {
      setFetchingUser(true);
      const response = await axiosClient.get(`/admin/users/${userId}`);
      const user = response.data;
      
      setFormData({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        currentRole: user.currentRole || '',
        password: '' // Don't populate password
      });
      setError(null);
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to fetch user data');
    } finally {
      setFetchingUser(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validation
      if (!formData.email || !formData.name) {
        setError('Email and name are required');
        return;
      }

      if (!isEditMode && !formData.password) {
        setError('Password is required for new users');
        return;
      }

      const payload = {
        email: formData.email,
        name: formData.name,
        role: formData.role,
        currentRole: formData.currentRole,
        ...(formData.password && { password: formData.password })
      };

      if (isEditMode && userId) {
        // Update existing user
        await axiosClient.put(`/admin/users/${userId}`, payload);
        toast({
          title: "Success",
          description: "User updated successfully",
        });
      } else {
        // Create new user
        await axiosClient.post('/admin/users', payload);
        toast({
          title: "Success",
          description: "User created successfully",
        });
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!userId) return;
    
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await axiosClient.delete(`/admin/users/${userId}`);
      
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      
      onSuccess();
      onClose();
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to delete user');
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit User' : 'Create New User'}
          </DialogTitle>
        </DialogHeader>

        {fetchingUser ? (
          <div className="py-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading user data...</p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="user@example.com"
                disabled={isEditMode} // Email cannot be changed
              />
            </div>

            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>

            <div>
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="currentRole">Current Job Role</Label>
              <Input
                id="currentRole"
                value={formData.currentRole}
                onChange={(e) => setFormData({ ...formData, currentRole: e.target.value })}
                placeholder="Software Engineer"
              />
            </div>

            <div>
              <Label htmlFor="password">
                {isEditMode ? 'New Password (leave blank to keep current)' : 'Password *'}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={isEditMode ? '••••••••' : 'Enter password'}
              />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {isEditMode && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading || fetchingUser}
            >
              Delete User
            </Button>
          )}
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || fetchingUser}
          >
            {loading ? 'Saving...' : (isEditMode ? 'Update User' : 'Create User')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
