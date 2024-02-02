const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({ 
  name: { type: String, required: true },
  position: { type: String, required: true },
  githubLink: { type: String },
  linkedinLink: { type: String },
  instaLink: { type: String },
  facebookLink: { type: String },
  imagePath: { type: String },  
});

const TeamMember = mongoose.model('TeamMember', teamMemberSchema);

module.exports = TeamMember;
