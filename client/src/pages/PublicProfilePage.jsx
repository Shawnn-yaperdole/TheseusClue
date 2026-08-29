import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getUserProfile } from '../api/users';
import { getCategoryLabel } from '../constants/vendorCategories';
import AppShell from '../components/AppShell';
import BackButton from '../components/BackButton';
import '../styles/pages-styles/ProfilePage.css';

const formatPrice = (vendorProfile) => {
  if (vendorProfile.category === 'other') return null;
  const p = vendorProfile.pricing;
  if (!p) return null;
  if (p.priceType === 'fixed') return `$${p.fixedAmount?.toLocaleString() || 0}`;
  if (p.negotiableOpen) return 'Open to offers';
  return `$${p.negotiableMin?.toLocaleString() || 0}–$${p.negotiableMax?.toLocaleString() || 0} (negotiable)`;
};

export default function PublicProfilePage() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getUserProfile(id);
        setProfile(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <AppShell><p className="muted">Loading profile…</p></AppShell>;
  if (!profile) return <AppShell><p className="muted">Profile not found.</p></AppShell>;

  const vp = profile.vendorProfile;
  const categoryLabel = vp ? (vp.category === 'other' ? (vp.customCategoryLabel || 'Other') : getCategoryLabel(vp.category)) : null;

  return (
    <AppShell>
      <BackButton fallback="/events" label="Back" />
      <div className="page-header">
        <div>
          <p className="page-eyebrow">{profile.roles.join(' & ')}</p>
          <h1 className="page-title">{profile.organizationName || profile.name}</h1>
          {profile.organizationName && <p className="muted">{profile.name}</p>}
        </div>
      </div>

      {vp && (
        <div className="panel">
          <p className="panel-title">Vendor details</p>
          <p><strong>{vp.businessName || profile.name}</strong> — {categoryLabel}</p>
          {vp.description && <p className="muted">{vp.description}</p>}
          <p className="muted">{vp.location || 'Location not specified'}</p>
          {formatPrice(vp) && (
            <p className="budget-figure" style={{ fontSize: '1.1rem' }}>{formatPrice(vp)}</p>
          )}
        </div>
      )}

      {profile.customFields?.length > 0 && (
        <div className="panel">
          <p className="panel-title">Additional details</p>
          {profile.customFields.map((f, i) => (
            <div className="custom-field-display" key={i}>
              <span className="custom-field-label">{f.label}</span>
              <span className="custom-field-value">{f.value}</span>
            </div>
          ))}
        </div>
      )}

      {!vp && !profile.customFields?.length && (
        <p className="muted">No additional details shared yet.</p>
      )}
    </AppShell>
  );
}