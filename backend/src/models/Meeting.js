const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  roomId: {
    type: String,
    unique: true,
    required: true
  },
  scheduledTime: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['scheduled', 'active', 'completed'],
    default: 'scheduled'
  },
  meetingType: {
    type: String,
    enum: ['live', 'uploaded'],
    default: 'live'
  },
  videoUrl: {
    type: String,
    default: null
  },
  duration: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

meetingSchema.index({ hostId: 1, createdAt: -1 });
meetingSchema.index({ roomId: 1 });

module.exports = mongoose.model('Meeting', meetingSchema);