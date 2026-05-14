const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const { notes, meetings, usersMap } = require('../config/dataStore');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ── Multer setup ──────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['video/mp4', 'video/mpeg', 'video/webm', 'video/ogg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only video files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 500 * 1024 * 1024 }
});

// ── Helpers ───────────────────────────────────────────────────
const getUserById = (id) => {
  for (const u of usersMap.values()) {
    if (u._id === id) return u;
  }
  return null;
};

const populateUser = (userId) => {
  if (!userId) return null;
  const user = getUserById(userId);
  if (!user) return { _id: userId };
  return { _id: user._id, name: user.name, email: user.email, avatar: user.avatar || null };
};

const populateMeeting = (meeting) => {
  if (!meeting) return null;
  return {
    ...meeting,
    hostId: populateUser(meeting.hostId),
    participants: (meeting.participants || []).map(p => populateUser(p))
  };
};

// ── POST / — create meeting ───────────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const { title, scheduledTime } = req.body;

    const meeting = meetings.create({
      title: title || 'New Meeting',
      hostId: req.user._id,
      participants: [req.user._id],
      scheduledTime: scheduledTime || null,
      status: 'scheduled'
    });

    notes.create({
      meetingId: meeting._id,
      transcript: [],
      summary: {}
    });

    res.status(201).json(populateMeeting(meeting));
  } catch (error) {
    console.error('Create meeting error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── POST /upload-video ────────────────────────────────────────
router.post('/upload-video', protect, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }

    const { title, language } = req.body;
    const videoUrl = `/uploads/${req.file.filename}`;

    const meeting = meetings.create({
      title: title || 'Uploaded Video',
      hostId: req.user._id,
      participants: [req.user._id],
      scheduledTime: null,
      status: 'completed',
      meetingType: 'uploaded',
      videoUrl,
      duration: 0
    });

    notes.create({
      meetingId: meeting._id,
      transcript: [],
      summary: {},
      language: language || 'en'
    });

    res.status(201).json(populateMeeting(meeting));
  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({ message: 'Failed to upload video' });
  }
});

// ── POST /process-video/:meetingId ────────────────────────────
router.post('/process-video/:meetingId', protect, async (req, res) => {
  try {
    const { language } = req.body;
    const meeting = meetings.findById(req.params.meetingId);

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    if (meeting.hostId !== req.user._id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!meeting.videoUrl) {
      return res.status(400).json({ message: 'No video associated with this meeting' });
    }

    const note = notes.findByMeetingId(req.params.meetingId)[0];
    if (!note) {
      return res.status(404).json({ message: 'Notes not found' });
    }

    // Read the video file from disk and send to AI service
    const videoPath = path.join(__dirname, '../../', meeting.videoUrl);
    
    if (!require('fs').existsSync(videoPath)) {
      return res.status(404).json({ message: 'Video file not found on server' });
    }

    const FormData = require('form-data');
    const fs = require('fs');
    const formData = new FormData();
    formData.append('audio', fs.createReadStream(videoPath), {
      filename: path.basename(videoPath),
      contentType: 'video/mp4'
    });

    const response = await axios.post(
      `${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/transcribe`,
      formData,
      {
        headers: formData.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 300000 // 5 minutes
      }
    );

    if (response.data && response.data.text) {
      // Split transcript into entries (simple approach: by sentences)
      const text = response.data.text.trim();
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      
      const transcriptData = sentences.map((sentence, i) => ({
        speaker: 'Speaker',
        text: sentence.trim(),
        timestamp: new Date(),
        language: language || 'en'
      }));
      
      notes.update(note._id, { transcript: transcriptData });
    }

    res.json({ message: 'Video processed successfully', noteId: note._id });
  } catch (error) {
    console.error('Video processing error:', error.message);
    res.status(500).json({ message: 'Failed to process video: ' + error.message });
  }
});

// ── GET / — list meetings ─────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const allMeetings = meetings.findAll()
      .filter(m =>
        m.hostId === req.user._id ||
        (m.participants || []).includes(req.user._id)
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(allMeetings.map(populateMeeting));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── GET /:id ──────────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const meeting = meetings.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    res.json(populateMeeting(meeting));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── PUT /:id ──────────────────────────────────────────────────
router.put('/:id', protect, async (req, res) => {
  try {
    const meeting = meetings.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    if (meeting.hostId !== req.user._id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updates = {};
    if (req.body.title) updates.title = req.body.title;
    if (req.body.status) updates.status = req.body.status;
    if (req.body.scheduledTime !== undefined) updates.scheduledTime = req.body.scheduledTime;

    const updated = meetings.update(req.params.id, updates);
    res.json(populateMeeting(updated));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── DELETE /:id ───────────────────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    const meeting = meetings.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    if (meeting.hostId !== req.user._id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    meetings.delete(req.params.id);

    const meetingNotes = notes.findByMeetingId(req.params.id);
    meetingNotes.forEach(note => notes.delete(note._id));

    res.json({ message: 'Meeting removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── POST /:id/join ────────────────────────────────────────────
router.post('/:id/join', protect, async (req, res) => {
  try {
    const meeting = meetings.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    if (!(meeting.participants || []).includes(req.user._id)) {
      meetings.update(req.params.id, {
        participants: [...(meeting.participants || []), req.user._id]
      });
    }

    const updated = meetings.findById(req.params.id);
    res.json({ roomId: updated.roomId, meeting: populateMeeting(updated) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── GET /room/:roomId ─────────────────────────────────────────
router.get('/room/:roomId', protect, async (req, res) => {
  try {
    const meeting = meetings.findByRoomId(req.params.roomId);

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    res.json(populateMeeting(meeting));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
