import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Login from '@/pages/Login';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const checkAuth = () => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');

    if (token && user) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    checkAuth();

    // Listen for storage changes (when localStorage is modified)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authToken' || e.key === 'user') {
        checkAuth();
      }
    };

    // Listen for custom auth events
    const handleAuthChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authChange', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, []);

  // Handle redirection in useEffect to avoid calling navigate during render
  useEffect(() => {
    if (isAuthenticated) {
      const userStr = localStorage.getItem('user');
      if (userStr && userStr !== 'undefined') {
        try {
          const user = JSON.parse(userStr);
          if (user && user.role && typeof user.role === 'string') {
            if (user.role.toUpperCase() === 'ADMIN') {
              if (location.pathname !== '/admin') {
                navigate('/admin');
              }
            } else if (location.pathname === '/') {
              navigate('/dashboard');
            }
          } else if (location.pathname === '/') {
            navigate('/dashboard');
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
          // Clear invalid user data
          localStorage.removeItem('user');
          localStorage.removeItem('authToken');
          setIsAuthenticated(false);
        }
      } else if (location.pathname === '/') {
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, location.pathname, navigate]);

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not authenticated, show login
  if (!isAuthenticated) {
    return <Login />;
  }

  return <>{children}</>;
}
