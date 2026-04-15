const mongoose = require('mongoose');

const transcriptEntrySchema = new mongoose.Schema({
  speaker: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  language: {
    type: String,
    default: 'en'
  }
}, { _id: true });

const actionItemSchema = new mongoose.Schema({
  task: {
    type: String,
    required: true
  },
  assignee: {
    type: String,
    default: ''
  },
  dueDate: {
    type: Date,
    default: null
  },
  completed: {
    type: Boolean,
    default: false
  }
}, { _id: true });

const summarySchema = new mongoose.Schema({
  overview: {
    type: String,
    default: ''
  },
  keyPoints: [{
    type: String
  }],
  actionItems: [actionItemSchema]
}, { _id: false });

const noteSchema = new mongoose.Schema({
  meetingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting',
    required: true,
    unique: true
  },
  transcript: [transcriptEntrySchema],
  summary: {
    type: summarySchema,
    default: () => ({})
  },
  translations: {
    type: Map,
    of: String,
    default: {}
  },
  generatedSummary: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

noteSchema.index({ meetingId: 1 });

module.exports = mongoose.model('Note', noteSchema);