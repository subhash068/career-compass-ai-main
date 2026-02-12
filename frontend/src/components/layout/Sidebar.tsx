import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Target,
  TrendingUp,
  Briefcase,
  GraduationCap,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
  Shield
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Profile } from '@/components/Profile';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/assessment', icon: Target, label: 'Skill Assessment' },
  { to: '/gaps', icon: TrendingUp, label: 'Gap Analysis' },
  { to: '/careers', icon: Briefcase, label: 'Career Matches' },
  { to: '/learning', icon: GraduationCap, label: 'Learning Path' },
];

const adminNavItems = [
  { to: '/admin', icon: Shield, label: 'Admin Dashboard' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Get user role from localStorage
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';

  const handleLogout = () => {
    try {
      // Clear authentication data
      localStorage.removeItem('authToken');
      sessionStorage.clear();

      // Dispatch auth change event to update AuthWrapper
      window.dispatchEvent(new Event('authChange'));

      // Show success message
      toast.success('Logged out successfully');

      // Redirect to login page
      navigate('/');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };
  return (
    <>
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar flex flex-col z-50 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* User Profile */}
      <Profile collapsed={collapsed} />

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                collapsed && "justify-center px-2"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 flex-shrink-0 transition-transform",
                !isActive && "group-hover:scale-110"
              )} />
              {!collapsed && (
                <span className="font-medium text-sm">{item.label}</span>
              )}
            </NavLink>
          );
        })}


      </nav>

      {/* Settings */}
      <div className="p-2 border-t border-sidebar-border space-y-1">
        {!isAdmin && (
          <NavLink
            to="/settings"
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
              "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              collapsed && "justify-center px-2"
            )}
          >
            <Settings className="w-5 h-5" />
            {!collapsed && <span className="font-medium text-sm">Settings</span>}
          </NavLink>
        )}
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
            "text-red-500 hover:bg-sidebar-accent hover:text-red-600",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="font-medium text-sm">Logout</span>}
        </Button>
      </div>

      {/* Collapse toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </Button>
    </aside>

    </>
  );
}
