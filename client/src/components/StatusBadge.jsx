import '../styles/components-styles/StatusBadge.css';

const STATUS_CONFIG = {
  draft: { label: 'Draft', tone: 'neutral' },
  building: { label: 'Building', tone: 'neutral' },
  pending_approval: { label: 'Pending approval', tone: 'brass' },
  locked: { label: 'Locked', tone: 'moss' },
  in_progress: { label: 'In progress', tone: 'indigo' },
  completed: { label: 'Completed', tone: 'moss' },
  cancelled: { label: 'Cancelled', tone: 'brick' },
  pending: { label: 'Pending', tone: 'brass' },
  requested: { label: 'Requested', tone: 'brass' },
  accepted: { label: 'Accepted', tone: 'moss' },
  declined: { label: 'Declined', tone: 'brick' },
  left: { label: 'Left', tone: 'neutral' },
  removed: { label: 'Removed', tone: 'neutral' },
  not_submitted: { label: 'Not submitted', tone: 'neutral' },
  rejected: { label: 'Rejected', tone: 'brick' },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, tone: 'neutral' };
  return <span className={`status-badge status-${config.tone}`}>{config.label}</span>;
}