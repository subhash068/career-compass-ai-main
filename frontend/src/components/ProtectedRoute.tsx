import { Navigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  fallbackPath?: string;
}

export function ProtectedRoute({
  children,
  requiredRole,
  fallbackPath = '/dashboard'
}: ProtectedRouteProps) {
  const { user: contextUser, isLoading } = useAuth();
  
  // Check localStorage as fallback for immediate access after login
  let user = contextUser;
  if (!user) {
    const userStr = localStorage.getItem('user');
    if (userStr && userStr !== 'undefined') {
      try {
        user = JSON.parse(userStr);
        console.log('ProtectedRoute: Using user from localStorage:', user);
      } catch (e) {
        console.error('ProtectedRoute: Error parsing user from localStorage:', e);
      }
    }
  }

  // Show loading while auth is being checked (only if no user from localStorage)
  if (isLoading && !user) {

    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!user) {
    console.log('ProtectedRoute: No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Check role if required (case-insensitive)
  if (requiredRole) {
    const userRole = user.role?.toLowerCase();
    const required = requiredRole.toLowerCase();
    console.log('ProtectedRoute: Checking role. User role:', userRole, 'Required:', required);
    
    if (userRole !== required) {
      console.log('ProtectedRoute: Role mismatch, redirecting to', fallbackPath);
      return <Navigate to={fallbackPath} replace />;
    }
    
    console.log('ProtectedRoute: Role match granted for', requiredRole);
  }

  return <>{children}</>;
}
