import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyProjects, toggleFavorite } from '../api/projects';
import AppShell from '../components/AppShell';
import StatusBadge from '../components/StatusBadge';
import LockSeal from '../components/LockSeal';
import NewEventModal from '../components/NewEventModal';
import StarButton from '../components/StarButton';
import { useAuthStore } from '../store/authStore';
import '../styles/pages-styles/EventPage.css';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'building', label: 'Building' },
  { value: 'pending_approval', label: 'Pending approval' },
  { value: 'locked', label: 'Locked' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
];

export default function EventPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sort, setSort] = useState('recent');
  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const currentUser = useAuthStore((state) => state.user);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = { sort };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await getMyProjects(params);
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, sort]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProjects();
  };

  const handleFavorite = async (projectId) => {
    // Optimistic update so the star responds instantly
    setProjects((prev) =>
      prev.map((p) =>
        p._id === projectId
          ? {
              ...p,
              favoritedBy: p.favoritedBy.includes(currentUser.id)
                ? p.favoritedBy.filter((id) => id !== currentUser.id)
                : [...p.favoritedBy, currentUser.id]
            }
          : p
      )
    );
    try {
      await toggleFavorite(projectId);
    } catch (err) {
      console.error(err);
      fetchProjects(); // revert to server truth if the request failed
    }
  };

  const handleCreated = () => {
    setShowModal(false);
    fetchProjects();
  };

  // Favorited projects surface first, everything else follows in whatever
  // order the server sort already applied (recent/oldest by updatedAt)
  const sortedProjects = [...projects].sort((a, b) => {
    const aFav = a.favoritedBy?.includes(currentUser.id) ? 1 : 0;
    const bFav = b.favoritedBy?.includes(currentUser.id) ? 1 : 0;
    return bFav - aFav;
  });

  return (
    <AppShell>
      <div className="page-header">
        <div>
          <p className="page-eyebrow">Your workspace</p>
          <h1 className="page-title">Events</h1>
        </div>
        <button className="btn-primary" style={{ width: 'auto', padding: '11px 22px' }} onClick={() => setShowModal(true)}>
          + New event
        </button>
      </div>

      <div className="event-controls">
        <form className="event-search-bar" onSubmit={handleSearchSubmit}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your events…"
          />
          <button type="submit" className="btn-secondary">Search</button>
        </form>
        <button
          className={showFilters ? 'btn-secondary active' : 'btn-secondary'}
          onClick={() => setShowFilters((s) => !s)}
        >
          Filter
        </button>
      </div>

      {showFilters && (
        <div className="filter-panel">
          <label className="field">
            <span className="field-label">Status</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Sort by</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="recent">Most recent</option>
              <option value="oldest">Oldest first</option>
            </select>
          </label>
        </div>
      )}

      {loading ? (
        <p className="muted">Loading your events…</p>
      ) : sortedProjects.length === 0 ? (
        <div className="empty-state">
          <p>No events match your search.</p>
          <p className="muted">Try clearing filters, or create a new event above.</p>
        </div>
      ) : (
        <div className="event-grid">
          {sortedProjects.map((p) => (
            <Link to={`/events/${p._id}`} key={p._id} className="event-card">
              <div className="event-card-top">
                <h3>{p.title}</h3>
                <div className="event-card-top-actions">
                  {p.status === 'locked' && <LockSeal size={20} />}
                  <StarButton
                    favorited={p.favoritedBy?.includes(currentUser.id)}
                    onClick={() => handleFavorite(p._id)}
                  />
                </div>
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

      {showModal && (
        <NewEventModal onClose={() => setShowModal(false)} onCreated={handleCreated} />
      )}
    </AppShell>
  );
}