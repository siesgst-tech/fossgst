const mongoose = require('mongoose');

const xdocActSchema = new mongoose.Schema({
  xdocId: {
    type: mongoose.Types.ObjectId,
    ref: 'Xdoc',
    required: true
  },
  point: {
    type: Number,
    required: true
  },
  commits: [{
    sha: {
      type: String,
      require: true
    },
    validity: {
      type: Boolean,
      required: true,
    },
    message: {
      type: String,
    }
  }],
  validity: {
    type: Boolean,
    require: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('XDoCActivities', xdocActSchema);