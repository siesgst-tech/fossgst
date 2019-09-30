const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  tos: {
    type: Boolean,
    default: false
  },
  ghProfile: {
    type: String,
    unique: true,
    index: true
  },
  ghToken: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);