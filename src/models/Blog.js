const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  
  timestamp: {
    type: Date,
    default: Date.now,
  },
  imagePath: {
    type: String,
    required: true,
  },
     
});

const blog = mongoose.model('Blog', blogSchema);

module.exports = blog;
