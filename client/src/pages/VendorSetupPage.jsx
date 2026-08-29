import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createVendorProfile } from '../api/vendors';
import { VENDOR_CATEGORIES } from '../constants/vendorCategories';
import '../styles/pages-styles/VendorSetupPage.css';

export default function VendorSetupPage() {
  const [category, setCategory] = useState('');
  const [customCategoryLabel, setCustomCategoryLabel] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [priceType, setPriceType] = useState('fixed');
  const [fixedAmount, setFixedAmount] = useState('');
  const [negotiableOpen, setNegotiableOpen] = useState(false);
  const [negotiableMin, setNegotiableMin] = useState('');
  const [negotiableMax, setNegotiableMax] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const isOther = category === 'other';
  const selectedCategory = VENDOR_CATEGORIES.find((c) => c.value === category);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = { category, description, location };

      if (isOther) {
        payload.customCategoryLabel = customCategoryLabel;
      } else {
        payload.businessName = businessName;
        payload.priceType = priceType;
        if (priceType === 'fixed') {
          payload.fixedAmount = fixedAmount;
        } else {
          payload.negotiableOpen = negotiableOpen;
          if (!negotiableOpen) {
            payload.negotiableMin = negotiableMin;
            payload.negotiableMax = negotiableMax;
          }
        }
      }

      await createVendorProfile(payload);
      navigate('/events');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create vendor profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vendor-setup-page">
      <div className="vendor-setup-wrap">
        <p className="page-eyebrow">One more step</p>
        <h1 className="page-title">Set up your vendor profile</h1>
        <p className="muted" style={{ marginBottom: 'var(--space-6)' }}>
          This is what planners will see when they search the Market.
        </p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="vendor-setup-form">
          <div className="panel">
            <label className="field">
              <span className="field-label">What kind of vendor are you?</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)} required>
                <option value="" disabled>Select a category</option>
                {VENDOR_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </label>
            {selectedCategory && (
              <p className="category-hint">{selectedCategory.description}</p>
            )}

            {isOther && (
              <label className="field">
                <span className="field-label">Specify your vendor type</span>
                <input
                  value={customCategoryLabel}
                  onChange={(e) => setCustomCategoryLabel(e.target.value)}
                  placeholder="e.g. Pet chaperone, Fireworks display"
                  required
                />
              </label>
            )}
          </div>

          {!isOther && (
            <div className="panel">
              <p className="panel-title">Business details</p>
              <label className="field">
                <span className="field-label">Business or professional name</span>
                <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
              </label>
              <label className="field">
                <span className="field-label">Location</span>
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Baguio City" />
              </label>
            </div>
          )}

          {isOther && (
            <div className="panel">
              <label className="field">
                <span className="field-label">Location (optional)</span>
                <input value={location} onChange={(e) => setLocation(e.target.value)} />
              </label>
            </div>
          )}

          <div className="panel">
            <p className="panel-title">Description</p>
            <label className="field">
              <span className="field-label">Tell planners about your services</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
              />
            </label>
          </div>

          {!isOther && (
            <div className="panel">
              <p className="panel-title">Rate</p>

              <div className="rate-toggle">
                <button
                  type="button"
                  className={priceType === 'fixed' ? 'rate-toggle-btn active' : 'rate-toggle-btn'}
                  onClick={() => setPriceType('fixed')}
                >
                  Fixed price
                </button>
                <button
                  type="button"
                  className={priceType === 'negotiable' ? 'rate-toggle-btn active' : 'rate-toggle-btn'}
                  onClick={() => setPriceType('negotiable')}
                >
                  Negotiable
                </button>
              </div>

              {priceType === 'fixed' && (
                <label className="field" style={{ marginTop: 'var(--space-4)' }}>
                  <span className="field-label">Amount (USD)</span>
                  <input
                    type="number"
                    min="0"
                    value={fixedAmount}
                    onChange={(e) => setFixedAmount(e.target.value)}
                    required
                  />
                </label>
              )}

              {priceType === 'negotiable' && (
                <div style={{ marginTop: 'var(--space-4)' }}>
                  <div className="rate-toggle">
                    <button
                      type="button"
                      className={!negotiableOpen ? 'rate-toggle-btn active' : 'rate-toggle-btn'}
                      onClick={() => setNegotiableOpen(false)}
                    >
                      Set a price range
                    </button>
                    <button
                      type="button"
                      className={negotiableOpen ? 'rate-toggle-btn active' : 'rate-toggle-btn'}
                      onClick={() => setNegotiableOpen(true)}
                    >
                      Open to any offer
                    </button>
                  </div>

                  {!negotiableOpen && (
                    <div className="field-row" style={{ marginTop: 'var(--space-4)' }}>
                      <label className="field">
                        <span className="field-label">Minimum ($)</span>
                        <input
                          type="number"
                          min="0"
                          value={negotiableMin}
                          onChange={(e) => setNegotiableMin(e.target.value)}
                          required
                        />
                      </label>
                      <label className="field">
                        <span className="field-label">Maximum ($)</span>
                        <input
                          type="number"
                          min="0"
                          value={negotiableMax}
                          onChange={(e) => setNegotiableMax(e.target.value)}
                          required
                        />
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: 'auto', padding: '13px 32px' }}>
            {loading ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </div>
    </div>
  );
}