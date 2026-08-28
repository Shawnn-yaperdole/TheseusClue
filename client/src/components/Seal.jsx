import '../styles/components-styles/Seal.css';

export default function Seal({ size = 56, animated = false }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={animated ? 'seal seal-animated' : 'seal'}
    >
      <circle cx="50" cy="50" r="46" fill="none" stroke="var(--brass)" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="36" fill="none" stroke="var(--brass)" strokeWidth="1" opacity="0.6" />
      <path
        d="M50 28 L58 44 L76 46 L63 58 L67 76 L50 66 L33 76 L37 58 L24 46 L42 44 Z"
        fill="var(--brass)"
      />
    </svg>
  );
}