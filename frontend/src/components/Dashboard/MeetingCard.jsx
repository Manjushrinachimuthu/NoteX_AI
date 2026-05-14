const MeetingCard = ({ meeting, onJoin, onViewNotes, onDelete, onMarkComplete }) => {
  const formatDate = (date) => {
    if (!date) return 'No schedule set'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const statusLabel = meeting.status?.charAt(0).toUpperCase() + meeting.status?.slice(1)
  const isCompleted = meeting.status === 'completed'

  return (
    <div className="meeting-card">
      <div className="meeting-card-header">
        <h3>{meeting.title}</h3>
        <span className={`meeting-status-badge ${meeting.status}`}>
          {statusLabel}
        </span>
      </div>

      <p className="meta">
        🕐 {formatDate(meeting.scheduledTime || meeting.createdAt)}
      </p>

      <div className="actions">
        <button className="primary" onClick={onJoin}>
          Join
        </button>
        <button className="secondary" onClick={onViewNotes}>
          Notes
        </button>
        {!isCompleted && (
          <button
            className="secondary"
            onClick={onMarkComplete}
            title="Mark as completed"
            style={{ color: '#34d399', borderColor: 'rgba(52,211,153,0.3)' }}
          >
            ✓ Done
          </button>
        )}
        <button className="danger" onClick={onDelete}>
          Delete
        </button>
      </div>
    </div>
  )
}

export default MeetingCard
