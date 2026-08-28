import { NavLink } from 'react-router-dom';
import Seal from './Seal';
import { useAuthStore } from '../store/authStore';
import '../styles/components-styles/AppShell.css';
import NotificationBell from './NotificationBell';

export default function AppShell({ children }) {
  const { user, logout } = useAuthStore();

  return (
    <div className="app-shell">
      <header className="app-nav">
        <div className="app-nav-brand">
          <Seal size={28} />
          <span>TheseusClue</span>
        </div>
        <nav className="app-nav-links">
          <NavLink to="/events" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Events
          </NavLink>
          <NavLink to="/market" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Market
          </NavLink>
          <NavLink to="/chat" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Chat
          </NavLink>
        </nav>
        <div className="app-nav-user">
          <NotificationBell />
          <span className="app-nav-username">{user?.name}</span>
          <button className="btn-ghost" onClick={logout}>Log out</button>
        </div>
      </header>
      <main className="app-content">{children}</main>
    </div>
  );
}