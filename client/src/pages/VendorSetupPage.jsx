import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createVendorProfile } from '../api/vendors';

export default function VendorSetupPage() {
  const [form, setForm] = useState({
    category: 'venue',
    businessName: '',
    description: '',
    location: '',
    priceMin: '',
    priceMax: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await createVendorProfile({
        category: form.category,
        businessName: form.businessName,
        description: form.description,
        location: form.location,
        priceRange: {
          min: Number(form.priceMin) || 0,
          max: Number(form.priceMax) || 0
        }
      });
      navigate('/events');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create vendor profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '0 auto' }}>
      <h1>Complete Your Vendor Profile</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Category</label>
          <select name="category" value={form.category} onChange={handleChange}>
            <option value="venue">Venue</option>
            <option value="photographer">Photographer</option>
            <option value="caterer">Caterer</option>
            <option value="decorator">Decorator</option>
            <option value="entertainment">Entertainment</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label>Business Name</label>
          <input name="businessName" value={form.businessName} onChange={handleChange} required />
        </div>
        <div>
          <label>Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} />
        </div>
        <div>
          <label>Location</label>
          <input name="location" value={form.location} onChange={handleChange} />
        </div>
        <div>
          <label>Price Range Min</label>
          <input type="number" name="priceMin" value={form.priceMin} onChange={handleChange} />
        </div>
        <div>
          <label>Price Range Max</label>
          <input type="number" name="priceMax" value={form.priceMax} onChange={handleChange} />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}