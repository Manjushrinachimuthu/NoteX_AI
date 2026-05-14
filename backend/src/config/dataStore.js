const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// ── Persistence helpers ───────────────────────────────────────
const DATA_DIR = path.join(__dirname, '../../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const MEETINGS_FILE = path.join(DATA_DIR, 'meetings.json');
const NOTES_FILE = path.join(DATA_DIR, 'notes.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const loadFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (e) {
    console.warn(`Could not load ${filePath}:`, e.message);
  }
  return {};
};

const saveFile = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.warn(`Could not save ${filePath}:`, e.message);
  }
};

// ── In-memory Maps (seeded from disk) ────────────────────────
const generateId = () => String(Date.now()) + Math.random().toString(36).substr(2, 9);

// Load persisted data into Maps
const usersObj = loadFile(USERS_FILE);
const meetingsObj = loadFile(MEETINGS_FILE);
const notesObj = loadFile(NOTES_FILE);

const users = new Map(Object.entries(usersObj));     // key: email
const meetings = new Map(Object.entries(meetingsObj)); // key: _id
const notes = new Map(Object.entries(notesObj));       // key: _id

const persistUsers = () => saveFile(USERS_FILE, Object.fromEntries(users));
const persistMeetings = () => saveFile(MEETINGS_FILE, Object.fromEntries(meetings));
const persistNotes = () => saveFile(NOTES_FILE, Object.fromEntries(notes));

// ── User store ────────────────────────────────────────────────
const userDataStore = {
  create: async (userData) => {
    const _id = generateId();
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = {
      _id,
      email: userData.email,
      password: hashedPassword,
      name: userData.name,
      preferredLanguage: userData.preferredLanguage || 'en',
      avatar: userData.avatar || null,
      createdAt: new Date().toISOString()
    };
    users.set(userData.email, user);
    persistUsers();
    return user;
  },

  findByEmail: (email) => users.get(email) || null,

  findById: (_id) => {
    for (const user of users.values()) {
      if (user._id === _id) return user;
    }
    return null;
  },

  findAll: () => Array.from(users.values()),

  update: (_id, updates) => {
    for (const user of users.values()) {
      if (user._id === _id) {
        const updated = { ...user, ...updates };
        users.set(user.email, updated);
        persistUsers();
        return updated;
      }
    }
    return null;
  },

  delete: (_id) => {
    for (const [email, user] of users.entries()) {
      if (user._id === _id) {
        users.delete(email);
        persistUsers();
        return true;
      }
    }
    return false;
  },

  comparePassword: async (user, password) => bcrypt.compare(password, user.password)
};

// ── Meeting store ─────────────────────────────────────────────
const meetingDataStore = {
  create: (meetingData) => {
    const _id = generateId();
    const meeting = {
      _id,
      title: meetingData.title,
      hostId: meetingData.hostId,
      participants: meetingData.participants || [],
      roomId: meetingData.roomId || uuidv4(),
      scheduledTime: meetingData.scheduledTime || null,
      status: meetingData.status || 'scheduled',
      meetingType: meetingData.meetingType || 'live',
      videoUrl: meetingData.videoUrl || null,
      duration: meetingData.duration || 0,
      createdAt: new Date().toISOString()
    };
    meetings.set(_id, meeting);
    persistMeetings();
    return meeting;
  },

  findById: (_id) => meetings.get(_id) || null,

  findByRoomId: (roomId) => {
    for (const meeting of meetings.values()) {
      if (meeting.roomId === roomId) return meeting;
    }
    return null;
  },

  findByHostId: (hostId) => {
    const result = [];
    for (const meeting of meetings.values()) {
      if (meeting.hostId === hostId) result.push(meeting);
    }
    return result;
  },

  findAll: () => Array.from(meetings.values()),

  update: (_id, updates) => {
    const meeting = meetings.get(_id);
    if (!meeting) return null;
    const updated = { ...meeting, ...updates };
    meetings.set(_id, updated);
    persistMeetings();
    return updated;
  },

  delete: (_id) => {
    const existed = meetings.has(_id);
    meetings.delete(_id);
    if (existed) persistMeetings();
    return existed;
  }
};

// ── Note store ────────────────────────────────────────────────
const noteDataStore = {
  create: (noteData) => {
    const _id = generateId();
    const note = {
      _id,
      meetingId: noteData.meetingId,
      transcript: noteData.transcript || [],
      summary: noteData.summary || {},
      translations: noteData.translations || {},
      generatedSummary: noteData.generatedSummary || null,
      createdAt: new Date().toISOString()
    };
    notes.set(_id, note);
    persistNotes();
    return note;
  },

  findById: (_id) => notes.get(_id) || null,

  findByMeetingId: (meetingId) => {
    const result = [];
    for (const note of notes.values()) {
      if (note.meetingId === meetingId) result.push(note);
    }
    return result;
  },

  findAll: () => Array.from(notes.values()),

  update: (_id, updates) => {
    const note = notes.get(_id);
    if (!note) return null;
    const updated = { ...note, ...updates };
    notes.set(_id, updated);
    persistNotes();
    return updated;
  },

  delete: (_id) => {
    const existed = notes.has(_id);
    notes.delete(_id);
    if (existed) persistNotes();
    return existed;
  }
};

module.exports = {
  users: userDataStore,
  meetings: meetingDataStore,
  notes: noteDataStore,
  generateId,
  generateRoomId: uuidv4,
  usersMap: users,
  persistUsers,
  bcrypt
};
