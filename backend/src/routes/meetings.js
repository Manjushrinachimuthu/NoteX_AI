const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Meeting = require('../models/Meeting');
const Note = require('../models/Note');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, async (req, res) => {
  try {
    const { title, scheduledTime } = req.body;

    const roomId = uuidv4();

    const meeting = await Meeting.create({
      title: title || 'New Meeting',
      hostId: req.user._id,
      participants: [req.user._id],
      roomId,
      scheduledTime: scheduledTime || null,
      status: 'scheduled'
    });

    const note = await Note.create({
      meetingId: meeting._id,
      transcript: [],
      summary: {}
    });

    res.status(201).json(meeting);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    const meetings = await Meeting.find({
      $or: [
        { hostId: req.user._id },
        { participants: req.user._id }
      ]
    })
      .populate('hostId', 'name email')
      .sort({ createdAt: -1 });

    res.json(meetings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('hostId', 'name email')
      .populate('participants', 'name email');

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    res.json(meeting);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    if (meeting.hostId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    meeting.title = req.body.title || meeting.title;
    meeting.status = req.body.status || meeting.status;
    meeting.scheduledTime = req.body.scheduledTime || meeting.scheduledTime;

    const updatedMeeting = await meeting.save();
    res.json(updatedMeeting);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    if (meeting.hostId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await meeting.deleteOne();
    await Note.deleteOne({ meetingId: req.params.id });

    res.json({ message: 'Meeting removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/join', protect, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    if (!meeting.participants.includes(req.user._id)) {
      meeting.participants.push(req.user._id);
      await meeting.save();
    }

    res.json({
      roomId: meeting.roomId,
      meeting: meeting
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/room/:roomId', protect, async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ roomId: req.params.roomId })
      .populate('hostId', 'name email')
      .populate('participants', 'name email');

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    res.json(meeting);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;