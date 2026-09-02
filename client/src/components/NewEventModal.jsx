import { useState } from 'react';
import { createProject } from '../api/projects';
import '../styles/components-styles/NewEventModal.css';

export default function NewEventModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    budgetTotal: ''
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Please enter a title.');
      return;
    }
    setSaving(true);
    setError('');

    try {
      await createProject({
        title: form.title,
        description: form.description,
        budget: { total: Number(form.budgetTotal) || 0 }
      });
      onCreated();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create event');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>New event</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && <div className="auth-error">{error}</div>}

          <label className="field">
            <span className="field-label">Event title</span>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Amara & Leo's Wedding"
              required
              autoFocus
            />
          </label>

          <label className="field">
            <span className="field-label">Description (optional)</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
          </label>

          <label className="field">
            <span className="field-label">Budget total ($)</span>
            <input
              type="number"
              min="0"
              value={form.budgetTotal}
              onChange={(e) => setForm({ ...form, budgetTotal: e.target.value })}
            />
          </label>

          <div className="btn-row" style={{ marginTop: 'var(--space-4)' }}>
            <button type="submit" className="btn-primary" disabled={saving} style={{ width: 'auto', padding: '11px 24px' }}>
              {saving ? 'Creating…' : 'Create event'}
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}