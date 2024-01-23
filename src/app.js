const express = require("express");
const path = require("path");
require('dotenv').config();
const hbs = require("hbs");
const multer = require('multer');
const mongoose = require("mongoose");
const port = process.env.PORT || 4000;
const Events = require('./models/Events'); 
const TeamMember = require('./models/TeamMember');
const app = express();
const admin_key = process.env.ADMIN_KEY;
const moongose_uri = process.env.MONGOOSE_URI ;

app.set("views", path.join(__dirname, "../templates/views"));
app.set("view engine", "hbs");
hbs.registerPartials(path.join(__dirname, "../templates/partials"));
app.use(express.static(path.join(__dirname, "../public")));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Internal Server Error');
});

const uri = moongose_uri;

async function connection() {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true, 
    });
    console.log("connected successfully");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error; 
  }
}
connection(); 

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/events');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const storageTeam = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/Team');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });
const uploadTeamMember = multer({ storage: storageTeam });


const authenticateAdmin = (req, res, next) => {
  const adminKey = req.query.adminKey;


  const adminRoutes = [ 
    '/admin/add',
    '/delete/:eventId',
    '/edit/confirm/:eventId',
    '/edit/confirmed/:eventId',
    '/add',
    '/addTeamMember',
    '/deleteTeamMember/:teamMemberId', 
  ];

  if (adminRoutes.includes(req.path)) {
    if (adminKey && adminKey === process.env.ADMIN_KEY) {in
      next();
    } else {

      res.status(401).send('Unauthorized access');
    }
  } else {

    next();
  }
}; 
const authenticateAdminForTeamMember = (req, res, next) => {
  const adminKey = req.query.adminKey;


  const adminRoutesForTeamMember = ['/admin/addTeamMember', '/deleteTeamMember/:teamMemberId', '/editTeamMember/confirm/:teamMemberId', '/editTeamMember/confirmed/:teamMemberId', '/addTeamMember'];

  if (adminRoutesForTeamMember.includes(req.path)) {

    if (adminKey && adminKey === process.env.ADMIN_KEY) {

      next();
    } else {

      res.status(401).send('Unauthorized access');
    }
  } else {

    next();
  }
};

// app.use(authenticateAdmin);
// app.use(authenticateAdminForTeamMember);



app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get("/", (req, res) => {
  res.render("index.hbs");
});

