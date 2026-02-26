import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Target, 
  Briefcase, 
  GraduationCap, 
  MessageSquare, 
  FileText,
  Award,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';

export function QuickActions() {
  const { userSkills, careerMatches, learningPath } = useApp();

  const hasAssessments = userSkills.length > 0;
  const hasCareerMatches = careerMatches.length > 0;
  const hasLearningPath = learningPath !== null;

  const actions = [
    {
      title: 'Take Assessment',
      description: 'Evaluate your skills',
      icon: Target,
      href: '/skill_selection',
      color: 'bg-blue-500/10 text-blue-600',
      primary: hasAssessments && !hasAssessments
    },
    {
      title: 'Explore Careers',
      description: 'Find your perfect role',
      icon: Briefcase,
      href: '/careers',
      color: 'bg-green-500/10 text-green-600',
      primary: !hasCareerMatches
    },
    {
      title: 'Learning Path',
      description: 'Start your journey',
      icon: GraduationCap,
      href: '/learning',
      color: 'bg-purple-500/10 text-purple-600',
      primary: hasAssessments && !hasLearningPath
    },
    {
      title: 'AI Assistant',
      description: 'Get personalized help',
      icon: MessageSquare,
      href: '/assistant',
      color: 'bg-orange-500/10 text-orange-600',
      primary: false
    },
    {
      title: 'Certificates',
      description: 'View your achievements',
      icon: Award,
      href: '/certificates',
      color: 'bg-yellow-500/10 text-yellow-600',
      primary: false
    },
    {
      title: 'Resume Builder',
      description: 'Create your profile',
      icon: FileText,
      href: '/resume',
      color: 'bg-pink-500/10 text-pink-600',
      primary: false
    }
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-display flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          Quick Actions
        </CardTitle>
        <p className="text-sm text-muted-foreground">Jump to your next step</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => (
            <Button
              key={action.title}
              variant={action.primary ? "default" : "outline"}
              className="h-auto py-4 px-3 flex flex-col items-center text-center gap-2"
              asChild
            >
              <Link to={action.href}>
                <div className={`w-10 h-10 rounded-full ${action.color} flex items-center justify-center`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-medium text-sm block">{action.title}</span>
                  <span className="text-xs text-muted-foreground">{action.description}</span>
                </div>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
