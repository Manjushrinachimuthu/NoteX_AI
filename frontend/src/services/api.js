const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const getToken = () => localStorage.getItem('token')

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`
})

export const api = {
  async login(email, password) {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Login failed')
    return data
  },

  async register(name, email, password) {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Registration failed')
    return data
  },

  async getMeetings() {
    const res = await fetch(`${API_URL}/api/meetings`, {
      headers: getHeaders()
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    return data
  },

  async createMeeting(title, scheduledTime) {
    const res = await fetch(`${API_URL}/api/meetings`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ title, scheduledTime })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    return data
  },

  async getMeeting(id) {
    const res = await fetch(`${API_URL}/api/meetings/${id}`, {
      headers: getHeaders()
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    return data
  },

  async deleteMeeting(id) {
    const res = await fetch(`${API_URL}/api/meetings/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    return data
  },

  async joinMeeting(id) {
    const res = await fetch(`${API_URL}/api/meetings/${id}/join`, {
      method: 'POST',
      headers: getHeaders()
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    return data
  },

  async getNotes(meetingId) {
    const res = await fetch(`${API_URL}/api/notes/${meetingId}`, {
      headers: getHeaders()
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    return data
  },

  async saveTranscript(meetingId, transcript) {
    const res = await fetch(`${API_URL}/api/notes/${meetingId}/transcript`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ transcript })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    return data
  },

  async getSummary(meetingId) {
    const res = await fetch(`${API_URL}/api/notes/${meetingId}/summary`, {
      method: 'POST',
      headers: getHeaders()
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    return data
  },

  async translateNotes(meetingId, targetLanguage) {
    const res = await fetch(`${API_URL}/api/notes/${meetingId}/translate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ targetLanguage })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    return data
  },

  async chatWithNotes(meetingId, question) {
    const res = await fetch(`${API_URL}/api/notes/${meetingId}/chatbot`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ question })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    return data
  },

  async updateProfile(data) {
    const res = await fetch(`${API_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    })
    const response = await res.json()
    if (!res.ok) throw new Error(response.message)
    return response
  }
}