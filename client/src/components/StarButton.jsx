import '../styles/components-styles/StarButton.css';

export default function StarButton({ favorited, onClick }) {
  return (
    <button
      className={favorited ? 'star-button favorited' : 'star-button'}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
      aria-pressed={favorited}
    >
      {favorited ? '★' : '☆'}
    </button>
  );
}