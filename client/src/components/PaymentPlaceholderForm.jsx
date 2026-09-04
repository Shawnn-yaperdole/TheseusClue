import { useState } from 'react';

export default function PaymentPlaceholderForm({ amount, onSubmit, submitting, error }) {
  const [form, setForm] = useState({ cardNumber: '', expiry: '', cvc: '', nameOnCard: '' });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <p className="muted" style={{ fontSize: '0.8rem', marginBottom: 'var(--space-3)' }}>
        Placeholder payment form — no real charge is made, and card details are never stored.
      </p>
      {error && <div className="auth-error">{error}</div>}

      <label className="field">
        <span className="field-label">Name on card</span>
        <input name="nameOnCard" value={form.nameOnCard} onChange={handleChange} required />
      </label>

      <label className="field">
        <span className="field-label">Card number</span>
        <input name="cardNumber" value={form.cardNumber} onChange={handleChange} placeholder="4242 4242 4242 4242" required />
      </label>

      <div className="field-row">
        <label className="field">
          <span className="field-label">Expiry (MM/YY)</span>
          <input name="expiry" value={form.expiry} onChange={handleChange} placeholder="MM/YY" required />
        </label>
        <label className="field">
          <span className="field-label">CVC</span>
          <input name="cvc" value={form.cvc} onChange={handleChange} placeholder="123" required />
        </label>
      </div>

      <button type="submit" className="btn-primary" disabled={submitting} style={{ width: '100%', marginTop: 'var(--space-3)' }}>
        {submitting ? 'Processing…' : `Pay $${amount} & lock event`}
      </button>
    </form>
  );
}