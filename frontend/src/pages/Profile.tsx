import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Phone, Pencil } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { User as UserType } from '@/types';

const currentRoleOptions = [
  'Student',
  'Software Developer',
  'DevOps Engineer',
  'Data Scientist',
  'Product Manager',
  'Designer',
  'Project Manager',
  'Business Analyst',
  'QA Engineer',
  'Other'
];

export default function Profile() {
  const [profile, setProfile] = useState<UserType | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('')
  const [currentRole, setCurrentRole] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        const response = await api.getProfile(token);
        if (response.data) {
          setProfile(response.data as UserType);
        }
      }
    };
    fetchProfile();

    // Listen for auth changes
    const handleAuthChange = () => {
      fetchProfile();
    };

    window.addEventListener('authChange', handleAuthChange);

    return () => {
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, []);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setEmail(profile.email);
      setPhone(profile.phone || '');
      setCurrentRole(profile.currentRole);
    }
  }, [profile]);

  const handleSave = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      toast.error('Not authenticated');
      return;
    }

    const data: any = {
      name: name.trim(),
      phone: phone.trim(),
      current_role: currentRole,
    };

    const response = await api.updateProfile(token, data);

    if (response.error) {
      toast.error('Failed to update profile');
    } else {
      toast.success('Profile saved successfully!');
      // Update profile state with new values
      if (profile) {
        setProfile({
          ...profile,
          name,
          phone: phone || undefined,
          currentRole,
        });
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold font-display">Profile</h1>
        <p className="text-muted-foreground mt-1">
          Manage your personal information and preferences
        </p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-lg">Personal Information</CardTitle>
          </div>
          <CardDescription>Your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="pr-10" />
                <Pencil className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="pr-10" />
                <Pencil className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Current Role</Label>
            <Select value={currentRole} onValueChange={setCurrentRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select your current role" />
              </SelectTrigger>
              <SelectContent>
                {currentRoleOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}
