import { useNavigate } from 'react-router-dom';
import '../styles/components-styles/BackButton.css';

export default function BackButton({ fallback = '/events', label = 'Back' }) {
  const navigate = useNavigate();

  const handleClick = () => {
    // If there's actual browser history from within this app, go back to it.
    // Otherwise (direct link, refresh, new tab), fall back to a sensible default route.
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  };

  return (
    <button className="back-button" onClick={handleClick} aria-label={label}>
      <span className="back-button-arrow">←</span>
      {label}
    </button>
  );
}