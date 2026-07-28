import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, Package, FileText, LogOut, Bell } from 'lucide-react';
import './Layout.css';

export default function Layout() {
  const location = useLocation();
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }


  const role = localStorage.getItem('role') || '';
  const email = localStorage.getItem('email') || '';
  const initial = email ? email[0].toUpperCase() : 'U';

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'] },
    { path: '/customers', label: 'Customers', icon: Users, roles: ['ADMIN', 'SALES', 'ACCOUNTS'] },
    { path: '/products', label: 'Products', icon: Package, roles: ['ADMIN', 'WAREHOUSE', 'SALES', 'ACCOUNTS'] },
    { path: '/challans', label: 'Challans', icon: FileText, roles: ['ADMIN', 'SALES', 'ACCOUNTS'] },
  ].filter(item => item.roles.includes(role));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    window.location.href = '/login';
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/customers/')) return 'Customer Details';
    const map: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/customers': 'Customer CRM',
      '/products': 'Inventory Management',
      '/challans': 'Sales Challans',
    };
    return map[path] || 'Orbit CRM';
  };

  return (
    <div className="layout-container">
      <aside className="sidebar">
        <div className="logo-container">
          <div className="logo-icon">O</div>
          <h2>Orbit CRM</h2>
        </div>
        
        <div className="sidebar-section-label">Main Menu</div>

        <nav className="nav-menu">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
              (item.path === '/customers' && location.pathname.startsWith('/customers/'));
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} className="nav-icon" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="bottom-nav">
          <button className="nav-link logout-btn" onClick={handleLogout}>
            <LogOut size={18} className="nav-icon" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-navbar">
          <div className="breadcrumb">
            <h3>{getPageTitle()}</h3>
          </div>
          <div className="user-profile">
            <span className="user-role-badge">{role}</span>
            <div className="notification-bell">
              <Bell size={18} />
            </div>
            <div className="avatar">{initial}</div>
          </div>
        </header>
        
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}