import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft, 
  Loader2,
  Briefcase,
  GraduationCap,
  User,
  FileText,
  Award,
  FolderGit2,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { resumeApi, Resume, PersonalInfo, Experience, Education, Certification, Project } from '@/api/resume.api';

export default function ResumeBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resumeId = searchParams.get('id');
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  
  // Form state
  const [title, setTitle] = useState('');
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    name: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    portfolio: '',
  });
  const [summary, setSummary] = useState('');
  const [experience, setExperience] = useState<Experience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [newSkill, setNewSkill] = useState('');

  const { toast } = useToast();

  useEffect(() => {
    if (resumeId) {
      loadResume(parseInt(resumeId));
    }
  }, [resumeId]);

  const loadResume = async (id: number) => {
    try {
      setLoading(true);
      const response = await resumeApi.getResume(id);
      if (response.success) {
        const resume = response.resume;
        setTitle(resume.title);
        setPersonalInfo(resume.personal_info || {});
        setSummary(resume.summary || '');
        setExperience(resume.experience || []);
        setEducation(resume.education || []);
        setSkills(resume.skills || []);
        setCertifications(resume.certifications || []);
        setProjects(resume.projects || []);
      }
    } catch (error) {
      console.error('Error loading resume:', error);
      toast({
        title: 'Error',
        description: 'Failed to load resume',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const resumeData = {
        title: title || 'Untitled Resume',
        personal_info: personalInfo,
        summary,
        experience,
        education,
        skills,
        certifications,
        projects,
      };

      let response;
      if (resumeId) {
        response = await resumeApi.updateResume(parseInt(resumeId), resumeData);
      } else {
        response = await resumeApi.createResume(resumeData);
      }

      if (response.success) {
        toast({
          title: 'Success',
          description: resumeId ? 'Resume updated successfully' : 'Resume created successfully',
        });
        if (!resumeId) {
          navigate(`/resumes/builder?id=${response.resume.id}`);
        }
      }
    } catch (error) {
      console.error('Error saving resume:', error);
      toast({
        title: 'Error',
        description: 'Failed to save resume',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Experience handlers
  const addExperience = () => {
    setExperience([...experience, {
      company: '',
      title: '',
      location: '',
      start_date: '',
      end_date: '',
      current: false,
      description: '',
    }]);
  };

  const updateExperience = (index: number, field: keyof Experience, value: any) => {
    const updated = [...experience];
    updated[index] = { ...updated[index], [field]: value };
    setExperience(updated);
  };

  const removeExperience = (index: number) => {
    setExperience(experience.filter((_, i) => i !== index));
  };

  // Education handlers
  const addEducation = () => {
    setEducation([...education, {
      school: '',
      degree: '',
      field: '',
      location: '',
      start_date: '',
      end_date: '',
    }]);
  };

  const updateEducation = (index: number, field: keyof Education, value: any) => {
    const updated = [...education];
    updated[index] = { ...updated[index], [field]: value };
    setEducation(updated);
  };

  const removeEducation = (index: number) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  // Skills handlers
  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  // Certification handlers
  const addCertification = () => {
    setCertifications([...certifications, {
      name: '',
      issuer: '',
      date: '',
    }]);
  };

  const updateCertification = (index: number, field: keyof Certification, value: string) => {
    const updated = [...certifications];
    updated[index] = { ...updated[index], [field]: value };
    setCertifications(updated);
  };

  const removeCertification = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index));
  };

  // Project handlers
  const addProject = () => {
    setProjects([...projects, {
      name: '',
      description: '',
      technologies: [],
    }]);
  };

  const updateProject = (index: number, field: keyof Project, value: any) => {
    const updated = [...projects];
    updated[index] = { ...updated[index], [field]: value };
    setProjects(updated);
  };

  const removeProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/resumes')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {resumeId ? 'Edit Resume' : 'Create Resume'}
            </h1>
            <p className="text-gray-600 text-sm">
              Build your professional resume
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Resume
            </>
          )}
        </Button>
      </div>

      {/* Resume Title */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Label htmlFor="title">Resume Title</Label>
            <Input
              id="title"
              placeholder="e.g., Software Developer Resume"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Personal</span>
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Summary</span>
          </TabsTrigger>
          <TabsTrigger value="experience" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            <span className="hidden sm:inline">Experience</span>
          </TabsTrigger>
          <TabsTrigger value="education" className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            <span className="hidden sm:inline">Education</span>
          </TabsTrigger>
          <TabsTrigger value="skills" className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            <span className="hidden sm:inline">Skills</span>
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <FolderGit2 className="w-4 h-4" />
            <span className="hidden sm:inline">Projects</span>
          </TabsTrigger>
        </TabsList>

        {/* Personal Info Tab */}
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={personalInfo.name || ''}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={personalInfo.email || ''}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={personalInfo.phone || ''}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={personalInfo.location || ''}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, location: e.target.value })}
                    placeholder="City, State"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    value={personalInfo.linkedin || ''}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, linkedin: e.target.value })}
                    placeholder="linkedin.com/in/johndoe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="portfolio">Portfolio/Website</Label>
                  <Input
                    id="portfolio"
                    value={personalInfo.portfolio || ''}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, portfolio: e.target.value })}
                    placeholder="johndoe.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Professional Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Write a brief summary of your professional background, key skills, and career objectives..."
                className="min-h-[200px]"
              />
              <p className="text-sm text-gray-500 mt-2">
                Tip: Keep it concise (2-4 sentences) and highlight your most relevant qualifications.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Experience Tab */}
        <TabsContent value="experience">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Work Experience</h3>
              <Button onClick={addExperience} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Experience
              </Button>
            </div>
            
            {experience.map((exp, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Job Title *</Label>
                      <Input
                        value={exp.title}
                        onChange={(e) => updateExperience(index, 'title', e.target.value)}
                        placeholder="Software Engineer"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Company *</Label>
                      <Input
                        value={exp.company}
                        onChange={(e) => updateExperience(index, 'company', e.target.value)}
                        placeholder="Tech Company Inc."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input
                        value={exp.location}
                        onChange={(e) => updateExperience(index, 'location', e.target.value)}
                        placeholder="New York, NY"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="month"
                        value={exp.start_date}
                        onChange={(e) => updateExperience(index, 'start_date', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="month"
                        value={exp.end_date}
                        onChange={(e) => updateExperience(index, 'end_date', e.target.value)}
                        disabled={exp.current}
                      />
                    </div>
                    <div className="flex items-center space-x-2 pt-6">
                      <input
                        type="checkbox"
                        id={`current-${index}`}
                        checked={exp.current}
                        onChange={(e) => updateExperience(index, 'current', e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={`current-${index}`}>Current Position</Label>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Description</Label>
                      <Textarea
                        value={exp.description}
                        onChange={(e) => updateExperience(index, 'description', e.target.value)}
                        placeholder="Describe your responsibilities and achievements..."
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => removeExperience(index)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {experience.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <Briefcase className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-gray-600 mb-4">No work experience added yet</p>
                  <Button onClick={addExperience} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Experience
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Education Tab */}
        <TabsContent value="education">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Education</h3>
              <Button onClick={addEducation} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Education
              </Button>
            </div>
            
            {education.map((edu, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>School/University *</Label>
                      <Input
                        value={edu.school}
                        onChange={(e) => updateEducation(index, 'school', e.target.value)}
                        placeholder="University Name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Degree *</Label>
                      <Input
                        value={edu.degree}
                        onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                        placeholder="Bachelor of Science"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Field of Study</Label>
                      <Input
                        value={edu.field}
                        onChange={(e) => updateEducation(index, 'field', e.target.value)}
                        placeholder="Computer Science"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input
                        value={edu.location}
                        onChange={(e) => updateEducation(index, 'location', e.target.value)}
                        placeholder="City, State"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="month"
                        value={edu.start_date}
                        onChange={(e) => updateEducation(index, 'start_date', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="month"
                        value={edu.end_date}
                        onChange={(e) => updateEducation(index, 'end_date', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => removeEducation(index)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {education.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <GraduationCap className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-gray-600 mb-4">No education added yet</p>
                  <Button onClick={addEducation} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Education
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Skills Tab */}
        <TabsContent value="skills">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Skills
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a skill (e.g., JavaScript, Project Management)"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                />
                <Button onClick={addSkill} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <Badge
                    key={skill}
                    variant="secondary"
                    className="px-3 py-1 text-sm flex items-center gap-2"
                  >
                    {skill}
                    <button
                      onClick={() => removeSkill(skill)}
                      className="hover:text-red-600 focus:outline-none"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              
              {skills.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  No skills added yet. Start typing to add your skills.
                </p>
              )}
              
              <p className="text-sm text-gray-500">
                Tip: Add both technical skills (e.g., Python, React) and soft skills (e.g., Leadership, Communication).
              </p>
            </CardContent>
          </Card>

          {/* Certifications */}
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Certifications
                </CardTitle>
                <Button onClick={addCertification} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Certification
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {certifications.map((cert, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Label>Certification Name</Label>
                    <Input
                      value={cert.name}
                      onChange={(e) => updateCertification(index, 'name', e.target.value)}
                      placeholder="AWS Certified Developer"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Issuing Organization</Label>
                    <Input
                      value={cert.issuer}
                      onChange={(e) => updateCertification(index, 'issuer', e.target.value)}
                      placeholder="Amazon Web Services"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date Earned</Label>
                    <div className="flex gap-2">
                      <Input
                        type="month"
                        value={cert.date}
                        onChange={(e) => updateCertification(index, 'date', e.target.value)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => removeCertification(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {certifications.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  No certifications added yet.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Projects</h3>
              <Button onClick={addProject} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Project
              </Button>
            </div>
            
            {projects.map((project, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Project Name *</Label>
                      <Input
                        value={project.name}
                        onChange={(e) => updateProject(index, 'name', e.target.value)}
                        placeholder="E-commerce Platform"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={project.description}
                        onChange={(e) => updateProject(index, 'description', e.target.value)}
                        placeholder="Describe your project, its purpose, and your role..."
                        className="min-h-[100px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Technologies Used</Label>
                      <Input
                        value={project.technologies?.join(', ') || ''}
                        onChange={(e) => updateProject(index, 'technologies', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                        placeholder="React, Node.js, MongoDB (comma separated)"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Project Link</Label>
                      <Input
                        value={project.link || ''}
                        onChange={(e) => updateProject(index, 'link', e.target.value)}
                        placeholder="https://github.com/username/project"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => removeProject(index)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {projects.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <FolderGit2 className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-gray-600 mb-4">No projects added yet</p>
                  <Button onClick={addProject} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Project
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
