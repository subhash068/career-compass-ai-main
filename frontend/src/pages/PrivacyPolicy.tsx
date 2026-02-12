import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  ArrowLeft, 
  Lock, 
  Eye, 
  Database, 
  Share2, 
  Cookie,
  Mail,
  UserCheck,
  Clock
} from 'lucide-react';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  const sections = [
    {
      icon: Eye,
      title: 'Information We Collect',
      content: `We collect information that you provide directly to us, including:
        • Personal identification information (name, email address)
        • Account credentials (encrypted passwords)
        • Skill assessment data and results
        • Career preferences and goals
        • Learning path progress and achievements
        • Chatbot conversation history
        
        We also automatically collect certain information when you use our platform:
        • Device and browser information
        • IP address and location data
        • Usage patterns and analytics
        • Cookies and similar technologies`
    },
    {
      icon: Database,
      title: 'How We Use Your Information',
      content: `We use the collected information to:
        • Provide and maintain our career guidance services
        • Generate personalized skill assessments and recommendations
        • Create customized learning paths
        • Improve our AI algorithms and platform functionality
        • Communicate with you about your account and updates
        • Ensure platform security and prevent fraud
        • Comply with legal obligations
        
        Your data helps us deliver accurate, personalized career insights and continuously improve our AI-powered recommendations.`
    },
    {
      icon: Lock,
      title: 'Data Security',
      content: `We implement comprehensive security measures to protect your data:
        • Industry-standard encryption (AES-256) for data at rest
        • TLS 1.3 encryption for data in transit
        • Secure JWT-based authentication
        • Regular security audits and penetration testing
        • Role-based access controls
        • Automated threat detection and monitoring
        
        While we strive to protect your personal information, no method of transmission over the internet is 100% secure. We continuously update our security practices to address emerging threats.`
    },
    {
      icon: Share2,
      title: 'Information Sharing',
      content: `We do not sell, trade, or rent your personal information to third parties. We may share information only in the following circumstances:
        • With your explicit consent
        • With service providers who assist our operations (under strict confidentiality agreements)
        • To comply with legal obligations or protect our rights
        • In connection with a business transfer or merger
        
        All third-party service providers are vetted for security and privacy compliance.`
    },
    {
      icon: UserCheck,
      title: 'Your Rights',
      content: `You have the following rights regarding your personal data:
        • Right to access your personal information
        • Right to correct inaccurate data
        • Right to request deletion of your data
        • Right to export your data
        • Right to withdraw consent
        • Right to object to certain processing activities
        
        To exercise these rights, contact us at privacy@careercompass.ai. We will respond to all requests within 30 days.`
    },
    {
      icon: Clock,
      title: 'Data Retention',
      content: `We retain your personal information for as long as your account is active or as needed to provide you with our services. We may also retain certain information:
        • For legal compliance purposes (up to 7 years)
        • For fraud prevention and security
        • To resolve disputes and enforce agreements
        
        When you delete your account, we will remove your personal data within 90 days, except where retention is required by law.`
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      {/* Header */}
      <header className="px-6 py-6 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
              <Shield className="w-5 h-5 text-white" />
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
            <Lock className="w-4 h-4" />
            Legal
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-display mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-muted-foreground">
            Last updated: January 2024
          </p>
        </div>
      </section>

      {/* Introduction */}
      <section className="px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-lg max-w-none text-muted-foreground">
            <p className="text-lg leading-relaxed">
              Career Compass AI ("we," "our," or "us") is committed to protecting your privacy. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your 
              information when you use our AI-powered career guidance platform.
            </p>
            <p className="text-lg leading-relaxed mt-4">
              By using Career Compass AI, you agree to the collection and use of information 
              in accordance with this policy. We take your privacy seriously and implement 
              industry-standard security measures to protect your personal data.
            </p>
          </div>
        </div>
      </section>

      {/* Policy Sections */}
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

      {/* Cookies Section */}
      <section className="px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-2xl p-8 border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                <Cookie className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold mb-4">Cookies & Tracking Technologies</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We use cookies and similar tracking technologies to enhance your experience, 
                  analyze usage patterns, and improve our services. Types of cookies we use:
                </p>
                <ul className="space-y-2 text-muted-foreground mb-4">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <strong>Essential Cookies:</strong> Required for platform functionality
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <strong>Analytics Cookies:</strong> Help us understand user behavior
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <strong>Preference Cookies:</strong> Remember your settings and choices
                  </li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  You can manage cookie preferences through your browser settings. Note that 
                  disabling certain cookies may affect platform functionality.
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
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold mb-4">Questions About Privacy?</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              If you have any questions about this Privacy Policy or our data practices, 
              please contact our Data Protection Officer.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" onClick={() => window.location.href = 'mailto:privacy@careercompass.ai'}>
                <Mail className="w-4 h-4 mr-2" />
                privacy@careercompass.ai
              </Button>
            </div>
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
              className="text-primary font-medium"
            >
              Privacy Policy
            </button>
            <button 
              onClick={() => navigate('/terms')}
              className="text-muted-foreground hover:text-primary transition-colors"
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
