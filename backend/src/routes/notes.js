const express = require('express');
const axios = require('axios');
const { notes, meetings } = require('../config/dataStore');
const { protect } = require('../middleware/auth');

const router = express.Router();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

router.get('/:meetingId', protect, async (req, res) => {
  try {
    let note = notes.findByMeetingId(req.params.meetingId)[0];

    if (!note) {
      const meeting = meetings.findById(req.params.meetingId);
      if (!meeting) {
        return res.status(404).json({ message: 'Meeting not found' });
      }

      note = notes.create({
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

    let note = notes.findByMeetingId(req.params.meetingId)[0];

    if (!note) {
      note = notes.create({
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
      notes.update(note._id, { transcript: note.transcript });
    }

    res.json(note);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:meetingId/summary', protect, async (req, res) => {
  try {
    const note = notes.findByMeetingId(req.params.meetingId)[0];

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
      notes.update(note._id, { generatedSummary: response.data.summary });
      note.generatedSummary = response.data.summary;
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

    const note = notes.findByMeetingId(req.params.meetingId)[0];
    if (!note) return res.status(404).json({ message: 'Notes not found' });

    const JUNK_RE = /^\[Set GROQ|^\[Transcription unavailable|^\[Whisper/i;
    const cleanEntries = note.transcript.filter(t => t?.text && !JUNK_RE.test(t.text));

    if (cleanEntries.length === 0) {
      return res.json({ entries: [], language: targetLanguage });
    }

    // Send all lines in ONE bulk call — avoids rate limits from N individual calls
    const lines = cleanEntries.map(e => e.text);

    const response = await axios.post(`${AI_SERVICE_URL}/translate-bulk`, {
      lines,
      target_language: targetLanguage,
      source_language: 'auto'
    });

    const translatedLines = response.data?.translated_lines || lines;

    // Map translated lines back to original entry structure
    const translatedEntries = cleanEntries.map((entry, i) => ({
      ...entry,
      text: translatedLines[i] || entry.text
    }));

    // Cache
    const translations = note.translations || {};
    translations[targetLanguage] = translatedLines.join('\n');
    notes.update(note._id, { translations });

    res.json({ entries: translatedEntries, language: targetLanguage });
  } catch (error) {
    console.error('Translation error:', error.message);
    res.status(500).json({ message: 'Translation failed: ' + error.message });
  }
});

router.post('/:meetingId/chatbot', protect, async (req, res) => {
  try {
    const { question } = req.body;

    const note = notes.findByMeetingId(req.params.meetingId)[0];

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