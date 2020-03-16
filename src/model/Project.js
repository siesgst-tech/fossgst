const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: true
  },
  repo: {
    type: String,
    required: true
  },
  points: {
    type: Number,
    required: true
  },
  approved: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    default: 'open',
    require: true,
  },
  description: {
    type: String,
    required: true
  },
  domain: {
    type: String,
    required: true
  },
  language: {
    type: String,
    required: true
  },
  difficultyLevel: {
    type: String,
    enum: ['noob', 'easy', 'moderate', 'difficult', 'godlike']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Projects', projectSchema);
