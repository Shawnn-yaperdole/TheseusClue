import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getVendors } from '../api/vendors';
import { getOrCreateSingleChat } from '../api/chats';
import AppShell from '../components/AppShell';
import { VENDOR_CATEGORIES, getCategoryLabel } from '../constants/vendorCategories';
import '../styles/pages-styles/MarketPage.css';

const formatPrice = (v) => {
  if (v.category === 'other') return null;
  const p = v.pricing;
  if (!p) return null;
  if (p.priceType === 'fixed') return `$${p.fixedAmount?.toLocaleString() || 0}`;
  if (p.negotiableOpen) return 'Open to offers';
  return `$${p.negotiableMin?.toLocaleString() || 0}–$${p.negotiableMax?.toLocaleString() || 0} (negotiable)`;
};

export default function MarketPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: '', search: '' });
  const navigate = useNavigate();

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.category) params.category = filters.category;
      if (filters.search) params.search = filters.search;
      const res = await getVendors(params);
      setVendors(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchVendors();
  };

  const handleContact = async (vendorUserId) => {
    const res = await getOrCreateSingleChat(vendorUserId);
    navigate(`/chat?chatId=${res.data._id}`);
  };

  return (
    <AppShell>
      <div className="page-header">
        <div>
          <p className="page-eyebrow">Find your team</p>
          <h1 className="page-title">Market</h1>
        </div>
      </div>

      <form className="market-filters" onSubmit={handleSearch}>
        <select name="category" value={filters.category} onChange={handleFilterChange}>
          <option value="">All categories</option>
          {VENDOR_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <input
          name="search"
          placeholder="Search by business name"
          value={filters.search}
          onChange={handleFilterChange}
        />
        <button type="submit" className="btn-secondary">Search</button>
      </form>

      {loading ? (
        <p className="muted">Loading vendors…</p>
      ) : vendors.length === 0 ? (
        <div className="empty-state">
          <p>No vendors match this search.</p>
          <p className="muted">Try a different category or clear the search.</p>
        </div>
      ) : (
        <div className="vendor-grid">
          {vendors.map((v) => {
            const displayName = v.category === 'other' ? v.userId?.name : v.businessName;
            const categoryLabel = v.category === 'other' ? (v.customCategoryLabel || 'Other') : getCategoryLabel(v.category);
            const price = formatPrice(v);

            return (
              <div className="vendor-card" key={v._id}>
                <p className="vendor-card-category">{categoryLabel}</p>
                <h3>{displayName}</h3>
                <p className="vendor-card-location">{v.location || 'Location not specified'}</p>
                {price && <p className="vendor-card-price">{price}</p>}
                <button className="btn-secondary" onClick={() => handleContact(v.userId._id)}>
                  Contact
                </button>
                <Link
                  to={`/profile/${v.userId._id}`}
                  style={{ display: 'block', textAlign: 'center', marginTop: '8px', fontSize: '0.82rem', color: 'var(--indigo)' }}
                >
                  View full profile
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}