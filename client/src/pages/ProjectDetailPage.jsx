import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getProjectById } from '../api/projects';
import {
  inviteCollaborator,
  respondToInvite,
  proposeTerms,
  respondToTerms,
  leaveProject
} from '../api/collaborators';
import { getOrCreateSingleChat } from '../api/chats';
import { getVendors } from '../api/vendors';
import { useAuthStore } from '../store/authStore';
import AppShell from '../components/AppShell';
import StatusBadge from '../components/StatusBadge';
import LockSeal from '../components/LockSeal';
import '../styles/pages-styles/ProjectDetailPage.css';
import BackButton from '../components/BackButton';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentUser = useAuthStore((state) => state.user);

  const [vendorSearch, setVendorSearch] = useState('');
  const [vendorResults, setVendorResults] = useState([]);
  const [showPicker, setShowPicker] = useState(false);

  const [termsForm, setTermsForm] = useState({ price: '', deliverables: '', dateConfirmed: '', notes: '' });
  const [activeTermsTarget, setActiveTermsTarget] = useState(null);

  const fetchProject = async () => {
    try {
      const res = await getProjectById(id);
      setProject(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  const isOwner = project && project.ownerId._id === currentUser.id;
  const myCollaboratorEntry = project?.collaborators.find((c) => c.userId._id === currentUser.id);

  const handleVendorSearch = async (e) => {
    e.preventDefault();
    try {
      const params = vendorSearch ? { search: vendorSearch } : {};
      const res = await getVendors(params);
      setVendorResults(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInvite = async (vendor) => {
    try {
      const chatRes = await getOrCreateSingleChat(vendor.userId._id);
      await inviteCollaborator(id, {
        targetUserId: vendor.userId._id,
        vendorCategory: vendor.category,
        chatId: chatRes.data._id
      });
      setShowPicker(false);
      setVendorResults([]);
      setVendorSearch('');
      fetchProject();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send invite');
    }
  };

  const handleInviteResponse = async (accept) => {
    try {
      await respondToInvite(id, accept);
      fetchProject();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to respond to invite');
    }
  };

  const handleProposeTerms = async (targetUserId) => {
    try {
      await proposeTerms(id, {
        targetUserId,
        price: Number(termsForm.price) || 0,
        deliverables: termsForm.deliverables,
        dateConfirmed: termsForm.dateConfirmed || null,
        notes: termsForm.notes
      });
      setActiveTermsTarget(null);
      setTermsForm({ price: '', deliverables: '', dateConfirmed: '', notes: '' });
      fetchProject();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to propose terms');
    }
  };

  const handleTermsResponse = async (accept) => {
    try {
      const res = await respondToTerms(id, accept);
      if (res.data.locked) {
        alert('All parties have accepted — this project is now locked in!');
      }
      fetchProject();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to respond to terms');
    }
  };

  const handleLeave = async () => {
    if (!window.confirm('Are you sure you want to leave this project?')) return;
    try {
      await leaveProject(id);
      fetchProject();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to leave project');
    }
  };

  if (loading) return <AppShell><p className="muted">Loading project…</p></AppShell>;
  if (!project) return <AppShell><p className="muted">Project not found.</p></AppShell>;

  const alreadyInvitedIds = new Set(project.collaborators.map((c) => c.userId._id));
  const acceptedCount = project.collaborators.filter((c) => c.inviteStatus === 'accepted').length;

  return (
    <AppShell>
      <BackButton fallback="/events" label="back to events" />
      <div className="project-header">
        <div>
          <div className="project-header-title-row">
            <h1>{project.title}</h1>
            {project.status === 'locked' && <LockSeal size={30} />}
          </div>
          {project.description && <p className="project-description">{project.description}</p>}
        </div>
      </div>

      <div className="project-layout">
        {/* Main column */}
        <div>
          <div className="panel">
            <p className="panel-title">Budget</p>
            <div className="budget-figure">${(project.budget?.total || 0).toLocaleString()}</div>
          </div>

          <div className="panel">
            <p className="panel-title">Collaborators</p>
            {project.collaborators.length === 0 ? (
              <p className="muted">No collaborators yet — invite one from the sidebar.</p>
            ) : (
              project.collaborators.map((c) => (
                <div className="collaborator-row" key={c.userId._id}>
                  <div className="collaborator-info">
                    <span className="collaborator-name">{c.userId.name}</span>
                    <span className="collaborator-category">{c.vendorCategory}</span>
                  </div>
                  <div className="collaborator-statuses">
                    {c.inviteStatus !== 'accepted' ? (
                      <StatusBadge status={c.inviteStatus} />
                    ) : (
                      <StatusBadge status={c.termsStatus} />
                    )}
                  </div>

                  {isOwner && c.inviteStatus === 'accepted' && c.termsStatus !== 'accepted' && (
                    <>
                      {activeTermsTarget === c.userId._id ? (
                        <div className="terms-form">
                          <input placeholder="Price (USD)" value={termsForm.price} onChange={(e) => setTermsForm({ ...termsForm, price: e.target.value })} />
                          <input placeholder="Deliverables" value={termsForm.deliverables} onChange={(e) => setTermsForm({ ...termsForm, deliverables: e.target.value })} />
                          <input type="date" value={termsForm.dateConfirmed} onChange={(e) => setTermsForm({ ...termsForm, dateConfirmed: e.target.value })} />
                          <div className="terms-form-actions">
                            <button className="btn-small btn-accept" onClick={() => handleProposeTerms(c.userId._id)}>Submit terms</button>
                            <button className="btn-small btn-decline" onClick={() => setActiveTermsTarget(null)}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <button className="btn-secondary" onClick={() => setActiveTermsTarget(c.userId._id)}>Propose terms</button>
                      )}
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="sidebar">
          <div className="sidebar-status-panel">
            <p className="sidebar-status-label">Status</p>
            {project.status === 'locked' && (
              <div className="sidebar-seal-wrap"><LockSeal size={48} /></div>
            )}
            <StatusBadge status={project.status} />
            <p className="muted" style={{ color: 'rgba(247,244,236,0.7)', marginTop: 'var(--space-3)', fontSize: '0.8rem' }}>
              {acceptedCount} collaborator{acceptedCount !== 1 ? 's' : ''} on board
            </p>
          </div>

          {myCollaboratorEntry?.inviteStatus === 'pending' && (
            <div className="action-card invite-pending">
              <p>You've been invited to join as <strong>{myCollaboratorEntry.vendorCategory}</strong>.</p>
              <div className="btn-row">
                <button className="btn-small btn-accept" onClick={() => handleInviteResponse(true)}>Accept</button>
                <button className="btn-small btn-decline" onClick={() => handleInviteResponse(false)}>Decline</button>
              </div>
            </div>
          )}

          {myCollaboratorEntry?.termsStatus === 'pending' && (
            <div className="action-card terms-pending">
              <p>New terms have been proposed:</p>
              <pre>{JSON.stringify(myCollaboratorEntry.proposedTerms, null, 2)}</pre>
              <div className="btn-row">
                <button className="btn-small btn-accept" onClick={() => handleTermsResponse(true)}>Accept terms</button>
                <button className="btn-small btn-decline" onClick={() => handleTermsResponse(false)}>Reject</button>
              </div>
            </div>
          )}

          {isOwner && project.status !== 'locked' && (
            <div className="action-card">
              <p style={{ fontWeight: 600 }}>Build your team</p>
              {!showPicker ? (
                <button className="btn-secondary" onClick={() => setShowPicker(true)}>+ Find a vendor</button>
              ) : (
                <div className="vendor-picker">
                  <form className="vendor-search-row" onSubmit={handleVendorSearch}>
                    <input
                      placeholder="Search by business name"
                      value={vendorSearch}
                      onChange={(e) => setVendorSearch(e.target.value)}
                    />
                    <button type="submit" className="btn-small btn-accept">Go</button>
                  </form>
                  {vendorResults.map((v) => (
                    <div className="vendor-result-row" key={v._id}>
                      <span><strong>{v.businessName}</strong> — {v.category}</span>
                      {alreadyInvitedIds.has(v.userId._id) ? (
                        <span className="already-invited-tag">Invited</span>
                      ) : (
                        <button className="btn-small btn-accept" onClick={() => handleInvite(v)}>Invite</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {myCollaboratorEntry?.inviteStatus === 'accepted' && project.status !== 'locked' && (
            <button className="btn-danger-ghost" onClick={handleLeave}>Leave this project</button>
          )}
        </div>
      </div>
    </AppShell>
  );
}