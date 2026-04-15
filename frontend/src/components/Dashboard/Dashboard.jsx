import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'
import MeetingCard from './MeetingCard'
import CreateMeetingModal from './CreateMeetingModal'

const Dashboard = () => {
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    loadMeetings()
  }, [])

  const loadMeetings = async () => {
    try {
      const data = await api.getMeetings()
      setMeetings(data)
    } catch (error) {
      console.error('Failed to load meetings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMeeting = async (title, scheduledTime) => {
    try {
      const meeting = await api.createMeeting(title, scheduledTime)
      navigate(`/meeting/${meeting._id}`)
    } catch (error) {
      console.error('Failed to create meeting:', error)
    }
  }

  const handleDeleteMeeting = async (id) => {
    try {
      await api.deleteMeeting(id)
      setMeetings(meetings.filter(m => m._id !== id))
    } catch (error) {
      console.error('Failed to delete meeting:', error)
    }
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>NoteX AI</h1>
        <div className="user-info">
          <span>{user?.name}</span>
          <button className="secondary" onClick={logout}>Logout</button>
        </div>
      </header>

      <div className="dashboard-content">
        <h2>Your Meetings</h2>

        {loading ? (
          <div className="loading-screen" style={{ background: 'transparent' }}>
            <div className="loader"></div>
          </div>
        ) : meetings.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', marginTop: '2rem' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              No meetings yet. Create your first meeting to get started!
            </p>
            <button className="primary" onClick={() => setShowModal(true)}>
              Create Meeting
            </button>
          </div>
        ) : (
          <div className="meetings-grid">
            {meetings.map(meeting => (
              <MeetingCard
                key={meeting._id}
                meeting={meeting}
                onJoin={() => navigate(`/meeting/${meeting._id}`)}
                onViewNotes={() => navigate(`/notes/${meeting._id}`)}
                onDelete={() => handleDeleteMeeting(meeting._id)}
              />
            ))}
          </div>
        )}

        <button
          className="create-meeting-btn"
          onClick={() => setShowModal(true)}
          title="Create Meeting"
        >
          +
        </button>

        {showModal && (
          <CreateMeetingModal
            onClose={() => setShowModal(false)}
            onCreate={handleCreateMeeting}
          />
        )}
      </div>
    </div>
  )
}

export default Dashboard