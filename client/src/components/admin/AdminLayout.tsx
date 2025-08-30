import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Menu, 
  X, 
  Home, 
  Car, 
  MapPin, 
  Calendar, 
  Users,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Tableau de Bord', href: '/admin', icon: Home },
    { name: 'Transferts', href: '/admin/transfers', icon: Car },
    { name: 'Demandes Excursions', href: '/admin/excursion-requests', icon: Calendar },
    { name: 'Excursions', href: '/admin/excursions', icon: MapPin },
    { name: 'Véhicules', href: '/admin/vehicles', icon: Users },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="admin-theme min-h-screen">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50" />
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex h-full flex-col bg-admin-card border-r border-admin-border">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-admin-border">
            <Link to="/admin" className="flex items-center space-x-2">
              <div className="bg-admin-foreground text-admin-bg px-3 py-2 rounded-lg font-bold text-lg">
                NT
              </div>
              <span className="text-admin-foreground font-semibold">Admin</span>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-admin-foreground"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-admin-foreground text-admin-bg'
                    : 'text-admin-muted hover:text-admin-foreground hover:bg-admin-accent'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Bottom section */}
          <div className="p-4 border-t border-admin-border">
            <Link
              to="/"
              className="flex items-center px-4 py-3 text-sm font-medium text-admin-muted hover:text-admin-foreground hover:bg-admin-accent rounded-lg transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Retour au Site
            </Link>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-admin-card border-b border-admin-border px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-admin-foreground"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-admin-muted">
                Administration NavetteTunisie
              </span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;