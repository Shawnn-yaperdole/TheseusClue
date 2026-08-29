import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import Seal from './Seal';
import { useAuthStore } from '../store/authStore';
import NotificationBell from './NotificationBell';
import '../styles/components-styles/AppShell.css';

export default function AppShell({ children }) {
  const { user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app-shell">
      <header className="app-nav">
        <div className="app-nav-brand">
          <Seal size={28} />
          <span>TheseusClue</span>
        </div>

        <button
          className="nav-toggle"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        <div className={menuOpen ? 'app-nav-collapsible open' : 'app-nav-collapsible'}>
          <nav className="app-nav-links">
            <NavLink to="/events" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={() => setMenuOpen(false)}>
              Events
            </NavLink>
            <NavLink to="/market" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={() => setMenuOpen(false)}>
              Market
            </NavLink>
            <NavLink to="/chat" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={() => setMenuOpen(false)}>
              Chat
            </NavLink>
          </nav>
          <div className="app-nav-user">
            <NotificationBell />
            <Link to="/profile" className="app-nav-username">{user?.name}</Link>
            <button className="btn-ghost" onClick={logout}>Log out</button>
          </div>
        </div>
      </header>
      <main className="app-content">{children}</main>
    </div>
  );
}