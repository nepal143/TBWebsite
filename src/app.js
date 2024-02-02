const express = require("express");
const path = require("path");
require('dotenv').config();
const hbs = require("hbs");
const multer = require('multer');
const mongoose = require("mongoose");
const port = process.env.PORT || 4000;
const Events = require('./models/Events'); 
const TeamMember = require('./models/TeamMember');
const Blog =require('./models/blog');
const User = require('./models/Users')
const bcrypt = require('bcrypt') 
const session = require("express-session");   
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
hbs.registerHelper('mod', (num, mod) => num % mod === 0);
const uri = moongose_uri;    
app.use( 
  session({
    secret: "your-secret-key", // Replace with a strong and secure key
    resave: true,
    saveUninitialized: true,
  })
);
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
const storageBlog = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/blogs');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const uploadBlog = multer({ storage: storageBlog });
const upload = multer({ storage: storage });
const uploadTeamMember = multer({ storage: storageTeam });


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get("/", async (req, res) => {
  try {
      const events = await Events.find();
      res.render("index.hbs", { events });
  } catch (error) {
      console.error('Error fetching events:', error);
      res.status(500).send('Internal Server Error');
  }
});

app.get("/teams", (req, res) => {
  res.render("team.hbs");
});

app.get("/event_info", (req, res) => {
  res.render("eventinfo.hbs");
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
// Assuming you have a route for the Team Members page in your Express app
app.get('/TeamMembers', async (req, res) => {
  try {
    const teamMembers = await TeamMember.find().sort({ position: 1 }); // Sorting by position

    res.render('TeamMembers.hbs', { teamMembers });

  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).send('Internal Server Error');
  } 
});





hbs.registerHelper('getFileName', (filePath) => {
  const parts = filePath.split('\\');
  return parts.pop();
});




app.get('/adminBlog', async (req, res) => {
  try {
    const blogs = await Blog.find();
    const adminKey = req.query.adminKey;

    res.render('adminBlog', { blogs, adminKey });

  } catch (error) {
    console.error('Error fetching blog posts for admin page:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/editBlog/confirm/:blogId', async (req, res) => {
  const blogId = req.params.blogId;
  const adminKey = req.query.adminKey;

  try {
    const blogToUpdate = await Blog.findById(blogId);
    if (!blogToUpdate) {
      res.status(404).send("Blog post not found");
      return;
    }

    res.render("editBlogConfirmation", { blogToUpdate, adminKey });
  } catch (error) {
    console.error("Error fetching blog post data for edit confirmation:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get('/editBlog/confirmed/:blogId', async (req, res) => {
  const blogId = req.params.blogId;
  const adminKey = req.query.adminKey;

  try {
    const blogToUpdate = await Blog.findById(blogId);
    if (!blogToUpdate) {
      res.status(404).send("Blog post not found");
      return;
    }

    res.render("editBlog", { blogToUpdate, adminKey });
  } catch (error) {
    console.error("Error fetching blog post data for edit confirmation:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post('/editBlog/confirmed/:blogId', async (req, res) => {
  const blogId = req.params.blogId;
  const adminKey = req.query.adminKey;

  try {
    const blogToUpdate = await Blog.findById(blogId);
    if (!blogToUpdate) {
      res.status(404).send("Blog post not found");
      return;
    }

    blogToUpdate.title = req.body.title;
    blogToUpdate.content = req.body.content;

    await blogToUpdate.save();

    res.redirect("/adminBlog");
  } catch (error) {
    console.error("Error updating blog post data:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get('/deleteBlog/:blogId', async (req, res) => {
  const blogId = req.params.blogId;

  try {
    await Blog.findByIdAndDelete(blogId);
    console.log("Blog post deleted successfully");
    res.redirect('/adminBlog');
  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).send('Internal Server Error');
  }
});
app.get('/addBlog' , (req,res) =>{
    res.render('addBlog')
})

app.post('/addBlog', uploadBlog.single('blogImage'), async (req, res) => {
  const adminKey = req.query.adminKey;

  try {
    const { title, content } = req.body;

    let imagePath;
    if (req.file) {
      imagePath = req.file.path;
    }

    const newBlog = new Blog({
      title,
      content,
      imagePath,
    });

    await newBlog.save();

    res.redirect('/adminBlog');
  } catch (error) {
    console.error('Error adding new blog post:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/editBlog/:blogId', uploadBlog.single('blogImage'), async (req, res) => {
  const blogId = req.params.blogId;
  const adminKey = req.query.adminKey;
  try {
    const blogToUpdate = await Blog.findById(blogId);
    if (!blogToUpdate) {
      res.status(404).send('Blog post not found');
      return;
    }
    res.render('editBlog', { blogToUpdate, adminKey });  
  } catch (error) {
    console.error('Error fetching blog post data for edit:', error);
    res.status(500).send('Internal Server Error');
  }
});
hbs.registerHelper('isLeftCard', (options) => {
  if (this._isLeftCard === undefined) {
    this._isLeftCard = true;
  } else {
    this._isLeftCard = !this._isLeftCard;
  }

  return this._isLeftCard ? options.fn(this) : options.inverse(this);
});

app.post('/editBlog/:blogId', async (req, res) => {
  const blogId = req.params.blogId;
  const adminKey = req.query.adminKey;
  try {
    const blogToUpdate = await Blog.findById(blogId);
    if (!blogToUpdate) {
      res.status(404).send('Blog post not found');
      return;
    }

    blogToUpdate.title = req.body.title;
    blogToUpdate.content = req.body.content;

    if (req.file) {
      blogToUpdate.imagePath = req.file.path;
    }

    await blogToUpdate.save();

    res.redirect('/adminBlog');
  } catch (error) {
    console.error('Error updating blog post data:', error);
    res.status(500).send('Internal Server Error');
  }
});
hbs.registerHelper('formatDate', (date) => {
  return date;
});

app.get('/login' , (req,res) =>{
  res.render('login')
})
app.get("/register", (req, res) => {
  res.render("register");
});
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  console.log(req.body);

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.render("register", { error: "User already exists" });
    }

    // Create a new user
    const newUser = new User({ username, password });

    // Save the user to the database
    await newUser.save();

    // Redirect to login page after registration
    res.redirect("/login");
  } catch (error) {
    console.error(error); 
    res.render("register", { error: "Registration failed" });
  }
});    

// Your existing login route
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if the user exists
    const user = await User.findOne({ username });

    if (!user) {
      return res.render("login", { error: "Invalid username or password" });
    }  

    // Compare the entered password with the hashed password in the database
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.render("login", { error: "Invalid username or password" });
    }

    // Set user in the session and redirect to the home page
    req.session.user = user.username;
    console.log("login sucessfully") ; 
    res.redirect("/");
  } catch (error) {
    console.error(error);
    res.render("login", { error: "Login failed" });
  }
});
// middleware/authorizeAdmin.js
// middleware/authenticate.js

const authenticateUser = (req, res, next) => {
  try {
    // ... existing code
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).send('Internal Server Error');
  }
};

const authorizeAdmin = (req, res, next) => {
  try {
    // ... existing code
  } catch (error) {
    console.error('Authorization error:', error);
    res.status(500).send('Internal Server Error');
  }
};




// ...

// Use the authentication middleware for all routes that require authentication
app.use(authenticateUser);

// Use the authorization middleware for admin-related routes
app.use(['/admin', '/adminBlog', '/addBlog', '/editBlog', '/deleteBlog'], authorizeAdmin);

// Your existing routes and middleware go here

// ...


app.listen(port, () => {
  console.log(`The server is running on port ${port}`); 
});
  