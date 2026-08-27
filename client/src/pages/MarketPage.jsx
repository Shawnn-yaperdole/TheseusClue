import { useEffect, useState } from 'react';
import { getVendors } from '../api/vendors';
import { useNavigate } from 'react-router-dom';
import { getOrCreateSingleChat } from '../api/chats';

export default function MarketPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: '', search: '' });
  const navigate = useNavigate();

  const handleContact = async (vendorUserId) => {
  const res = await getOrCreateSingleChat(vendorUserId);
  navigate(`/chat?chatId=${res.data._id}`);
  };

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

  return (
    <div>
      <h1>Find Vendors</h1>

      <form onSubmit={handleSearch}>
        <select name="category" value={filters.category} onChange={handleFilterChange}>
          <option value="">All Categories</option>
          <option value="venue">Venue</option>
          <option value="photographer">Photographer</option>
          <option value="caterer">Caterer</option>
          <option value="decorator">Decorator</option>
          <option value="entertainment">Entertainment</option>
          <option value="other">Other</option>
        </select>
        <input
          name="search"
          placeholder="Search by business name"
          value={filters.search}
          onChange={handleFilterChange}
        />
        <button type="submit">Search</button>
      </form>

      {loading ? (
        <p>Loading vendors...</p>
      ) : (
        <ul>
          {vendors.map((v) => (
            <li key={v._id}>
              <strong>{v.businessName}</strong> ({v.category}) — {v.location || 'Location not specified'}
              <br />
              Price range: ${v.priceRange?.min || 0} - ${v.priceRange?.max || 0}
              <br />
              <button onClick={() => handleContact(v.userId._id)}>Contact</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}