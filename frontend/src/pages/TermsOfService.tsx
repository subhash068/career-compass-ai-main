import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  ArrowLeft, 
  Scale, 
  UserCheck, 
  Copyright,
  AlertTriangle,
  Ban,
  Gavel,
  HelpCircle
} from 'lucide-react';

export default function TermsOfService() {
  const navigate = useNavigate();

  const sections = [
    {
      icon: UserCheck,
      title: 'Acceptance of Terms',
      content: `By accessing or using Career Compass AI, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the platform.

        These terms apply to all users, including:
        • Registered account holders
        • Guest users
        • Visitors browsing the platform
        • Admin and enterprise users
        
        We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Your continued use of the platform constitutes acceptance of the revised terms.`
    },
    {
      icon: Scale,
      title: 'Use of Services',
      content: `You agree to use Career Compass AI only for lawful purposes and in accordance with these Terms. Specifically, you agree not to:

        • Use the platform for any illegal or unauthorized purpose
        • Attempt to gain unauthorized access to any part of the platform
        • Interfere with or disrupt the integrity or performance of the services
        • Harvest or collect user information without consent
        • Upload malicious code, viruses, or harmful content
        • Impersonate any person or entity
        • Use the platform to generate spam or unsolicited communications
        • Reverse engineer or attempt to extract source code
        
        Violation of these terms may result in immediate termination of your account.`
    },
    {
      icon: Copyright,
      title: 'Intellectual Property',
      content: `All content, features, and functionality on Career Compass AI are owned by us and protected by international copyright, trademark, and other intellectual property laws.

        This includes:
        • Platform design, logos, and branding
        • AI algorithms and assessment methodologies
        • Text, graphics, and user interface elements
        • Software code and architecture
        • Database structures and content organization
        
        You are granted a limited, non-exclusive, non-transferable license to use the platform for personal career development purposes. This license does not permit:
        • Commercial use without written permission
        • Modification or creation of derivative works
        • Redistribution or resale of platform content
        • Removal of copyright or proprietary notices`
    },
    {
      icon: AlertTriangle,
      title: 'Disclaimer of Warranties',
      content: `Career Compass AI is provided on an "AS IS" and "AS AVAILABLE" basis. We make no warranties, expressed or implied, regarding the platform's operation or the information it provides.

        Specifically, we do not warrant that:
        • Career recommendations will lead to employment
        • Skill assessments are 100% accurate
        • The platform will be uninterrupted or error-free
        • AI-generated advice is suitable for your specific situation
        • Learning paths will guarantee skill acquisition
        
        Career decisions should be made considering multiple factors beyond our platform's recommendations. We encourage consulting with human career counselors for major decisions.`
    },
    {
      icon: Ban,
      title: 'Limitation of Liability',
      content: `To the maximum extent permitted by law, Career Compass AI and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including:

        • Loss of profits, revenue, or data
        • Career opportunities or employment decisions
        • Educational or training investments
        • Personal or professional reputation
        • Emotional distress or mental anguish
        
        Our total liability for any claims arising from your use of the platform shall not exceed the amount you paid us (if any) in the twelve months preceding the claim, or $100, whichever is greater.`
    },
    {
      icon: Gavel,
      title: 'Governing Law & Disputes',
      content: `These Terms shall be governed by and construed in accordance with the laws of [Jurisdiction], without regard to its conflict of law provisions.

        Any dispute arising from these Terms or your use of the platform shall be resolved through:
        1. Informal negotiation (30 days)
        2. Mediation (if negotiation fails)
        3. Binding arbitration (if mediation fails)
        
        You agree that any legal action must be brought in the courts located in [Jurisdiction], and you consent to the exclusive jurisdiction of such courts.

        Class action lawsuits are waived. Disputes must be brought in an individual capacity.`
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      {/* Header */}
      <header className="px-6 py-6 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Career Compass AI
            </span>
          </div>
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 py-16 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Scale className="w-4 h-4" />
            Legal
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-display mb-4">
            Terms of Service
          </h1>
          <p className="text-lg text-muted-foreground">
            Last updated: January 2024
          </p>
        </div>
      </section>

      {/* Introduction */}
      <section className="px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-2xl p-8 border border-blue-200 dark:border-blue-800 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <HelpCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">Please Read Carefully</h2>
                <p className="text-muted-foreground leading-relaxed">
                  These Terms of Service ("Terms") constitute a legally binding agreement between you 
                  and Career Compass AI regarding your use of our AI-powered career guidance platform. 
                  By accessing or using our services, you acknowledge that you have read, understood, 
                  and agree to be bound by these Terms.
                </p>
              </div>
            </div>
          </div>

          <div className="prose prose-lg max-w-none text-muted-foreground">
            <p className="text-lg leading-relaxed">
              Welcome to Career Compass AI. These Terms govern your access to and use of our platform, 
              including all features, content, and services offered. We encourage you to review these 
              Terms periodically as we may update them to reflect changes in our practices or legal requirements.
            </p>
          </div>
        </div>
      </section>

      {/* Terms Sections */}
      <section className="px-6 py-12 bg-muted/30">
        <div className="max-w-4xl mx-auto space-y-8">
          {sections.map((section, index) => (
            <div 
              key={index}
              className="bg-card rounded-2xl p-8 shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <section.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold mb-4">{section.title}</h2>
                  <div className="text-muted-foreground whitespace-pre-line leading-relaxed">
                    {section.content}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Account Termination Section */}
      <section className="px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 rounded-2xl p-8 border border-red-200 dark:border-red-800">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <Ban className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold mb-4">Account Termination</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We reserve the right to terminate or suspend your account immediately, without 
                  prior notice or liability, for any reason, including:
                </p>
                <ul className="space-y-2 text-muted-foreground mb-4">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    Breach of these Terms of Service
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    Fraudulent or illegal activity
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    Harassment or abuse of other users
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    Extended periods of inactivity
                  </li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  Upon termination, your right to use the platform will immediately cease. 
                  All provisions of these Terms which by their nature should survive termination 
                  shall survive, including ownership provisions, warranty disclaimers, indemnity, 
                  and limitations of liability.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="px-6 py-12 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-2xl p-8 shadow-sm border text-center">
            <h2 className="text-2xl font-semibold mb-4">Questions About Our Terms?</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              If you have any questions about these Terms of Service, please contact our legal team.
            </p>
            <Button variant="outline" onClick={() => window.location.href = 'mailto:legal@careercompass.ai'}>
              Contact Legal Team
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            © 2024 Career Compass AI. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <button 
              onClick={() => navigate('/privacy')}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Privacy Policy
            </button>
            <button 
              onClick={() => navigate('/terms')}
              className="text-primary font-medium"
            >
              Terms of Service
            </button>
            <button 
              onClick={() => navigate('/cookies')}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Cookie Policy
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
