import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { FloatingChatbot } from '@/chatbot/FloatingChatbot';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
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

  // Check if current page is a public page (landing, login, register, about, legal pages, or admin) - hide sidebar
  const isPublicPage = location.pathname === '/' || 
    location.pathname === '/login' || 
    location.pathname === '/register' || 
    location.pathname === '/about' ||
    location.pathname === '/privacy' ||
    location.pathname === '/terms' ||
    location.pathname === '/cookies' ||
    location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-background">
      {!isPublicPage && <Sidebar />}
      <main className={cn(
        "min-h-screen transition-all duration-300",
        !isPublicPage && "ml-64 max-lg:ml-16"
      )}>
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
      {isAuthenticated && !isPublicPage && <FloatingChatbot />}
    </div>
  );
}
