const express = require("express");
const path = require("path");
require('dotenv').config();
const hbs = require("hbs");
const multer = require('multer');
const mongoose = require("mongoose");
const port = process.env.PORT || 4000;
const Events = require('./models/Events'); // Adjust the path accordingly
const TeamMember = require('./models/TeamMember');
const app = express();
const admin_key = process.env.ADMIN_KEY;
const moongose_uri = process.env.MONGOOSE_URI || "mongodb://127.0.0.1:27017/yourdatabase"; // Provide a default value

app.set("views", path.join(__dirname, "../templates/views"));
app.set("view engine", "hbs");
hbs.registerPartials(path.join(__dirname, "../templates/partials"));
app.use(express.static(path.join(__dirname, "../public")));

// db connection
const uri = moongose_uri;

// Wrap the connection function call in a try-catch block
async function connection() {
  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("connected successfully");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error; // Rethrow the error to ensure it's caught by the outer try-catch block
  }
}

// Call the connection function directly, without a try-catch block
connection();

// Multer configuration for file storage
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

// Middlewares
// Middleware to authenticate admin for specific routes
// const authenticateAdmin = (req, res, next) => {
//   const adminKey = req.query.adminKey;

//   // Specify the routes that require admin authentication
//   const adminRoutes = [
//     '/admin/add',
//     '/delete/:eventId',
//     '/edit/confirm/:eventId',
//     '/edit/confirmed/:eventId',
//     '/add',
//     '/addTeamMember', // Add this line to allow access to the /addTeamMember route
//     '/deleteTeamMember/:teamMemberId', // Make sure you have this route for deleting team members
//   ];

//   if (adminRoutes.includes(req.path)) {
//     // If the route requires admin authentication
//     if (adminKey && adminKey === process.env.ADMIN_KEY) {
//       // Allow access for authenticated admin
//       next();
//     } else {
//       // Send Unauthorized response for unauthorized access
//       res.status(401).send('Unauthorized access');
//     }
//   } else {
//     // For other routes, proceed without admin authentication
//     next();
//   }
// };
// const authenticateAdminForTeamMember = (req, res, next) => {
//   const adminKey = req.query.adminKey;

//   // Specify the routes that require admin authentication
//   const adminRoutesForTeamMember = ['/admin/addTeamMember', '/deleteTeamMember/:teamMemberId', '/editTeamMember/confirm/:teamMemberId', '/editTeamMember/confirmed/:teamMemberId', '/addTeamMember'];

//   if (adminRoutesForTeamMember.includes(req.path)) {
//     // If the route requires admin authentication
//     if (adminKey && adminKey === process.env.ADMIN_KEY) {
//       // Allow access for authenticated admin
//       next();
//     } else {
//       // Send Unauthorized response for unauthorized access
//       res.status(401).send('Unauthorized access');
//     }
//   } else {
//     // For other routes, proceed without admin authentication
//     next();
//   }
// };
// // Apply the middleware globally
// app.use(authenticateAdmin);
// app.use(authenticateAdminForTeamMember);


// Body parsing middlewares should be before defining routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
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
  const eventId = req.params.eventId.replace(':', ''); // Remove the colon

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

app.post('/edit/confirmed/:eventId', upload.single('eventImage'), async (req, res) => {
  const eventId = req.params.eventId;
  const adminKey = req.query.adminKey;
  try {
    const eventToUpdate = await Events.findById(eventId);
    if (!eventToUpdate) {
      res.status(404).send("Event not found");
      return;
    }

    // Update the event data based on the form submission
    eventToUpdate.eventName = req.body.eventName;
    eventToUpdate.aboutEvent = req.body.aboutEvent;

    // Check if a new file was uploaded
    if (req.file) {
      eventToUpdate.imagePath = req.file.path;
    }

    await eventToUpdate.save();

    res.redirect("/admin");
  } catch (error) {
    console.error("Error updating event data:", error);
    res.status(500).send("Internal Server Error");
  }
});


app.get('/add', (req, res) => {
  const adminKey = req.query.adminKey;

  // Render the page for adding a new event
  res.render('addEvent', { adminKey });
});

app.post('/add', upload.single('eventImage'), async (req, res) => {
  const adminKey = req.query.adminKey;

  try {
    // Extract form data from req.body
    const { eventName, aboutEvent } = req.body;

    // Check if a file was uploaded
    let imagePath;
    if (req.file) {
      imagePath = req.file.path;
    }


    const newEvent = new Events({
      eventName: eventName,
      aboutEvent: aboutEvent,
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
    // Extract form data from req.body
    const { name, position, githubLink, linkedinLink, instaLink, facebookLink } = req.body;

    // Check if a file was uploaded
    let imagePath;
    if (req.file) {
      imagePath = req.file.path;
    }

    // Create a new TeamMember document with the extracted data
    const newTeamMember = new TeamMember({
      name: name,
      position: position,
      githubLink: githubLink,
      linkedinLink: linkedinLink,
      instaLink: instaLink,
      facebookLink: facebookLink,
      imagePath: imagePath, // Save the file path to the imagePath field
    });

    // Save the new team member to the database
    await newTeamMember.save();

    // Redirect back to the admin page after adding the team member
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

    // Update the team member data based on the form submission
    teamMemberToUpdate.name = req.body.name;
    teamMemberToUpdate.position = req.body.position;
    teamMemberToUpdate.githubLink = req.body.githubLink;
    teamMemberToUpdate.linkedinLink = req.body.linkedinLink;
    teamMemberToUpdate.instaLink = req.body.instaLink;
    teamMemberToUpdate.facebookLink = req.body.facebookLink;

    // Check if a new file was uploaded
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
  const teamMemberId = req.params.teamMemberId.replace(':', ''); // Remove the colon

  try {
    await TeamMember.findByIdAndDelete(teamMemberId);
    console.log("Team Member Deleted successfully");
    res.redirect('/admin');
  } catch (error) {
    console.error('Error deleting team member:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`The server is running on port ${port}`); 
});
  