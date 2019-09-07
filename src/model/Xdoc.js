const mongoose = require('mongoose');

const xdocSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: true
  },
  repo: {
    type: String,
    required: true
  },
  x: {
    type: Number,
    required: true,
  },
  startTime: {
    type: Date,
    default: Date.now()
  },
  description: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('XDoC', xdocSchema);