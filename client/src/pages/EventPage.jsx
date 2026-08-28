import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyProjects, createProject } from '../api/projects';
import AppShell from '../components/AppShell';
import StatusBadge from '../components/StatusBadge';
import LockSeal from '../components/LockSeal';
import '../styles/pages-styles/EventPage.css';

export default function EventPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchProjects = async () => {
    try {
      const res = await getMyProjects();
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      await createProject({ title: newTitle });
      setNewTitle('');
      fetchProjects();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <AppShell>
      <div className="page-header">
        <div>
          <p className="page-eyebrow">Your workspace</p>
          <h1 className="page-title">Events</h1>
        </div>
      </div>

      <form className="new-event-bar" onSubmit={handleCreate}>
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Name a new event — e.g. Amara & Leo's Wedding"
        />
        <button type="submit" className="btn-primary" disabled={creating}>
          {creating ? 'Creating…' : '+ New event'}
        </button>
      </form>

      {loading ? (
        <p className="muted">Loading your events…</p>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <p>No events yet.</p>
          <p className="muted">Create your first one above to start assembling a team.</p>
        </div>
      ) : (
        <div className="event-grid">
          {projects.map((p) => (
            <Link to={`/events/${p._id}`} key={p._id} className="event-card">
              <div className="event-card-top">
                <h3>{p.title}</h3>
                {p.status === 'locked' && <LockSeal size={20} />}
              </div>
              <p className="event-card-desc">{p.description || 'No description yet.'}</p>
              <div className="event-card-footer">
                <StatusBadge status={p.status} />
                <span className="event-card-collab-count">
                  {p.collaborators?.filter((c) => c.inviteStatus === 'accepted').length || 0} collaborator(s)
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}