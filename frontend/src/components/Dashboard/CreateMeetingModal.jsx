import { useState } from 'react'

const CreateMeetingModal = ({ onClose, onCreate }) => {
  const [title, setTitle] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await onCreate(title, scheduledTime || null)
    setLoading(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Create New Meeting</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Meeting Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Enter meeting title"
              required
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
            <button type="button" className="secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Meeting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateMeetingModal