import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProjectById, updateProject, toggleOpenToRequests } from '../api/projects';
import {
  inviteCollaborator,
  respondToInvite,
  proposeTerms,
  respondToTerms,
  leaveProject,
  respondToRequest
} from '../api/collaborators';
import { getOrCreateSingleChat } from '../api/chats';
import { getVendors } from '../api/vendors';
import { VENDOR_CATEGORIES, getCategoryLabel } from '../constants/vendorCategories';
import { useAuthStore } from '../store/authStore';
import AppShell from '../components/AppShell';
import StatusBadge from '../components/StatusBadge';
import LockSeal from '../components/LockSeal';
import BackButton from '../components/BackButton';
import { getRecommendations } from '../api/projects';
import '../styles/pages-styles/ProjectDetailPage.css';

const emptyEditForm = {
  title: '',
  description: '',
  budgetTotal: '',
  schedule: []
};

const emptyTermsForm = { price: '', deliverables: '', dateConfirmed: '', notes: '' };

export default function ProjectDetailPage() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentUser = useAuthStore((state) => state.user);

  const [vendorSearch, setVendorSearch] = useState('');
  const [vendorResults, setVendorResults] = useState([]);
  const [showPicker, setShowPicker] = useState(false);

  const [termsForm, setTermsForm] = useState(emptyTermsForm);
  const [activeTermsTarget, setActiveTermsTarget] = useState(null);

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [savingDetails, setSavingDetails] = useState(false);
  const [editError, setEditError] = useState('');

  const [newRequiredCategory, setNewRequiredCategory] = useState('');
  const [newRequiredCustomLabel, setNewRequiredCustomLabel] = useState('');
  const [requiredError, setRequiredError] = useState('');

  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  const projectRef = useRef(project);
  useEffect(() => {
    projectRef.current = project;
  }, [project]);

  const requiredVendorsQueueRef = useRef(Promise.resolve());

  const queueRequiredVendorsUpdate = (updaterFn, onError) => {
    const run = async () => {
      const current = projectRef.current;
      const updated = updaterFn(current.requiredVendors);
      await updateProject(id, { requiredVendors: updated });
      await fetchProject();
    };

    const next = requiredVendorsQueueRef.current.then(run, run).catch((err) => {
      if (onError) onError(err);
    });
    requiredVendorsQueueRef.current = next;
    return next;
  };

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

  // Moved these above the useEffect below — they were previously declared
  // after it, which caused "Cannot access 'isOwner' before initialization"
  const isOwner = project && project.ownerId._id === currentUser?.id;
  const myCollaboratorEntry = project?.collaborators.find((c) => c.userId._id === currentUser?.id);
  const canEdit = isOwner && project && !['locked', 'in_progress', 'completed'].includes(project.status);

  useEffect(() => {
    if (!project || !isOwner) return;
    if (['locked', 'in_progress', 'completed'].includes(project.status)) return;
    if (!project.requiredVendors?.some((r) => !r.fulfilled)) return;

    const fetchRecs = async () => {
      setLoadingRecs(true);
      try {
        const res = await getRecommendations(id);
        setRecommendations(res.data.slots || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingRecs(false);
      }
    };
    fetchRecs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.requiredVendors, isOwner]);

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
      const vendorCategoryLabel = vendor.category === 'other'
        ? (vendor.customCategoryLabel || 'Other')
        : getCategoryLabel(vendor.category);

      await inviteCollaborator(id, {
        targetUserId: vendor.userId._id,
        vendorCategory: vendorCategoryLabel,
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

  const handleRequestResponse = async (targetUserId, accept) => {
    try {
      await respondToRequest(id, { targetUserId, accept });
      fetchProject();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to respond to request');
    }
  };

  const openTermsForm = (targetUserId) => {
    setTermsForm(emptyTermsForm);
    setActiveTermsTarget(targetUserId);
  };

  const closeTermsForm = () => {
    setActiveTermsTarget(null);
    setTermsForm(emptyTermsForm);
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
      closeTermsForm();
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

  const handleToggleOpen = async () => {
    try {
      await toggleOpenToRequests(id);
      fetchProject();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update setting');
    }
  };

  const startEditing = () => {
    setEditForm({
      title: project.title || '',
      description: project.description || '',
      budgetTotal: project.budget?.total ?? '',
      schedule: project.schedule?.length
        ? project.schedule.map((s) => ({
            item: s.item || '',
            date: s.date ? s.date.slice(0, 10) : '',
            time: s.time || ''
          }))
        : []
    });
    setEditError('');
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setEditForm(emptyEditForm);
    setEditError('');
  };

  const addScheduleRow = () => {
    setEditForm((prev) => ({
      ...prev,
      schedule: [...prev.schedule, { item: '', date: '', time: '' }]
    }));
  };

  const updateScheduleRow = (index, key, value) => {
    setEditForm((prev) => ({
      ...prev,
      schedule: prev.schedule.map((row, i) => (i === index ? { ...row, [key]: value } : row))
    }));
  };

  const removeScheduleRow = (index) => {
    setEditForm((prev) => ({
      ...prev,
      schedule: prev.schedule.filter((_, i) => i !== index)
    }));
  };

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    setSavingDetails(true);
    setEditError('');

    try {
      await updateProject(id, {
        title: editForm.title,
        description: editForm.description,
        budget: { total: Number(editForm.budgetTotal) || 0 },
        schedule: editForm.schedule
          .filter((row) => row.item.trim())
          .map((row) => ({ item: row.item, date: row.date || null, time: row.time }))
      });
      setEditing(false);
      fetchProject();
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to save changes');
    } finally {
      setSavingDetails(false);
    }
  };

  const handleAddRequiredVendor = () => {
    setRequiredError('');
    if (!newRequiredCategory) {
      setRequiredError('Choose a category first.');
      return;
    }
    if (newRequiredCategory === 'other' && !newRequiredCustomLabel.trim()) {
      setRequiredError('Please specify the vendor type.');
      return;
    }
    const current = projectRef.current;
    if (newRequiredCategory !== 'other' && current.requiredVendors.some((r) => r.category === newRequiredCategory)) {
      setRequiredError('That category is already on the list.');
      return;
    }

    const categoryToAdd = newRequiredCategory;
    const customLabelToAdd = newRequiredCustomLabel;

    queueRequiredVendorsUpdate(
      (requiredVendors) => [
        ...requiredVendors,
        {
          category: categoryToAdd,
          customLabel: categoryToAdd === 'other' ? customLabelToAdd : '',
          fulfilled: false
        }
      ],
      (err) => setRequiredError(err.response?.data?.message || 'Failed to add requirement')
    );

    setNewRequiredCategory('');
    setNewRequiredCustomLabel('');
  };

  const handleToggleFulfilled = (index) => {
    queueRequiredVendorsUpdate(
      (requiredVendors) => requiredVendors.map((r, i) => (i === index ? { ...r, fulfilled: !r.fulfilled } : r)),
      (err) => alert(err.response?.data?.message || 'Failed to update')
    );
  };

  const handleRemoveRequiredVendor = (index) => {
    queueRequiredVendorsUpdate(
      (requiredVendors) => requiredVendors.filter((_, i) => i !== index),
      (err) => alert(err.response?.data?.message || 'Failed to remove')
    );
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
        {canEdit && !editing && (
          <button className="btn-secondary" onClick={startEditing}>Edit details</button>
        )}
      </div>

      <div className="project-layout">
        {/* Main column */}
        <div>
          {editing ? (
            <form className="panel" onSubmit={handleSaveDetails}>
              <p className="panel-title">Edit event details</p>
              {editError && <div className="auth-error">{editError}</div>}

              <label className="field">
                <span className="field-label">Title</span>
                <input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  required
                />
              </label>

              <label className="field">
                <span className="field-label">Description</span>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                />
              </label>

              <label className="field">
                <span className="field-label">Budget total ($)</span>
                <input
                  type="number"
                  min="0"
                  value={editForm.budgetTotal}
                  onChange={(e) => setEditForm({ ...editForm, budgetTotal: e.target.value })}
                />
              </label>

              <span className="field-label" style={{ display: 'block', marginTop: 'var(--space-4)' }}>Schedule</span>
              {editForm.schedule.length === 0 && (
                <p className="muted" style={{ marginBottom: 'var(--space-3)' }}>No schedule items yet.</p>
              )}
              {editForm.schedule.map((row, i) => (
                <div className="schedule-edit-row" key={i}>
                  <input
                    placeholder="Item (e.g. Ceremony)"
                    value={row.item}
                    onChange={(e) => updateScheduleRow(i, 'item', e.target.value)}
                  />
                  <input
                    type="date"
                    value={row.date}
                    onChange={(e) => updateScheduleRow(i, 'date', e.target.value)}
                  />
                  <input
                    type="time"
                    value={row.time}
                    onChange={(e) => updateScheduleRow(i, 'time', e.target.value)}
                  />
                  <button type="button" className="btn-danger-ghost" onClick={() => removeScheduleRow(i)}>
                    Remove
                  </button>
                </div>
              ))}
              <button type="button" className="btn-secondary" onClick={addScheduleRow} style={{ marginTop: 'var(--space-2)' }}>
                + Add schedule item
              </button>

              <div className="btn-row" style={{ marginTop: 'var(--space-5)' }}>
                <button type="submit" className="btn-primary" disabled={savingDetails} style={{ width: 'auto', padding: '11px 24px' }}>
                  {savingDetails ? 'Saving…' : 'Save changes'}
                </button>
                <button type="button" className="btn-secondary" onClick={cancelEditing}>Cancel</button>
              </div>
            </form>
          ) : (
            <>
              <div className="panel">
                <p className="panel-title">Budget</p>
                <div className="budget-figure">${(project.budget?.total || 0).toLocaleString()}</div>
              </div>

              <div className="panel">
                <p className="panel-title">Schedule</p>
                {project.schedule?.length ? (
                  project.schedule.map((s, i) => (
                    <div className="schedule-row" key={i}>
                      <span className="schedule-item-name">{s.item}</span>
                      <span className="schedule-item-when">
                        {s.date ? new Date(s.date).toLocaleDateString() : ''} {s.time || ''}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="muted">No schedule items yet.</p>
                )}
              </div>
            </>
          )}

          <div className="panel">
            <p className="panel-title">Required vendors</p>
            {project.requiredVendors.length === 0 ? (
              <p className="muted">No vendor requirements added yet.</p>
            ) : (
              project.requiredVendors.map((r, i) => {
                const label = r.category === 'other' ? (r.customLabel || 'Other') : getCategoryLabel(r.category);
                return (
                  <div className="required-vendor-row" key={i}>
                    <label className="required-vendor-check">
                      <input
                        type="checkbox"
                        checked={r.fulfilled}
                        disabled={!isOwner}
                        onChange={() => handleToggleFulfilled(i)}
                      />
                      <span className={r.fulfilled ? 'required-vendor-label fulfilled' : 'required-vendor-label'}>
                        {label}
                      </span>
                    </label>
                    {isOwner && canEdit && (
                      <button className="btn-danger-ghost" style={{ width: 'auto', padding: '4px 10px' }} onClick={() => handleRemoveRequiredVendor(i)}>
                        Remove
                      </button>
                    )}
                  </div>
                );
              })
            )}

            {isOwner && canEdit && (
              <div className="required-vendor-add">
                {requiredError && <div className="auth-error" style={{ marginBottom: 'var(--space-3)' }}>{requiredError}</div>}
                <div className="required-vendor-add-row">
                  <select value={newRequiredCategory} onChange={(e) => setNewRequiredCategory(e.target.value)}>
                    <option value="">Select a category…</option>
                    {VENDOR_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  {newRequiredCategory === 'other' && (
                    <input
                      placeholder="Specify vendor type"
                      value={newRequiredCustomLabel}
                      onChange={(e) => setNewRequiredCustomLabel(e.target.value)}
                    />
                  )}
                  <button type="button" className="btn-secondary" onClick={handleAddRequiredVendor}>
                    + Add
                  </button>
                </div>
              </div>
            )}
          </div>

          {isOwner && recommendations.length > 0 && (
            <div className="panel">
              <p className="panel-title">Suggested vendors</p>
              {loadingRecs && <p className="muted">Finding matches…</p>}

              {recommendations.map((slot) => {
                const label = slot.category === 'other' ? (slot.customLabel || 'Other') : getCategoryLabel(slot.category);
                return (
                <div className="recommendation-slot" key={slot.slotIndex}>
                  <p className="recommendation-slot-label">{label}</p>

                  {slot.unsupported ? (
                    <p className="muted" style={{ fontSize: '0.82rem' }}>
                      AI matching isn't available for custom "Other" categories yet — use the vendor picker below instead.
                      </p>
                      ) : slot.vendors.length === 0 ? (
                      <p className="muted" style={{ fontSize: '0.82rem' }}>No strong matches yet.</p>
                    ) : (
                      slot.vendors.map((v) => (
                      <div className="recommendation-row" key={v._id}>
                        <div>
                          <strong>{v.businessName}</strong>
                          <p className="muted" style={{ fontSize: '0.8rem', margin: '2px 0' }}>{v.description}</p>
                          </div>
                          {!alreadyInvitedIds.has(v.userId._id) && (
                            <button className="btn-small btn-accept" onClick={() => handleInvite(v)}>Invite</button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="panel">
            <p className="panel-title">Collaborators</p>
            {project.collaborators.length === 0 ? (
              <p className="muted">No collaborators yet — invite one from the sidebar.</p>
            ) : (
              project.collaborators.map((c) => (
                <div className="collaborator-row" key={c.userId._id}>
                  <div className="collaborator-info">
                    <span className="collaborator-name">
                      <Link to={`/profile/${c.userId._id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {c.userId.name}
                      </Link>
                    </span>
                    <span className="collaborator-category">{c.vendorCategory}</span>
                  </div>
                  <div className="collaborator-statuses">
                    {c.inviteStatus !== 'accepted' ? (
                      <StatusBadge status={c.inviteStatus} />
                    ) : (
                      <StatusBadge status={c.termsStatus} />
                    )}
                  </div>

                  {isOwner && c.inviteStatus === 'requested' && (
                    <div className="btn-row" style={{ marginTop: 'var(--space-2)' }}>
                      <button className="btn-small btn-accept" onClick={() => handleRequestResponse(c.userId._id, true)}>Approve</button>
                      <button className="btn-small btn-decline" onClick={() => handleRequestResponse(c.userId._id, false)}>Decline</button>
                    </div>
                  )}

                  {isOwner && c.inviteStatus === 'accepted' && c.termsStatus !== 'accepted' && (
                    <>
                      {activeTermsTarget === c.userId._id ? (
                        <div className="terms-form">
                          <input placeholder="Price (USD)" value={termsForm.price} onChange={(e) => setTermsForm({ ...termsForm, price: e.target.value })} />
                          <input placeholder="Deliverables" value={termsForm.deliverables} onChange={(e) => setTermsForm({ ...termsForm, deliverables: e.target.value })} />
                          <input type="date" value={termsForm.dateConfirmed} onChange={(e) => setTermsForm({ ...termsForm, dateConfirmed: e.target.value })} />
                          <div className="terms-form-actions">
                            <button className="btn-small btn-accept" onClick={() => handleProposeTerms(c.userId._id)}>Submit terms</button>
                            <button className="btn-small btn-decline" onClick={closeTermsForm}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <button className="btn-secondary" onClick={() => openTermsForm(c.userId._id)}>Propose terms</button>
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

          {isOwner && project.status !== 'locked' && (
            <div className="action-card">
              <p style={{ fontWeight: 600 }}>Open to requests</p>
              <p className="muted" style={{ fontSize: '0.82rem' }}>
                When on, vendors can find this event and request to join.
              </p>
              <button className="btn-secondary" onClick={handleToggleOpen}>
                {project.openToRequests ? 'Turn off' : 'Turn on'}
              </button>
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