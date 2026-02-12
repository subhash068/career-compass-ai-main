import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { 
  ArrowRight, 
  Brain, 
  Target, 
  GraduationCap, 
  MessageSquare, 
  TrendingUp,
  CheckCircle2,
  Sparkles,
  Zap,
  Users,
  Award,
  Rocket
} from 'lucide-react';


export default function LandingPage() {

  const navigate = useNavigate();

  const [scrollY, setScrollY] = useState(0);
  const mousePosition = useRef({ x: 0, y: 0 });
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number>();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    
    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      mousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const animate = () => {
      // Smooth interpolation (0.15 = smooth follow speed)
      currentX += (targetX - currentX) * 0.15;
      currentY += (targetY - currentY) * 0.15;

      // Use CSS transforms for GPU acceleration
      const transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
      
      if (cursorRef.current) {
        cursorRef.current.style.transform = transform;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = transform;
      }
      if (glowRef.current) {
        glowRef.current.style.transform = transform;
      }

      rafId.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    rafId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);


  // Handle cursor hover states
  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };



  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Skill Analysis',
      description: 'Get personalized skill assessments powered by advanced AI algorithms to understand your strengths and areas for improvement.',
      color: 'from-violet-500 to-purple-600',
      delay: '0'
    },
    {
      icon: Target,
      title: 'Career Matching',
      description: 'Discover career paths that align with your unique skill profile and professional aspirations.',
      color: 'from-blue-500 to-cyan-600',
      delay: '100'
    },
    {
      icon: GraduationCap,
      title: 'Customized Learning Paths',
      description: 'Receive step-by-step learning recommendations tailored to bridge your skill gaps and achieve your career goals.',
      color: 'from-emerald-500 to-teal-600',
      delay: '200'
    },
    {
      icon: MessageSquare,
      title: 'Interactive Career Assistant',
      description: 'Chat with our AI-powered assistant for instant career advice, guidance, and answers to your questions.',
      color: 'from-orange-500 to-amber-600',
      delay: '300'
    },
    {
      icon: TrendingUp,
      title: 'Progress Tracking',
      description: 'Monitor your skill development journey with detailed analytics and progress reports.',
      color: 'from-rose-500 to-pink-600',
      delay: '400'
    },
    {
      icon: Sparkles,
      title: 'Personalized Recommendations',
      description: 'Get job role suggestions and skill recommendations based on your profile and market trends.',
      color: 'from-indigo-500 to-blue-600',
      delay: '500'
    }
  ];

  const stats = [
    { icon: Users, value: '10K+', label: 'Active Users', color: 'text-blue-500' },
    { icon: Award, value: '95%', label: 'Success Rate', color: 'text-emerald-500' },
    { icon: Zap, value: '50+', label: 'Skills Assessed', color: 'text-amber-500' },
    { icon: Rocket, value: '100+', label: 'Career Paths', color: 'text-rose-500' }
  ];


  const benefits = [
    'Comprehensive skill assessment with AI evaluation',
    'Personalized career recommendations',
    'Custom learning paths for skill development',
    '24/7 AI career assistant',
    'Progress tracking and analytics',
    'Industry-aligned skill gap analysis'
  ];

  return (
    <div 
      className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 overflow-x-hidden cursor-none"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Custom Cursor - Small Elegant Dot (GPU Accelerated) */}
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference will-change-transform"
        style={{ transform: 'translate3d(0, 0, 0) translate(-50%, -50%)' }}
      >
        <div className={`rounded-full bg-white transition-all duration-100 ease-out ${
          isHovering ? 'w-5 h-5' : 'w-2.5 h-2.5'
        }`} />
      </div>
      
      {/* Cursor Ring - Elegant outline (GPU Accelerated) */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 pointer-events-none z-[9998] will-change-transform"
        style={{ transform: 'translate3d(0, 0, 0) translate(-50%, -50%)' }}
      >
        <div className={`rounded-full border border-primary/80 transition-all duration-100 ${
          isHovering ? 'w-8 h-8 border-2' : 'w-5 h-5 border'
        }`} />
      </div>
      
      {/* Subtle glow effect (GPU Accelerated) */}
      <div
        ref={glowRef}
        className="fixed top-0 left-0 pointer-events-none z-[9997] will-change-transform"
        style={{ transform: 'translate3d(0, 0, 0) translate(-50%, -50%)' }}
      >
        <div className={`rounded-full bg-primary/20 blur-sm transition-all duration-100 ${
          isHovering ? 'w-10 h-10 opacity-60' : 'w-6 h-6 opacity-30'
        }`} />
      </div>




      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute w-96 h-96 rounded-full bg-primary/5 blur-3xl animate-pulse"
          style={{ 
            top: `${mousePosition.current.y * 0.02}px`, 
            left: `${mousePosition.current.x * 0.02}px`,
            transition: 'all 0.5s ease-out'
          }}
        />

        <div 
          className="absolute w-64 h-64 rounded-full bg-secondary/10 blur-3xl animate-pulse delay-1000"
          style={{ 
            bottom: `${scrollY * 0.1}px`, 
            right: '10%',
            transition: 'all 0.3s ease-out'
          }}
        />
        <div className="absolute top-20 left-10 w-2 h-2 bg-primary/30 rounded-full animate-bounce" />
        <div className="absolute top-40 right-20 w-3 h-3 bg-secondary/30 rounded-full animate-bounce delay-300" />
        <div className="absolute bottom-40 left-1/4 w-2 h-2 bg-accent/30 rounded-full animate-bounce delay-700" />
      </div>

      {/* Hero Section */}
      <section ref={heroRef} className="relative px-6 py-20 lg:py-32 overflow-hidden">
        {/* Gradient Orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-r from-secondary/20 to-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 text-primary text-sm font-medium mb-8 animate-fade-in-up border border-primary/20 shadow-lg shadow-primary/5 hover:shadow-primary/10 transition-shadow duration-500 cursor-pointer group"
            style={{ animationDelay: '0.1s' }}
          >
            <Sparkles className="w-4 h-4 animate-pulse group-hover:rotate-12 transition-transform" />
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-semibold">
              AI-Powered Career Guidance Platform
            </span>
          </div>
          
          <h1 
            className="text-4xl md:text-6xl lg:text-7xl font-bold font-display tracking-tight mb-6 animate-fade-in-up"
            style={{ 
              animationDelay: '0.2s',
              transform: `translateY(${scrollY * 0.1}px)`
            }}
          >
            Navigate Your Career with{' '}
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-gradient">
              AI Intelligence
            </span>
          </h1>
          
          <p 
            className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10 animate-fade-in-up"
            style={{ animationDelay: '0.3s' }}
          >
            Discover your true potential with personalized skill assessments, 
            AI-driven career recommendations, and customized learning paths 
            designed to help you achieve your professional goals.
          </p>
          
          <div 
            className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up"
            style={{ animationDelay: '0.4s' }}
          >
            <Button 
              size="lg" 
              onClick={() => navigate('/register')}
              className="text-lg px-8 bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/25 group"
            >
              Get Started
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>

            <Button 
              variant="outline" 
              size="lg"
              onClick={() => navigate('/login')}
              className="text-lg px-8 hover:bg-primary/5 transition-all duration-300 hover:scale-105 border-2"
            >
              Sign In
            </Button>
          </div>

          {/* Floating Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <div className="group p-4 rounded-2xl bg-card/50 backdrop-blur-sm border hover:shadow-lg hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-1">
              <Users className="w-8 h-8 text-blue-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-2xl font-bold text-blue-500">
                <AnimatedNumber target={10000} suffix="K+" duration={2500} />
              </div>
              <div className="text-xs text-muted-foreground">Active Users</div>
            </div>
            <div className="group p-4 rounded-2xl bg-card/50 backdrop-blur-sm border hover:shadow-lg hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-1">
              <Award className="w-8 h-8 text-emerald-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-2xl font-bold text-emerald-500">
                <AnimatedNumber target={95} suffix="%" duration={2000} />
              </div>
              <div className="text-xs text-muted-foreground">Success Rate</div>
            </div>
            <div className="group p-4 rounded-2xl bg-card/50 backdrop-blur-sm border hover:shadow-lg hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-1">
              <Zap className="w-8 h-8 text-amber-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-2xl font-bold text-amber-500">
                <AnimatedNumber target={50} suffix="+" duration={2200} />
              </div>
              <div className="text-xs text-muted-foreground">Skills Assessed</div>
            </div>
            <div className="group p-4 rounded-2xl bg-card/50 backdrop-blur-sm border hover:shadow-lg hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-1">
              <Rocket className="w-8 h-8 text-rose-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-2xl font-bold text-rose-500">
                <AnimatedNumber target={100} suffix="+" duration={2400} />
              </div>
              <div className="text-xs text-muted-foreground">Career Paths</div>
            </div>
          </div>

        </div>
      </section>


      {/* Features Section */}
      <section className="px-6 py-20 bg-background relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 
              className="text-3xl md:text-4xl font-bold font-display mb-4 animate-fade-in-up"
              style={{ 
                opacity: Math.min(1, (scrollY - 200) / 300),
                transform: `translateY(${Math.max(0, 50 - (scrollY - 200) / 10)}px)`
              }}
            >
              Everything You Need to Advance Your Career
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our comprehensive platform provides all the tools and insights 
              you need to make informed career decisions and achieve your goals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className={`group relative p-6 rounded-2xl border bg-card/50 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden animate-fade-in-up`}
                style={{ animationDelay: `${feature.delay}ms` }}
              >
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                
                {/* Animated Border */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" 
                  style={{ 
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 2s infinite'
                  }} 
                />
                
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 shadow-lg`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">{feature.title}</h3>
                <p className="text-muted-foreground group-hover:text-foreground/80 transition-colors">{feature.description}</p>
                
                {/* Hover Arrow */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                  <ArrowRight className="w-5 h-5 text-primary" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="px-6 py-20 bg-muted/30 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold font-display mb-6 animate-fade-in-up">
                Why Choose Career Compass AI?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Our platform combines cutting-edge AI technology with industry expertise 
                to provide you with accurate, actionable career insights that make a difference.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div 
                    key={index} 
                    className="flex items-start gap-3 group animate-fade-in-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-lg group-hover:text-primary transition-colors">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-secondary/30 rounded-3xl blur-3xl group-hover:blur-2xl transition-all duration-500 animate-pulse" />
              <div className="relative bg-card/80 backdrop-blur-sm border rounded-3xl p-8 shadow-2xl hover:shadow-primary/20 transition-all duration-500 hover:-translate-y-2">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg animate-pulse">
                      <Brain className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">AI-Powered</div>
                      <div className="text-muted-foreground">Smart Analysis</div>
                    </div>
                  </div>
                  
                  <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-gradient-to-br from-primary/10 to-transparent rounded-xl hover:from-primary/20 transition-colors">
                      <div className="text-3xl font-bold text-primary">
                        <AnimatedNumber target={50} suffix="+" duration={2200} />
                      </div>
                      <div className="text-sm text-muted-foreground">Skills Assessed</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-secondary/10 to-transparent rounded-xl hover:from-secondary/20 transition-colors">
                      <div className="text-3xl font-bold text-secondary">
                        <AnimatedNumber target={100} suffix="+" duration={2400} />
                      </div>
                      <div className="text-sm text-muted-foreground">Career Paths</div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="bg-gradient-to-br from-primary via-primary/95 to-secondary rounded-3xl p-12 text-primary-foreground shadow-2xl shadow-primary/25 hover:shadow-primary/40 transition-shadow duration-500 relative overflow-hidden group">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4 animate-fade-in-up">
              Ready to Transform Your Career?
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              Join thousands of professionals who have already discovered their 
              potential and accelerated their career growth with Career Compass AI.
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => navigate('/register')}
              className="text-lg px-8 bg-white text-primary hover:bg-white/90 transition-all duration-300 hover:scale-105 hover:shadow-xl group animate-fade-in-up"
              style={{ animationDelay: '0.2s' }}
            >
              Start Your Journey
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg group-hover:shadow-primary/50 transition-shadow">
              <Target className="w-5 h-5 text-white group-hover:rotate-12 transition-transform" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Career Compass AI</span>
          </div>
          
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate('/about')}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              About
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Sign In
            </button>
            <button 
              onClick={() => navigate('/register')}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Get Started
            </button>
            <button 
              onClick={() => navigate('/privacy')}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Privacy
            </button>
            <button 
              onClick={() => navigate('/terms')}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Terms
            </button>
            <button 
              onClick={() => navigate('/cookies')}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Cookies
            </button>
          </div>
          
          <p className="text-muted-foreground text-sm">
            © 2026 Career Compass AI. All rights reserved.
          </p>
        </div>
      </footer>



      {/* Global Styles for Animations and Cursor */}
      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        
        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }

        /* Hide default cursor on landing page */
        .cursor-none,
        .cursor-none * {
          cursor: none !important;
        }

        /* Show pointer cursor on interactive elements */
        .cursor-none a,
        .cursor-none button,
        .cursor-none [role="button"],
        .cursor-none input,
        .cursor-none textarea,
        .cursor-none select {
          cursor: none !important;
        }
      `}</style>

    </div>
  );
}
