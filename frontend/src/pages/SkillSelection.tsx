import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Code2, Layout, Server, Brain, Cloud, Users,
  CheckCircle2, Target, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { skillsApi } from '@/api/skills.api.ts';

interface Domain {
  id: number;
  name: string;
  icon?: string;
}

interface Skill {
  id: number;
  name: string;
  description?: string;
}

const domainIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'Frontend': Code2,
  'Backend': Server,
  'Full Stack': Layout,
  'AI / ML': Brain,
  'DevOps': Cloud,
  'QA Engineer': Users,
};

export default function SkillSelection() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<number | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const loadDomains = async () => {
      try {
        // For now, we'll use a simple fetch to get domains
        // This should be replaced with proper API call
        const response = await fetch('http://localhost:5000/api/domains');
        if (response.ok) {
          const domainsData = await response.json();
          setDomains(domainsData);
        } else {
          // Fallback to hardcoded domains if API fails
          setDomains([
            { id: 1, name: 'Frontend' },
            { id: 2, name: 'Backend' },
            { id: 3, name: 'Full Stack' },
            { id: 4, name: 'AI / ML' },
            { id: 5, name: 'DevOps' },
            { id: 6, name: 'QA Engineer' },
          ]);
        }
      } catch (error) {
        console.error('Error loading domains:', error);
        // Fallback to hardcoded domains
        setDomains([
          { id: 1, name: 'Frontend' },
          { id: 2, name: 'Backend' },
          { id: 3, name: 'Full Stack' },
          { id: 4, name: 'AI / ML' },
          { id: 5, name: 'DevOps' },
          { id: 6, name: 'QA Engineer' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadDomains();
  }, []);

  useEffect(() => {
    const loadSkills = async () => {
      if (!selectedDomain) {
        setSkills([]);
        return;
      }

      setSkillsLoading(true);
      try {
        const response = await fetch(`http://localhost:5000/skills/${selectedDomain}`);

        if (response.ok) {
          const skillsData = await response.json();
          setSkills(skillsData);
        } else {
          // Fallback to hardcoded skills based on domain
          const fallbackSkills: Record<number, Skill[]> = {
            1: [
              { id: 1, name: 'HTML' },
              { id: 2, name: 'CSS' },
              { id: 3, name: 'JavaScript' },
              { id: 4, name: 'React' },
              { id: 5, name: 'Accessibility' },
              { id: 6, name: 'Performance Optimization' },
            ],
            2: [
              { id: 7, name: 'Python' },
              { id: 8, name: 'APIs (REST)' },
              { id: 9, name: 'Databases' },
              { id: 10, name: 'Authentication & Authorization' },
              { id: 11, name: 'System Design' },
              { id: 12, name: 'Security Basics' },
            ],
            // Add more domains as needed
          };
          setSkills(fallbackSkills[selectedDomain] || []);
        }
      } catch (error) {
        console.error('Error loading skills:', error);
        // Fallback to empty skills
        setSkills([]);
      } finally {
        setSkillsLoading(false);
      }
    };

    loadSkills();
  }, [selectedDomain]);

  const handleDomainSelect = (domainId: number) => {
    setSelectedDomain(domainId);
    setSelectedSkills(new Set()); // Reset skills when domain changes
  };

  const handleSkillToggle = (skillId: number) => {
    setSelectedSkills(prev => {
      const newSet = new Set(prev);
      if (newSet.has(skillId)) {
        newSet.delete(skillId);
      } else {
        newSet.add(skillId);
      }
      return newSet;
    });
  };

  const handleContinue = async () => {
    if (selectedSkills.size === 0) {
      toast({
        title: "No skills selected",
        description: "Please select at least one skill to continue.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Initialize assessment with backend
      const response = await fetch('http://localhost:5000/api/assessment/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`

        },
        body: JSON.stringify({
          domain_id: selectedDomain,
          skill_ids: Array.from(selectedSkills)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to initialize assessment');
      }

      const data = await response.json();

      // Store assessment data
      sessionStorage.setItem('assessmentId', data.assessment_id.toString());
      sessionStorage.setItem('selectedSkills', JSON.stringify(data.skills));

      navigate('/skill_selection/assessment');

    } catch (error) {
      console.error('Error initializing assessment:', error);
      toast({
        title: "Error",
        description: "Failed to initialize assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-2">
          <Target className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-3xl font-bold font-display">
          Choose Your Domain
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Select a career domain and the skills you want to assess. This will help us create a personalized assessment for you.
        </p>
      </div>

      {/* Domain Selection */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Step 1: Select Domain</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {domains.map((domain) => {
            const IconComponent = domainIcons[domain.name] || domainIcons['Frontend'];
            const isSelected = selectedDomain === domain.id;


            return (
              <Card
                key={domain.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-lg border-2",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border hover:border-primary/50"
                )}
                onClick={() => handleDomainSelect(domain.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10 text-primary">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{domain.name}</h4>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-primary mt-1" />}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Skills Selection */}
      {selectedDomain && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Step 2: Select Skills</h2>
            <Badge variant="secondary">
              {selectedSkills.size} of {skills.length} selected
            </Badge>
          </div>

          {skillsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {skills.map((skill) => {
                const isSelected = selectedSkills.has(skill.id);

                return (
                  <Card
                    key={skill.id}
                    className={cn(
                      "transition-all hover:shadow-md border-2",
                      isSelected
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => handleSkillToggle(skill.id)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{skill.name}</span>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />}
                          </div>
                        </div>
                        {/* <Button
                          variant="outline"
                          size="sm"
                          className="ml-2 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/skill_selection/assessment/exam', {
                              state: { skillName: skill.name, skillId: skill.id }
                            });
                          }}
                        >
                          Take Exam
                        </Button> */}

                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* Continue Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleContinue}
          disabled={!selectedDomain || selectedSkills.size === 0}
          size="lg"
          className="min-w-[200px]"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              Start Assessment
              <Target className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
