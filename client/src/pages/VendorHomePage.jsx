import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOpenProjects } from '../api/projects';
import { requestToJoin } from '../api/collaborators';
import { getOrCreateSingleChat } from '../api/chats';
import { getMyVendorProfile } from '../api/vendors';
import { getCategoryLabel } from '../constants/vendorCategories';
import { useAuthStore } from '../store/authStore';
import AppShell from '../components/AppShell';
import StatusBadge from '../components/StatusBadge';
import '../styles/pages-styles/VendorHomePage.css';

export default function VendorHomePage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [myCategoryLabel, setMyCategoryLabel] = useState('');
  const [requestingId, setRequestingId] = useState(null);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchProjects = async (searchTerm) => {
    setLoading(true);
    try {
      const params = searchTerm ? { search: searchTerm } : {};
      const res = await getOpenProjects(params);
      if (isMounted.current) setProjects(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const vp = await getMyVendorProfile();
        const label = vp.data.category === 'other'
          ? (vp.data.customCategoryLabel || 'Other')
          : getCategoryLabel(vp.data.category);
        if (isMounted.current) setMyCategoryLabel(label);
      } catch (err) {
        console.error(err);
      }
      fetchProjects(search);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProjects(search);
  };

  const handleRequest = async (project) => {
    if (!myCategoryLabel) {
      alert('We couldn\'t find your vendor category. Please complete your vendor profile before requesting to join.');
      return;
    }
    setRequestingId(project._id);
    try {
      const chatRes = await getOrCreateSingleChat(project.owner.id);
      await requestToJoin(project._id, {
        vendorCategory: myCategoryLabel,
        chatId: chatRes.data._id
      });
      fetchProjects(search);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send request');
    } finally {
      if (isMounted.current) setRequestingId(null);
    }
  };

  const handleMessage = async (ownerId) => {
    const res = await getOrCreateSingleChat(ownerId);
    navigate(`/chat?chatId=${res.data._id}`);
  };

  return (
    <AppShell>
      <div className="page-header">
        <div>
          <p className="page-eyebrow">Welcome, {user?.name}</p>
          <h1 className="page-title">Find work</h1>
        </div>
        <button className="btn-secondary" onClick={() => navigate('/events')}>
          Your own events
        </button>
      </div>

      <form className="market-filters" onSubmit={handleSearch}>
        <input
          placeholder="Search open events by title"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" className="btn-secondary">Search</button>
      </form>

      {loading ? (
        <p className="muted">Loading open events…</p>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <p>No open events right now.</p>
          <p className="muted">Planners can open their events to requests — check back soon.</p>
        </div>
      ) : (
        <div className="open-project-grid">
          {projects.map((p) => (
            <div className="open-project-card" key={p._id}>
              <div className="open-project-top">
                <h3>{p.title}</h3>
                {p.myStatus && <StatusBadge status={p.myStatus} />}
              </div>
              <p className="open-project-owner">by {p.owner.name}</p>
              {p.requiredVendors?.length > 0 && (
                <div className="open-project-tags">
                  {p.requiredVendors.map((r) => {
                    const label = r.category === 'other' ? (r.customLabel || 'Other') : getCategoryLabel(r.category);
                    return (
                      <span
                        key={r._id || r.category}
                        className={r.fulfilled ? 'open-project-tag filled' : 'open-project-tag'}
                      >
                        {label}
                      </span>
                    );
                  })}
                </div>
              )}
              <p className="open-project-desc">{p.description || 'No description provided.'}</p>
              {p.budget?.total > 0 && (
                <p className="open-project-budget">Budget: ${p.budget.total.toLocaleString()}</p>
              )}

              <div className="btn-row">
                {!p.myStatus && (
                  <button
                    className="btn-primary"
                    style={{ width: 'auto', padding: '9px 18px' }}
                    disabled={requestingId === p._id}
                    onClick={() => handleRequest(p)}
                  >
                    {requestingId === p._id ? 'Sending…' : 'Request to join'}
                  </button>
                )}
                <button className="btn-secondary" onClick={() => handleMessage(p.owner.id)}>
                  Message
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}