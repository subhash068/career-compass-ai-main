import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { FloatingChatbot } from '@/chatbot/FloatingChatbot';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      const user = localStorage.getItem('user');
      setIsAuthenticated(!!(token && user));
    };

    checkAuth();

    // Listen for auth changes
    const handleAuthChange = () => {
      checkAuth();
    };

    window.addEventListener('authChange', handleAuthChange);

    return () => {
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className={cn(
        "ml-64 min-h-screen transition-all duration-300",
        "max-lg:ml-16"
      )}>
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
      {isAuthenticated && <FloatingChatbot />}
    </div>
  );
}
