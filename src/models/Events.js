const mongoose = require('mongoose');

const eventsSchema = new mongoose.Schema({
  eventName: {
    type: String,
    required: true,
  },
  shortDescription: {
    type: String,
    required: true,
  },
  longDescription: {
    type: String,
    required: true,
  },
  imagePath: {
    type: String,
    required: true,
  },
});

const Events = mongoose.model('Events', eventsSchema);

module.exports = Events;
