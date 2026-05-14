import { useState } from 'react'

const CreateMeetingModal = ({ onClose, onCreate }) => {
  const [title, setTitle] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onCreate(title, scheduledTime || null)
    } catch (err) {
      setError(err.message || 'Failed to create meeting')
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Create New Meeting</h2>
        <p className="modal-subtitle">Set a title and optionally schedule it</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Meeting Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Weekly Standup"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Scheduled Time (Optional)</label>
            <input
              type="datetime-local"
              value={scheduledTime}
              onChange={e => setScheduledTime(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="primary" disabled={loading}>
              {loading ? 'Creating…' : 'Create Meeting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateMeetingModal
