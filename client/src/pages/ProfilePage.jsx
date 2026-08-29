import { useEffect, useState } from 'react';
import { getCurrentUser } from '../api/auth';
import { updateMyProfile } from '../api/users';
import { getMyVendorProfile, updateVendorProfile } from '../api/vendors';
import { useAuthStore } from '../store/authStore';
import AppShell from '../components/AppShell';
import '../styles/pages-styles/ProfilePage.css';

export default function ProfilePage() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const token = useAuthStore((state) => state.token);

  const [form, setForm] = useState({ name: '', organizationName: '' });
  const [customFields, setCustomFields] = useState([]);
  const [vendorForm, setVendorForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const meRes = await getCurrentUser();
        setForm({
          name: meRes.data.name || '',
          organizationName: meRes.data.organizationName || ''
        });
        setCustomFields(meRes.data.customFields?.length ? meRes.data.customFields : []);

        if (meRes.data.roles.includes('vendor')) {
          const vendorRes = await getMyVendorProfile();
          const v = vendorRes.data;
          setVendorForm({
            _id: v._id,
            category: v.category,
            customCategoryLabel: v.customCategoryLabel || '',
            businessName: v.businessName || '',
            description: v.description || '',
            location: v.location || '',
            priceType: v.pricing?.priceType || 'fixed',
            fixedAmount: v.pricing?.fixedAmount ?? '',
            negotiableOpen: v.pricing?.negotiableOpen || false,
            negotiableMin: v.pricing?.negotiableMin ?? '',
            negotiableMax: v.pricing?.negotiableMax ?? ''
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleFieldChange = (index, key, value) => {
    setCustomFields((prev) => prev.map((f, i) => (i === index ? { ...f, [key]: value } : f)));
  };

  const addCustomField = () => {
    if (customFields.length >= 10) return;
    setCustomFields((prev) => [...prev, { label: '', value: '' }]);
  };

  const removeCustomField = (index) => {
    setCustomFields((prev) => prev.filter((_, i) => i !== index));
  };

  const isOther = vendorForm?.category === 'other';

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const res = await updateMyProfile({
        name: form.name,
        organizationName: form.organizationName,
        customFields
      });
      setAuth(res.data, token);

      if (vendorForm) {
        const payload = {
          description: vendorForm.description,
          location: vendorForm.location
        };

        if (isOther) {
          payload.customCategoryLabel = vendorForm.customCategoryLabel;
        } else {
          payload.businessName = vendorForm.businessName;
          payload.priceType = vendorForm.priceType;
          if (vendorForm.priceType === 'fixed') {
            payload.fixedAmount = vendorForm.fixedAmount;
          } else {
            payload.negotiableOpen = vendorForm.negotiableOpen;
            if (!vendorForm.negotiableOpen) {
              payload.negotiableMin = vendorForm.negotiableMin;
              payload.negotiableMax = vendorForm.negotiableMax;
            }
          }
        }

        await updateVendorProfile(vendorForm._id, payload);
      }

      setMessage('Profile updated.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AppShell><p className="muted">Loading profile…</p></AppShell>;

  return (
    <AppShell>
      <div className="page-header">
        <div>
          <p className="page-eyebrow">Your account</p>
          <h1 className="page-title">Profile</h1>
        </div>
      </div>

      <form onSubmit={handleSave} className="profile-form">
        {message && <div className="profile-message">{message}</div>}

        <div className="panel">
          <p className="panel-title">Basic info</p>
          <label className="field">
            <span className="field-label">Name</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label className="field">
            <span className="field-label">Business or organization name (optional)</span>
            <input
              value={form.organizationName}
              onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
              placeholder="e.g. Amara Events Co."
            />
          </label>
        </div>

        {vendorForm && (
          <div className="panel">
            <p className="panel-title">Vendor details</p>

            {isOther ? (
              <label className="field">
                <span className="field-label">Your vendor type</span>
                <input
                  value={vendorForm.customCategoryLabel}
                  onChange={(e) => setVendorForm({ ...vendorForm, customCategoryLabel: e.target.value })}
                  required
                />
              </label>
            ) : (
              <label className="field">
                <span className="field-label">Business name</span>
                <input
                  value={vendorForm.businessName}
                  onChange={(e) => setVendorForm({ ...vendorForm, businessName: e.target.value })}
                  required
                />
              </label>
            )}

            <label className="field">
              <span className="field-label">Description</span>
              <textarea
                value={vendorForm.description}
                onChange={(e) => setVendorForm({ ...vendorForm, description: e.target.value })}
                rows={3}
                required
              />
            </label>

            <label className="field">
              <span className="field-label">Location</span>
              <input
                value={vendorForm.location}
                onChange={(e) => setVendorForm({ ...vendorForm, location: e.target.value })}
              />
            </label>

            {!isOther && (
              <>
                <div className="rate-toggle">
                  <button
                    type="button"
                    className={vendorForm.priceType === 'fixed' ? 'rate-toggle-btn active' : 'rate-toggle-btn'}
                    onClick={() => setVendorForm({ ...vendorForm, priceType: 'fixed' })}
                  >
                    Fixed price
                  </button>
                  <button
                    type="button"
                    className={vendorForm.priceType === 'negotiable' ? 'rate-toggle-btn active' : 'rate-toggle-btn'}
                    onClick={() => setVendorForm({ ...vendorForm, priceType: 'negotiable' })}
                  >
                    Negotiable
                  </button>
                </div>

                {vendorForm.priceType === 'fixed' && (
                  <label className="field" style={{ marginTop: 'var(--space-4)' }}>
                    <span className="field-label">Amount ($)</span>
                    <input
                      type="number"
                      value={vendorForm.fixedAmount}
                      onChange={(e) => setVendorForm({ ...vendorForm, fixedAmount: e.target.value })}
                    />
                  </label>
                )}

                {vendorForm.priceType === 'negotiable' && (
                  <div style={{ marginTop: 'var(--space-4)' }}>
                    <div className="rate-toggle">
                      <button
                        type="button"
                        className={!vendorForm.negotiableOpen ? 'rate-toggle-btn active' : 'rate-toggle-btn'}
                        onClick={() => setVendorForm({ ...vendorForm, negotiableOpen: false })}
                      >
                        Set a price range
                      </button>
                      <button
                        type="button"
                        className={vendorForm.negotiableOpen ? 'rate-toggle-btn active' : 'rate-toggle-btn'}
                        onClick={() => setVendorForm({ ...vendorForm, negotiableOpen: true })}
                      >
                        Open to any offer
                      </button>
                    </div>

                    {!vendorForm.negotiableOpen && (
                      <div className="field-row" style={{ marginTop: 'var(--space-4)' }}>
                        <label className="field">
                          <span className="field-label">Minimum ($)</span>
                          <input
                            type="number"
                            value={vendorForm.negotiableMin}
                            onChange={(e) => setVendorForm({ ...vendorForm, negotiableMin: e.target.value })}
                          />
                        </label>
                        <label className="field">
                          <span className="field-label">Maximum ($)</span>
                          <input
                            type="number"
                            value={vendorForm.negotiableMax}
                            onChange={(e) => setVendorForm({ ...vendorForm, negotiableMax: e.target.value })}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <div className="panel">
          <p className="panel-title">Additional details</p>
          <p className="muted" style={{ marginBottom: 'var(--space-4)' }}>
            Add anything else you'd like other people on the platform to see about you.
          </p>

          {customFields.map((f, i) => (
            <div className="custom-field-row" key={i}>
              <input
                placeholder="Label (e.g. Years of experience)"
                value={f.label}
                onChange={(e) => handleFieldChange(i, 'label', e.target.value)}
              />
              <input
                placeholder="Value (e.g. 8 years)"
                value={f.value}
                onChange={(e) => handleFieldChange(i, 'value', e.target.value)}
              />
              <button type="button" className="btn-danger-ghost" onClick={() => removeCustomField(i)}>
                Remove
              </button>
            </div>
          ))}

          {customFields.length < 10 && (
            <button type="button" className="btn-secondary" onClick={addCustomField}>
              + Add a field
            </button>
          )}
        </div>

        <button type="submit" className="btn-primary" disabled={saving} style={{ width: 'auto', padding: '12px 28px' }}>
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </form>
    </AppShell>
  );
}