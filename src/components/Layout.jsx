import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import {
  LayoutDashboard, Brain, Map, Code, Mic, FileText,
  Briefcase, User, MessageSquare, LogOut, Rocket
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/assessment', icon: Brain, label: 'Domain Assessment' },
  { to: '/roadmap', icon: Map, label: '4-Year Roadmap' },
  { to: '/tasks', icon: Code, label: 'Learning Tasks' },
  { to: '/interview', icon: Mic, label: 'AI Interview' },
  { to: '/projects', icon: Briefcase, label: 'Projects' },
  { to: '/jd-validator', icon: FileText, label: 'JD Validator' },
  { to: '/portfolio', icon: Rocket, label: 'Portfolio' },
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/chat', icon: MessageSquare, label: 'AI Chat' },
];

export default function Layout() {
  const { user, logout } = useStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 fixed inset-y-0 left-0 z-30"
        style={{ background: 'rgba(10,10,15,0.95)', borderRight: '1px solid rgba(99,102,241,0.1)', backdropFilter: 'blur(20px)' }}>

        {/* Logo */}
        <div className="p-5 border-b" style={{ borderColor: 'rgba(99,102,241,0.1)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-lg">🚀</div>
            <div>
              <div className="font-bold text-white text-base gradient-text">ProPath AI</div>
              <div className="text-xs text-gray-500">Career Intelligence</div>
            </div>
          </div>
        </div>

        {/* User info */}
        <div className="p-4 border-b" style={{ borderColor: 'rgba(99,102,241,0.08)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-sm font-bold text-white">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{user?.name}</div>
              <div className="text-xs text-gray-500 truncate">{user?.careerDomain || 'Domain not set'}</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 flex-1 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Logout */}
        <div className="p-3 border-t" style={{ borderColor: 'rgba(99,102,241,0.08)' }}>
          <button onClick={handleLogout} className="sidebar-nav-item w-full text-red-400 hover:text-red-300">
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1 min-h-screen overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
