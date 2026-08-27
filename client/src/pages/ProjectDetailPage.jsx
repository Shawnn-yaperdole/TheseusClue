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

export default function ProjectDetailPage() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentUser = useAuthStore((state) => state.user);

  // Vendor search/picker state
  const [vendorSearch, setVendorSearch] = useState('');
  const [vendorResults, setVendorResults] = useState([]);
  const [showPicker, setShowPicker] = useState(false);

  // Terms proposal form state (per collaborator, keyed by userId)
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

  if (loading) return <p>Loading project...</p>;
  if (!project) return <p>Project not found</p>;

  // Vendors already invited (any status) — used to hide them from search results so you can't double-invite via picker
  const alreadyInvitedIds = new Set(project.collaborators.map((c) => c.userId._id));

  return (
    <div>
      <h1>{project.title}</h1>
      <p>Status: <strong>{project.status}</strong></p>
      <p>{project.description}</p>
      <p>Budget: ${project.budget?.total || 0}</p>

      <h2>Collaborators</h2>
      {project.collaborators.length === 0 && <p>No collaborators yet.</p>}
      <ul>
        {project.collaborators.map((c) => (
          <li key={c.userId._id}>
            {c.userId.name} — {c.vendorCategory} — invite: <strong>{c.inviteStatus}</strong>, terms: <strong>{c.termsStatus}</strong>

            {isOwner && c.inviteStatus === 'accepted' && c.termsStatus !== 'accepted' && (
              <div style={{ marginTop: '4px' }}>
                {activeTermsTarget === c.userId._id ? (
                  <div>
                    <input placeholder="Price" value={termsForm.price} onChange={(e) => setTermsForm({ ...termsForm, price: e.target.value })} />
                    <input placeholder="Deliverables" value={termsForm.deliverables} onChange={(e) => setTermsForm({ ...termsForm, deliverables: e.target.value })} />
                    <input type="date" value={termsForm.dateConfirmed} onChange={(e) => setTermsForm({ ...termsForm, dateConfirmed: e.target.value })} />
                    <button onClick={() => handleProposeTerms(c.userId._id)}>Submit Terms</button>
                    <button onClick={() => setActiveTermsTarget(null)}>Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setActiveTermsTarget(c.userId._id)}>Propose Terms</button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* Owner: invite a collaborator via vendor picker */}
      {isOwner && project.status !== 'locked' && (
        <div style={{ marginTop: '16px', border: '1px solid #ccc', padding: '12px' }}>
          <h3>Invite a Collaborator</h3>

          {!showPicker ? (
            <button onClick={() => setShowPicker(true)}>+ Find a Vendor to Invite</button>
          ) : (
            <div>
              <form onSubmit={handleVendorSearch}>
                <input
                  placeholder="Search vendors by name"
                  value={vendorSearch}
                  onChange={(e) => setVendorSearch(e.target.value)}
                />
                <button type="submit">Search</button>
                <button type="button" onClick={() => { setShowPicker(false); setVendorResults([]); }}>Cancel</button>
              </form>

              <ul>
                {vendorResults.length === 0 && <li>No results yet — try searching.</li>}
                {vendorResults.map((v) => (
                  <li key={v._id}>
                    <strong>{v.businessName}</strong> ({v.category}) — {v.userId.name}
                    {alreadyInvitedIds.has(v.userId._id) ? (
                      <span> — already invited</span>
                    ) : (
                      <button onClick={() => handleInvite(v)}>Invite</button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Collaborator responding to a pending invite */}
      {myCollaboratorEntry?.inviteStatus === 'pending' && (
        <div style={{ marginTop: '16px', border: '1px solid orange', padding: '12px' }}>
          <p>You've been invited to join this project as {myCollaboratorEntry.vendorCategory}.</p>
          <button onClick={() => handleInviteResponse(true)}>Accept</button>
          <button onClick={() => handleInviteResponse(false)}>Decline</button>
        </div>
      )}

      {/* Collaborator responding to proposed terms */}
      {myCollaboratorEntry?.termsStatus === 'pending' && (
        <div style={{ marginTop: '16px', border: '1px solid blue', padding: '12px' }}>
          <p>New terms have been proposed:</p>
          <pre>{JSON.stringify(myCollaboratorEntry.proposedTerms, null, 2)}</pre>
          <button onClick={() => handleTermsResponse(true)}>Accept Terms</button>
          <button onClick={() => handleTermsResponse(false)}>Reject Terms</button>
        </div>
      )}

      {/* Leave option for active collaborators, pre-lock only */}
      {myCollaboratorEntry?.inviteStatus === 'accepted' && project.status !== 'locked' && (
        <button onClick={handleLeave} style={{ marginTop: '16px' }}>Leave Project</button>
      )}
    </div>
  );
}