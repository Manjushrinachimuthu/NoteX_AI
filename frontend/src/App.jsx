import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './components/Auth/Login'
import Register from './components/Auth/Register'
import Dashboard from './components/Dashboard/Dashboard'
import MeetingRoom from './components/Meeting/MeetingRoom'
import NotesViewer from './components/Notes/NotesViewer'
import './App.css'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <p>Loading NoteX AI...</p>
      </div>
    )
  }

  return (
    <div className="app">
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/meeting/:meetingId" element={user ? <MeetingRoom /> : <Navigate to="/login" />} />
        <Route path="/notes/:meetingId" element={user ? <NotesViewer /> : <Navigate to="/login" />} />
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      </Routes>
    </div>
  )
}

export default App