import '../styles/components-styles/LockSeal.css';

export default function LockSeal({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="lock-seal" role="img" aria-label="Locked">
      <circle cx="50" cy="50" r="46" fill="none" stroke="var(--brass)" strokeWidth="3" />
      <path
        d="M50 28 L58 44 L76 46 L63 58 L67 76 L50 66 L33 76 L37 58 L24 46 L42 44 Z"
        fill="var(--brass)"
      />
    </svg>
  );
}