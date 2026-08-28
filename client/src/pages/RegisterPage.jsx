import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import AuthLayout from '../components/AuthLayout';
import '../styles/pages-styles/AuthForm.css';

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    isVendor: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const roles = form.isVendor ? ['planner', 'vendor'] : ['planner'];
      const res = await registerUser({
        name: form.name,
        email: form.email,
        password: form.password,
        roles
      });

      setAuth(res.data.user, res.data.token);
      navigate(form.isVendor ? '/vendor/setup' : '/events');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout tagline="One plan. Every party. One signature.">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2 className="auth-form-title">Create your account</h2>
        <p className="auth-form-subtitle">Plan an event, or offer your services to planners.</p>

        {error && <div className="auth-error" role="alert">{error}</div>}

        <label className="field">
          <span className="field-label">Name</span>
          <input name="name" value={form.name} onChange={handleChange} required autoComplete="name" />
        </label>

        <label className="field">
          <span className="field-label">Email</span>
          <input type="email" name="email" value={form.email} onChange={handleChange} required autoComplete="email" />
        </label>

        <label className="field">
          <span className="field-label">Password</span>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            minLength={6}
            autoComplete="new-password"
          />
        </label>

        <label className="field-checkbox">
          <input type="checkbox" name="isVendor" checked={form.isVendor} onChange={handleChange} />
          <span>I also offer services as a vendor — venue, photography, catering, and similar</span>
        </label>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}