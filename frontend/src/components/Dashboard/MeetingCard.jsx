const MeetingCard = ({ meeting, onJoin, onViewNotes, onDelete }) => {
  const formatDate = (date) => {
    if (!date) return 'Not scheduled'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="meeting-card">
      <h3>{meeting.title}</h3>
      <p className="meta">
        Status: {meeting.status} • {formatDate(meeting.scheduledTime)}
      </p>
      <div className="actions">
        <button className="primary" onClick={onJoin}>
          Join
        </button>
        <button className="secondary" onClick={onViewNotes}>
          Notes
        </button>
        <button className="danger" onClick={onDelete}>
          Delete
        </button>
      </div>
    </div>
  )
}

export default MeetingCard