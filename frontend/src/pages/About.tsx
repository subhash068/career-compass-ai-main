import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { 
  Target, 
  Brain, 
  GraduationCap, 
  MessageSquare, 
  TrendingUp,
  Users,
  Code2,
  Database,
  Shield,
  Sparkles,
  ArrowRight,
  Github,
  Linkedin,
  Twitter,
  Mail,
  Heart
} from 'lucide-react';


export default function About() {
  const navigate = useNavigate();

  const techStack = [
    {
      category: 'Frontend',
      icon: Code2,
      items: ['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'shadcn-ui', 'React Query', 'React Router']
    },
    {
      category: 'Backend',
      icon: Database,
      items: ['FastAPI', 'SQLAlchemy', 'Pydantic', 'JWT Authentication', 'bcrypt']
    },
    {
      category: 'Database',
      icon: Database,
      items: ['SQLite', 'SQLAlchemy ORM']
    },
    {
      category: 'DevOps',
      icon: Shield,
      items: ['Docker', 'Nginx', 'Prometheus Monitoring']
    }
  ];

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Skill Analysis',
      description: 'Advanced algorithms analyze your skills and provide personalized insights to help you understand your strengths and areas for improvement.'
    },
    {
      icon: Target,
      title: 'Career Matching',
      description: 'Get matched with career paths that align with your unique skill profile, experience, and professional aspirations.'
    },
    {
      icon: GraduationCap,
      title: 'Customized Learning Paths',
      description: 'Receive step-by-step learning recommendations tailored to bridge your skill gaps and achieve your career goals.'
    },
    {
      icon: MessageSquare,
      title: 'Interactive Career Assistant',
      description: 'Chat with our AI-powered assistant for instant career advice, guidance, and answers to your questions 24/7.'
    },
    {
      icon: TrendingUp,
      title: 'Progress Tracking',
      description: 'Monitor your skill development journey with detailed analytics, progress reports, and achievement tracking.'
    },
    {
      icon: Users,
      title: 'Community Driven',
      description: 'Join thousands of professionals who are accelerating their career growth with data-driven insights.'
    }
  ];

  const team = [
    {
      name: 'AI Technology',
      role: 'Core Engine',
      description: 'Powered by state-of-the-art machine learning algorithms for accurate skill assessment and career recommendations.'
    },
    {
      name: 'Modern Architecture',
      role: 'System Design',
      description: 'Built with scalable microservices architecture ensuring high availability and performance.'
    },
    {
      name: 'Security First',
      role: 'Data Protection',
      description: 'Enterprise-grade security with JWT authentication, encrypted data storage, and privacy protection.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      {/* Hero Section */}
      <section className="relative px-6 py-20 lg:py-32 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-r from-secondary/20 to-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 text-primary text-sm font-medium mb-8 border border-primary/20">
            <Sparkles className="w-4 h-4 animate-pulse" />
            About Career Compass AI
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold font-display tracking-tight mb-6">
            Empowering Careers Through{' '}
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Artificial Intelligence
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
            Career Compass AI is an intelligent platform designed to help professionals 
            navigate their career journey with personalized skill assessments, 
            AI-driven recommendations, and customized learning paths.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/register')}
              className="text-lg px-8 bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all duration-300 hover:scale-105 group"
            >
              Get Started
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => navigate('/')}
              className="text-lg px-8 hover:bg-primary/5 transition-all duration-300 hover:scale-105 border-2"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="px-6 py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold font-display mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                We believe everyone deserves access to high-quality career guidance. 
                Our mission is to democratize career development by leveraging AI 
                technology to provide personalized, actionable insights that help 
                professionals make informed decisions about their career paths.
              </p>
              <p className="text-lg text-muted-foreground mb-6">
                Whether you're just starting your career, looking to switch industries, 
                or aiming for a promotion, Career Compass AI provides the tools and 
                insights you need to succeed in today's competitive job market.
              </p>
              <div className="flex items-center gap-2 text-primary">
                <Heart className="w-5 h-5 animate-pulse" />
                <span className="font-medium">Built with passion for career growth</span>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-secondary/30 rounded-3xl blur-3xl animate-pulse" />
              <div className="relative bg-card/80 backdrop-blur-sm border rounded-3xl p-8 shadow-2xl">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center p-4 bg-gradient-to-br from-primary/10 to-transparent rounded-xl">
                    <div className="text-4xl text-primary mb-2">
                      <AnimatedNumber target={10000} suffix="K+" duration={2500} className="text-primary" />
                    </div>
                    <div className="text-sm text-muted-foreground">Active Users</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-secondary/10 to-transparent rounded-xl">
                    <div className="text-4xl text-secondary mb-2">
                      <AnimatedNumber target={95} suffix="%" duration={2000} className="text-secondary" />
                    </div>
                    <div className="text-sm text-muted-foreground">Success Rate</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-accent/10 to-transparent rounded-xl">
                    <div className="text-4xl text-accent mb-2">
                      <AnimatedNumber target={50} suffix="+" duration={2200} className="text-accent" />
                    </div>
                    <div className="text-sm text-muted-foreground">Skills Assessed</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-primary/10 to-transparent rounded-xl">
                    <div className="text-4xl text-primary mb-2">
                      <AnimatedNumber target={100} suffix="+" duration={2400} className="text-primary" />
                    </div>
                    <div className="text-sm text-muted-foreground">Career Paths</div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              Platform Features
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools designed to accelerate your career growth
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group p-6 rounded-2xl border bg-card/50 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 shadow-lg">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="px-6 py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              Technology Stack
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built with modern, scalable technologies for optimal performance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {techStack.map((tech, index) => (
              <div 
                key={index}
                className="p-6 rounded-2xl border bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <tech.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">{tech.category}</h3>
                </div>
                <ul className="space-y-2">
                  {tech.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="text-sm text-muted-foreground flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              System Architecture
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Designed with scalability, security, and performance in mind
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div 
                key={index}
                className="p-6 rounded-2xl border bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
                <p className="text-sm text-primary font-medium mb-3">{member.role}</p>
                <p className="text-muted-foreground text-sm">
                  {member.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API Documentation Preview */}
      <section className="px-6 py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              REST API
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive API endpoints for seamless integration
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl border bg-card/50 backdrop-blur-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Authentication
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center justify-between">
                  <span>POST /auth/register</span>
                  <span className="text-xs bg-primary/10 px-2 py-1 rounded">Register</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>POST /auth/login</span>
                  <span className="text-xs bg-primary/10 px-2 py-1 rounded">Login</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>GET /auth/profile</span>
                  <span className="text-xs bg-primary/10 px-2 py-1 rounded">Profile</span>
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl border bg-card/50 backdrop-blur-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                Skills & Career
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center justify-between">
                  <span>POST /skills/submit</span>
                  <span className="text-xs bg-primary/10 px-2 py-1 rounded">Submit</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>GET /skills/analyze</span>
                  <span className="text-xs bg-primary/10 px-2 py-1 rounded">Analyze</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>GET /career/recommend</span>
                  <span className="text-xs bg-primary/10 px-2 py-1 rounded">Recommend</span>
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl border bg-card/50 backdrop-blur-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                Learning Paths
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center justify-between">
                  <span>POST /learning/path</span>
                  <span className="text-xs bg-primary/10 px-2 py-1 rounded">Generate</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>GET /learning/path</span>
                  <span className="text-xs bg-primary/10 px-2 py-1 rounded">Retrieve</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>PUT /learning/path/step</span>
                  <span className="text-xs bg-primary/10 px-2 py-1 rounded">Update</span>
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl border bg-card/50 backdrop-blur-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Chatbot & Status
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center justify-between">
                  <span>POST /chatbot/query</span>
                  <span className="text-xs bg-primary/10 px-2 py-1 rounded">Query</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>GET /status</span>
                  <span className="text-xs bg-primary/10 px-2 py-1 rounded">Health</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-primary via-primary/95 to-secondary rounded-3xl p-12 text-primary-foreground shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000" />
            
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              Ready to Start Your Journey?
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Join thousands of professionals who have already discovered their 
              potential with Career Compass AI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => navigate('/register')}
                className="text-lg px-8 bg-white text-primary hover:bg-white/90 transition-all duration-300 hover:scale-105 group"
              >
                Create Free Account
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => navigate('/login')}
                className="text-lg px-8 border-white/60 text-primary hover:bg-white/20 transition-all duration-300"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Career Compass AI
                </span>
              </div>
              <p className="text-muted-foreground mb-4 max-w-sm">
                Empowering careers through artificial intelligence. 
                Personalized guidance for your professional journey.
              </p>
              <div className="flex gap-4">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10">
                  <Github className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10">
                  <Twitter className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10">
                  <Linkedin className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10">
                  <Mail className="w-5 h-5" />
                </Button>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => navigate('/')} className="hover:text-primary transition-colors">Home</button></li>
                <li><button onClick={() => navigate('/register')} className="hover:text-primary transition-colors">Get Started</button></li>
                <li><button onClick={() => navigate('/login')} className="hover:text-primary transition-colors">Sign In</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><span className="hover:text-primary transition-colors cursor-pointer">Privacy Policy</span></li>
                <li><span className="hover:text-primary transition-colors cursor-pointer">Terms of Service</span></li>
                <li><span className="hover:text-primary transition-colors cursor-pointer">Cookie Policy</span></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t text-center text-sm text-muted-foreground">
            <p>© 2026 Career Compass AI. All rights reserved.</p>
            <p className="mt-2 flex items-center justify-center gap-1">
              Made with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> for career growth
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
