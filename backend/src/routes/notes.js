const express = require('express');
const axios = require('axios');
const Note = require('../models/Note');
const Meeting = require('../models/Meeting');
const { protect } = require('../middleware/auth');

const router = express.Router();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

router.get('/:meetingId', protect, async (req, res) => {
  try {
    let note = await Note.findOne({ meetingId: req.params.meetingId })
      .populate('meetingId');

    if (!note) {
      const meeting = await Meeting.findById(req.params.meetingId);
      if (!meeting) {
        return res.status(404).json({ message: 'Meeting not found' });
      }

      note = await Note.create({
        meetingId: req.params.meetingId,
        transcript: [],
        summary: {}
      });
    }

    res.json(note);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:meetingId/transcript', protect, async (req, res) => {
  try {
    const { transcript } = req.body;

    let note = await Note.findOne({ meetingId: req.params.meetingId });

    if (!note) {
      note = await Note.create({
        meetingId: req.params.meetingId,
        transcript: [],
        summary: {}
      });
    }

    if (transcript && transcript.text) {
      note.transcript.push({
        speaker: transcript.speaker || 'Unknown',
        text: transcript.text,
        timestamp: new Date(),
        language: transcript.language || 'en'
      });
      await note.save();
    }

    res.json(note);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:meetingId/summary', protect, async (req, res) => {
  try {
    const note = await Note.findOne({ meetingId: req.params.meetingId });

    if (!note) {
      return res.status(404).json({ message: 'Notes not found' });
    }

    const transcriptText = note.transcript
      .map(t => `${t.speaker}: ${t.text}`)
      .join('\n');

    if (!transcriptText) {
      return res.status(400).json({ message: 'No transcript available' });
    }

    const response = await axios.post(`${AI_SERVICE_URL}/summarize`, {
      transcript: transcriptText,
      language: req.user.preferredLanguage || 'en'
    });

    if (response.data && response.data.summary) {
      note.generatedSummary = response.data.summary;
      await note.save();
    }

    res.json({ summary: note.generatedSummary });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to generate summary' });
  }
});

router.post('/:meetingId/translate', protect, async (req, res) => {
  try {
    const { targetLanguage } = req.body;

    const note = await Note.findOne({ meetingId: req.params.meetingId });

    if (!note) {
      return res.status(404).json({ message: 'Notes not found' });
    }

    const transcriptText = note.transcript
      .map(t => t.text)
      .join('\n');

    const response = await axios.post(`${AI_SERVICE_URL}/translate`, {
      text: transcriptText,
      target_language: targetLanguage,
      source_language: 'auto'
    });

    if (response.data && response.data.translated) {
      note.translations.set(targetLanguage, response.data.translated);
      await note.save();
    }

    res.json({ translated: response.data.translated, language: targetLanguage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Translation failed' });
  }
});

router.post('/:meetingId/chatbot', protect, async (req, res) => {
  try {
    const { question } = req.body;

    const note = await Note.findOne({ meetingId: req.params.meetingId });

    if (!note) {
      return res.status(404).json({ message: 'Notes not found' });
    }

    const context = note.transcript
      .map(t => `${t.speaker}: ${t.text}`)
      .join('\n');

    const response = await axios.post(`${AI_SERVICE_URL}/chatbot`, {
      question,
      context
    });

    res.json({ answer: response.data.answer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Chatbot error' });
  }
});

module.exports = router;