// models/Events.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const eventsSchema = new Schema({
  eventName: {
    type: String,
    required: true
  },
  aboutEvent: {
    type: String,
    required: true
  },
  imagePath: {
    type: String // Store the path of the uploaded image
  }
});

const Events = mongoose.model('Events', eventsSchema);

module.exports = Events;
