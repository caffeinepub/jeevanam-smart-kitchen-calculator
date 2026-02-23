import { useNavigate, useRouterState } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, BookOpen, Package, Calculator, DollarSign, LogOut } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { cn } from '@/lib/utils';

interface NavigationProps {
  mobile?: boolean;
}

export default function Navigation({ mobile = false }: NavigationProps) {
  const navigate = useNavigate();
  const { clear } = useInternetIdentity();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/recipe-master', label: 'Recipe Master', icon: BookOpen },
    { path: '/raw-material-master', label: 'Raw Material Master', icon: Package },
    { path: '/production-calculator', label: 'Calculator', icon: Calculator },
    { path: '/cost-control', label: 'Cost Control', icon: DollarSign },
  ];

  const handleLogout = () => {
    clear();
    window.location.href = '/login';
  };

  if (mobile) {
    return (
      <div className="flex flex-col gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;
          return (
            <Button
              key={item.path}
              variant={isActive ? 'default' : 'ghost'}
              className={cn(
                'w-full justify-start h-12',
                isActive && 'bg-gradient-to-r from-[oklch(0.62_0.15_35)] to-[oklch(0.55_0.18_30)] text-white'
              )}
              onClick={() => navigate({ to: item.path })}
            >
              <Icon className="mr-3 h-5 w-5" />
              {item.label}
            </Button>
          );
        })}
        <Button
          variant="ghost"
          className="w-full justify-start h-12 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </Button>
      </div>
    );
  }

  return (
    <nav className="flex items-center gap-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentPath === item.path;
        return (
          <Button
            key={item.path}
            variant={isActive ? 'default' : 'ghost'}
            className={cn(
              'h-10',
              isActive && 'bg-gradient-to-r from-[oklch(0.62_0.15_35)] to-[oklch(0.55_0.18_30)] text-white'
            )}
            onClick={() => navigate({ to: item.path })}
          >
            <Icon className="mr-2 h-4 w-4" />
            {item.label}
          </Button>
        );
      })}
      <Button
        variant="ghost"
        className="h-10 text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={handleLogout}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Logout
      </Button>
    </nav>
  );
}
