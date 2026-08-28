import Seal from './Seal';
import '../styles/components-styles/AuthLayout.css';

export default function AuthLayout({ children, tagline }) {
  return (
    <div className="auth-layout">
      <div className="auth-brand">
        <div className="auth-brand-content">
          <Seal size={64} animated />
          <h1 className="auth-brand-title">TheseusClue</h1>
          <p className="auth-brand-tagline">{tagline}</p>
        </div>
        <div className="auth-rings" aria-hidden="true">
          <span className="ring ring-1" />
          <span className="ring ring-2" />
          <span className="ring ring-3" />
        </div>
      </div>
      <div className="auth-form-panel">
        <div className="auth-form-wrap">{children}</div>
      </div>
    </div>
  );
}