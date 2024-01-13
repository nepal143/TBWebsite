const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  eventName: {
    type: String,
    required: true,
  },
  eventDiscription: {
    type: Date,
    required: false,
  },
  AboutEvent: {
    type: String,
    required: true, 
  },
  // Add more fields as needed 
});

module.exports = mongoose.model('Events', eventSchema);    