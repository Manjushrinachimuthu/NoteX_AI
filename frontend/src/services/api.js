const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const getToken = () => localStorage.getItem('token')

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`
})

// On 401 → clear stale session and redirect to login
const guard = async (res) => {
  if (res.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
    throw new Error('Session expired. Please log in again.')
  }
  return res
}

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
    const res = await guard(await fetch(`${API_URL}/api/meetings`, { headers: getHeaders() }))
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    return data
  },

  async createMeeting(title, scheduledTime) {
    const res = await guard(await fetch(`${API_URL}/api/meetings`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ title, scheduledTime })
    }))
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    return data
  },

  async getMeeting(id) {
    const res = await guard(await fetch(`${API_URL}/api/meetings/${id}`, { headers: getHeaders() }))
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    return data
  },

  async deleteMeeting(id) {
    const res = await guard(await fetch(`${API_URL}/api/meetings/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    }))
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    return data
  },

  async joinMeeting(id) {
    const res = await guard(await fetch(`${API_URL}/api/meetings/${id}/join`, {
      method: 'POST',
      headers: getHeaders()
    }))
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    return data
  },

  async getNotes(meetingId) {
    const res = await guard(await fetch(`${API_URL}/api/notes/${meetingId}`, { headers: getHeaders() }))
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    return data
  },

  async saveTranscript(meetingId, transcript) {
    const res = await guard(await fetch(`${API_URL}/api/notes/${meetingId}/transcript`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ transcript })
    }))
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    return data
  },

  async getSummary(meetingId) {
    const res = await guard(await fetch(`${API_URL}/api/notes/${meetingId}/summary`, {
      method: 'POST',
      headers: getHeaders()
    }))
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    return data
  },

  async translateNotes(meetingId, targetLanguage) {
    const res = await guard(await fetch(`${API_URL}/api/notes/${meetingId}/translate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ targetLanguage })
    }))
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    // Returns { entries: [{speaker, text, timestamp}...], language }
    return data
  },

  async chatWithNotes(meetingId, question) {
    const res = await guard(await fetch(`${API_URL}/api/notes/${meetingId}/chatbot`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ question })
    }))
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    return data
  },

  async uploadVideo(file, title, language) {
    const formData = new FormData()
    formData.append('video', file)
    formData.append('title', title)
    formData.append('language', language)
    const res = await guard(await fetch(`${API_URL}/api/meetings/upload-video`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getToken()}` },
      body: formData
    }))
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    return data
  },

  async processVideo(meetingId, language) {
    const res = await guard(await fetch(`${API_URL}/api/meetings/process-video/${meetingId}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ language })
    }))
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    return data
  },

  async updateProfile(data) {
    const res = await guard(await fetch(`${API_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    }))
    const response = await res.json()
    if (!res.ok) throw new Error(response.message)
    return response
  }
}