app.get("/events", async (req, res) => {
  try {
    const eventData = await Events.find();
    res.render("events.hbs", { events: eventData });
    console.log(eventData);
  } catch (error) {
    console.error("Error fetching event data:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/admin", async (req, res) => {
  try {
    const eventData = await Events.find();
    const teamMembers = await TeamMember.find();
    res.render("admin.hbs", { events: eventData, teamMembers, admin_key: admin_key });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("Internal Server Error");
  }
});


app.get('/delete/:eventId', async (req, res) => {
  const eventId = req.params.eventId.replace(':', ''); 

  try {
    await Events.findByIdAndDelete(eventId);
    console.log("Deleted successfully")
    res.redirect('/admin');

  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/edit/confirm/:eventId', async (req, res) => {
  const eventId = req.params.eventId;
  const adminKey = req.query.adminKey;
  try {
    const eventToUpdate = await Events.findById(eventId);
    if (!eventToUpdate) {
      res.status(404).send("Event not found");
      return;
    }
    res.render("editConfirmation", { eventToUpdate, adminKey });
  } catch (error) {
    console.error("Error fetching event data for edit confirmation:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/edit/confirmed/:eventId", upload.single("eventImage"), async (req, res) => {
  const eventId = req.params.eventId;
  const adminKey = req.query.adminKey;
  try {
    const eventToUpdate = await Events.findById(eventId);
    if (!eventToUpdate) {
      res.status(404).send("Event not found");
      return;
    }
    res.render("edit", { eventToUpdate, adminKey });
  } catch (error) {
    console.error("Error fetching event data for edit confirmation:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post('/edit/confirmed/:eventId', async (req, res) => {
  const eventId = req.params.eventId;
  const adminKey = req.query.adminKey;

  try {
    console.log('Received request body:', req.body);

    const eventToUpdate = await Events.findById(eventId);
    if (!eventToUpdate) {
      res.status(404).send("Event not found");
      return;
    }

    eventToUpdate.eventName = req.body.eventName;
    eventToUpdate.shortDescription = req.body.shortDescription;
    eventToUpdate.longDescription = req.body.longDescription;

    await eventToUpdate.save();
 
    res.redirect("/admin");  
  } catch (error) {
    console.error("Error updating event data:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get('/add', (req, res) => {
  const adminKey = req.query.adminKey;

  res.render('addEvent', { adminKey });
});

app.post('/add', upload.single('eventImage'), async (req, res) => {
  const adminKey = req.query.adminKey;

  try {
    const { eventName, shortDescription, longDescription } = req.body;

    let imagePath;
    if (req.file) {
      imagePath = req.file.path;
    }

    const newEvent = new Events({
      eventName: eventName,
      shortDescription: shortDescription,
      longDescription: longDescription,
      imagePath: imagePath,
    });

    await newEvent.save();

    res.redirect('/admin');
  } catch (error) {
    console.error('Error adding new event:', error);
    res.status(500).send('Internal Server Error');
  }
});



app.get('/addTeamMember', (req, res) => {
  const adminKey = req.query.adminKey;

  res.render('addTeamMember', { adminKey });
});


app.post('/addTeamMember', uploadTeamMember.single('teamMemberImage'), async (req, res) => {
  const adminKey = req.query.adminKey;

  try {
    const { name, position, githubLink, linkedinLink, instaLink, facebookLink } = req.body;
    let imagePath;
    if (req.file) {
      imagePath = req.file.path;
    }
    const newTeamMember = new TeamMember({
      name: name,
      position: position,
      githubLink: githubLink,
      linkedinLink: linkedinLink,
      instaLink: instaLink,
      facebookLink: facebookLink,
      imagePath: imagePath,
    });

    await newTeamMember.save();
    res.redirect('/admin');
  } catch (error) {
    console.error('Error adding new team member:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/editTeamMember/confirm/:teamMemberId', async (req, res) => {
  const teamMemberId = req.params.teamMemberId;
  const adminKey = req.query.adminKey;
  try {
    const teamMemberToUpdate = await TeamMember.findById(teamMemberId);
    if (!teamMemberToUpdate) {
      res.status(404).send("Team Member not found");
      return;
    }
    res.render("editTeamMemberConfirmation", { teamMemberToUpdate, adminKey });
  } catch (error) {
    console.error("Error fetching team member data for edit confirmation:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get('/editTeamMember/confirmed/:teamMemberId', uploadTeamMember.single('teamMemberImage'), async (req, res) => {
  const teamMemberId = req.params.teamMemberId;
  const adminKey = req.query.adminKey;
  try {
    const teamMemberToUpdate = await TeamMember.findById(teamMemberId);
    if (!teamMemberToUpdate) {
      res.status(404).send("Team Member not found");
      return;
    }
    res.render("editTeamMember", { teamMemberToUpdate, adminKey });
  } catch (error) {
    console.error("Error fetching team member data for edit confirmation:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post('/editTeamMember/confirmed/:teamMemberId', async (req, res) => {
  const teamMemberId = req.params.teamMemberId;
  const adminKey = req.query.adminKey;
  try {
    const teamMemberToUpdate = await TeamMember.findById(teamMemberId);
    if (!teamMemberToUpdate) {
      res.status(404).send("Team Member not found");
      return;
    }
    teamMemberToUpdate.name = req.body.name;
    teamMemberToUpdate.position = req.body.position;
    teamMemberToUpdate.githubLink = req.body.githubLink;
    teamMemberToUpdate.linkedinLink = req.body.linkedinLink;
    teamMemberToUpdate.instaLink = req.body.instaLink;
    teamMemberToUpdate.facebookLink = req.body.facebookLink;

    if (req.file) {
      teamMemberToUpdate.imagePath = req.file.path;
    }

    await teamMemberToUpdate.save();

    res.redirect("/admin");
  } catch (error) {
    console.error("Error updating team member data:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get('/deleteTeamMember/:teamMemberId', async (req, res) => {
  const teamMemberId = req.params.teamMemberId.replace(':', ''); 

  try {
    await TeamMember.findByIdAndDelete(teamMemberId);
    console.log("Team Member Deleted successfully");
    res.redirect('/admin');
  } catch (error) {
    console.error('Error deleting team member:', error);
    res.status(500).send('Internal Server Error');
  }
});




hbs.registerHelper('getFileName', (filePath) => {
  const parts = filePath.split('\\');
  return parts.pop();
});

app.listen(port, () => {
  console.log(`The server is running on port ${port}`); 
});
  