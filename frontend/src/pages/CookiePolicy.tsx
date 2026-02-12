import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Cookie, 
  ArrowLeft, 
  Settings, 
  Shield,
  Info,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw
} from 'lucide-react';

export default function CookiePolicy() {
  const navigate = useNavigate();

  const cookieTypes = [
    {
      icon: CheckCircle2,
      title: 'Essential Cookies',
      status: 'Required',
      statusColor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      description: `These cookies are necessary for the platform to function properly. They enable core features such as:
        • User authentication and session management
        • Security features and fraud prevention
        • Load balancing and performance optimization
        • Remembering your privacy preferences
        
        Without these cookies, the platform cannot operate correctly. They cannot be disabled.`
    },
    {
      icon: Settings,
      title: 'Functional Cookies',
      status: 'Optional',
      statusColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      description: `These cookies enable enhanced functionality and personalization:
        • Remembering your settings and preferences
        • Language and region selection
        • Accessibility settings
        • Customized user interface elements
        
        Disabling these may reduce the platform's convenience but won't affect core functionality.`
    },
    {
      icon: Info,
      title: 'Analytics Cookies',
      status: 'Optional',
      statusColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      description: `We use these cookies to understand how users interact with our platform:
        • Page views and navigation patterns
        • Feature usage statistics
        • Error tracking and debugging
        • Performance monitoring
        
        This data helps us improve user experience and identify areas for enhancement. All data is anonymized.`
    },
    {
      icon: Shield,
      title: 'Marketing Cookies',
      status: 'Optional',
      statusColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      description: `These cookies help us deliver relevant content and measure marketing effectiveness:
        • Tracking referral sources
        • Campaign performance measurement
        • A/B testing for feature improvements
        • User segmentation for targeted communications
        
        We do not sell your data to third-party advertisers.`
    }
  ];

  const thirdPartyServices = [
    {
      name: 'Google Analytics',
      purpose: 'Usage analytics and performance monitoring',
      data: 'Anonymized usage data, page views, session duration'
    },
    {
      name: 'Stripe',
      purpose: 'Payment processing (for premium features)',
      data: 'Payment information (encrypted), transaction history'
    },
    {
      name: 'Cloudflare',
      purpose: 'CDN and security services',
      data: 'IP address, browser information (for security)'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      {/* Header */}
      <header className="px-6 py-6 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
              <Cookie className="w-5 h-5 text-white" />
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
      <section className="px-6 py-16 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-yellow-950/20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-medium mb-6">
            <Cookie className="w-4 h-4" />
            Legal
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-display mb-4">
            Cookie Policy
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
              This Cookie Policy explains how Career Compass AI uses cookies and similar tracking 
              technologies when you visit our platform. By using our services, you consent to the use 
              of cookies as described in this policy.
            </p>
            <p className="text-lg leading-relaxed mt-4">
              Cookies are small text files stored on your device that help us provide and improve our 
              services. They allow us to recognize your device, remember your preferences, and understand 
              how you interact with our platform.
            </p>
          </div>
        </div>
      </section>

      {/* Cookie Types */}
      <section className="px-6 py-12 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold font-display mb-8 text-center">
            Types of Cookies We Use
          </h2>
          
          <div className="space-y-6">
            {cookieTypes.map((type, index) => (
              <div 
                key={index}
                className="bg-card rounded-2xl p-8 shadow-sm border hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                    <type.icon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-semibold">{type.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${type.statusColor}`}>
                        {type.status}
                      </span>
                    </div>
                    <div className="text-muted-foreground whitespace-pre-line leading-relaxed">
                      {type.description}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Third Party Services */}
      <section className="px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/20 dark:to-gray-950/20 rounded-2xl p-8 border border-slate-200 dark:border-slate-800">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
              <RefreshCw className="w-6 h-6 text-primary" />
              Third-Party Services
            </h2>
            <p className="text-muted-foreground mb-6">
              We use trusted third-party services that may set cookies on your device. 
              These services help us deliver a better experience:
            </p>
            
            <div className="space-y-4">
              {thirdPartyServices.map((service, index) => (
                <div key={index} className="bg-card rounded-xl p-4 border">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                    <h3 className="font-semibold">{service.name}</h3>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      {service.purpose}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <strong>Data collected:</strong> {service.data}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Managing Cookies */}
      <section className="px-6 py-12 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-2xl p-8 border border-green-200 dark:border-green-800">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
              <Settings className="w-6 h-6 text-green-600 dark:text-green-400" />
              Managing Your Cookie Preferences
            </h2>
            
            <div className="space-y-4 text-muted-foreground">
              <p className="leading-relaxed">
                You have control over cookies on your device. Here's how you can manage them:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="bg-card rounded-xl p-4 border">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Browser Settings
                  </h3>
                  <p className="text-sm">
                    Most browsers allow you to control cookies through their settings. 
                    You can typically find these in the "Options" or "Preferences" menu.
                  </p>
                </div>
                
                <div className="bg-card rounded-xl p-4 border">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-500" />
                    Disabling Cookies
                  </h3>
                  <p className="text-sm">
                    You can disable cookies, but this may affect platform functionality. 
                    Essential cookies cannot be disabled as they are required for basic operation.
                  </p>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-400">
                  <strong>Note:</strong> If you disable cookies, some features of Career Compass AI 
                  may not function properly. We recommend keeping essential and functional cookies 
                  enabled for the best experience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cookie Duration */}
      <section className="px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-2xl p-8 shadow-sm border">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
              <Clock className="w-6 h-6 text-primary" />
              Cookie Duration
            </h2>
            
            <div className="space-y-4 text-muted-foreground">
              <p className="leading-relaxed">
                Cookies remain on your device for different periods depending on their type:
              </p>
              
              <ul className="space-y-3 mt-4">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div>
                    <strong className="text-foreground">Session Cookies:</strong> Temporary cookies 
                    that are deleted when you close your browser. Used for maintaining your session state.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-secondary mt-2" />
                  <div>
                    <strong className="text-foreground">Persistent Cookies:</strong> Remain on your 
                    device for a set period (30 days to 1 year) or until manually deleted. Used for 
                    remembering preferences and analytics.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-accent mt-2" />
                  <div>
                    <strong className="text-foreground">Third-Party Cookies:</strong> Set by our 
                    trusted partners. Duration varies based on their policies (typically up to 2 years).
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Updates Section */}
      <section className="px-6 py-12 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-2xl p-8 shadow-sm border">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
              <RefreshCw className="w-6 h-6 text-primary" />
              Updates to This Policy
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Cookie Policy from time to time to reflect changes in technology, 
              regulations, or our practices. When we make significant changes, we will notify you 
              through the platform or by email. The "Last updated" date at the top of this page indicates 
              when the policy was last revised.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We encourage you to review this policy periodically to stay informed about how we use cookies.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-2xl p-8 border border-amber-200 dark:border-amber-800 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-6">
              <Cookie className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-2xl font-semibold mb-4">Questions About Cookies?</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              If you have any questions about our use of cookies or this Cookie Policy, 
              please contact our privacy team.
            </p>
            <Button variant="outline" onClick={() => window.location.href = 'mailto:privacy@careercompass.ai'}>
              Contact Privacy Team
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
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Terms of Service
            </button>
            <button 
              onClick={() => navigate('/cookies')}
              className="text-primary font-medium"
            >
              Cookie Policy
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
