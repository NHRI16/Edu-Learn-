import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Upload,
  UserCircle,
  LogOut,
  Menu,
  X,
  GraduationCap,
  BookOpen,
} from 'lucide-react';
import './Layout.css';

export default function Layout({ children }) {
  const { profile, logout, isGuru } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ...(isGuru ? [{ to: '/upload', icon: Upload, label: 'Upload Materi' }] : []),
    { to: '/profile', icon: UserCircle, label: 'Profil' },
  ];

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__header">
          <div className="sidebar__logo">
            <div className="sidebar__logo-icon">
              <GraduationCap size={24} />
            </div>
            <div>
              <h2 className="sidebar__title">EduLearn</h2>
              <span className="sidebar__subtitle">Mini E-Learning</span>
            </div>
          </div>
          <button className="sidebar__close" onClick={closeSidebar}>
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar__nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
              }
              onClick={closeSidebar}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__user">
            <div className="sidebar__avatar">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" />
              ) : (
                <UserCircle size={32} />
              )}
            </div>
            <div className="sidebar__user-info">
              <span className="sidebar__user-name">
                {profile?.full_name || 'User'}
              </span>
              <span className={`badge ${isGuru ? 'badge-guru' : 'badge-siswa'}`}>
                {profile?.role || 'siswa'}
              </span>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        {/* Top bar for mobile */}
        <header className="topbar">
          <button className="topbar__menu" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </button>
          <div className="topbar__brand">
            <BookOpen size={20} />
            <span>EduLearn</span>
          </div>
          <div className="topbar__spacer" />
        </header>

        <div className="page-content animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
