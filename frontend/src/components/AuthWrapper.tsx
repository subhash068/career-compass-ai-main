import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const justLoggedIn = useRef(false);

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
      // Mark that user just logged in to prevent AuthWrapper from overriding redirect
      justLoggedIn.current = true;
      // Reset the flag after a short delay
      setTimeout(() => {
        justLoggedIn.current = false;
      }, 500);
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
      // Skip redirect if user just logged in (let Login.tsx handle the redirect)
      if (justLoggedIn.current) {
        console.log('AuthWrapper: Skipping redirect because user just logged in');
        return;
      }

      const userStr = localStorage.getItem('user');
      if (userStr && userStr !== 'undefined') {
        try {
          const user = JSON.parse(userStr);
          // Only redirect from root path, don't force admin to /admin
          // Let users stay on their current page
          if (location.pathname === '/') {
            if (user && user.role && typeof user.role === 'string') {
              // Case-insensitive role check
              const userRole = user.role.toUpperCase();
              if (userRole === 'admin') {
                console.log('AuthWrapper: Redirecting admin from / to /admin');
                navigate('/admin');
              } else {
                console.log('AuthWrapper: Redirecting user from / to /dashboard');
                navigate('/dashboard');
              }
            } else {
              navigate('/dashboard');
            }
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

  // Always render children - let individual routes handle their own auth
  return <>{children}</>;

}
