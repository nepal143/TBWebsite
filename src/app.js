const express = require("express");
const path = require("path");
require('dotenv').config();
const hbs = require("hbs");
const multer = require('multer');
const mongoose = require("mongoose") 
const port = process.env.PORT || 4000; 
const Events = require('./models/Events'); // Adjust the path accordingly
const app = express();
const admin_key = process.env.ADMIN_KEY ; 
const moongose_uri = process.env.MONGOOSE_URI ; 
console.log(__dirname) ;
app.set("views", path.join(__dirname, "/../templates/views")); 
app.set("view engine", "hbs");
hbs.registerPartials(path.join(__dirname, "/../templates/partials"));
app.use(express.static(path.join(__dirname, "/../public")));


// db connection 

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = moongose_uri;

async function connection(){
  await mongoose.connect(uri);
  console.log("connected sucessfully ") ;
}

try{
  connection() ;
} catch (error) { 
  console.log(error)
}
// multer storage function to store images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/events'); 
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); 
  }
});


// middlewares 
const authenticateAdmin = (req, res, next) => {
  const adminKey = req.query.adminKey;
  if (req.path == '/admin/add') {
    next();
  } 
  else if (adminKey && adminKey === process.env.ADMIN_KEY) {
    next();
  } else {   
    res.status(401).send('Unauthorized access');
  }
};

app.use('/admin', authenticateAdmin);

const upload = multer({ storage: storage });

 
app.use(express.json());  
app.use(express.urlencoded({ extended: true })); 


app.get("/", (req, res) => {
    res.render("index.hbs");
});

app.get("/events", async (req, res) => { 
  try {
      const eventData = await Events.find();

      res.render("events.hbs", { events: eventData });
      console.log(eventData) ; 
  } catch (error) {
      console.error('Error fetching event data:', error);
      res.status(500).send('Internal Server Error');
  }
});









app.get("/admin", async (req, res) => {
  const adminKey = req.params.adminKey;
  try {
    const eventData = await Events.find();
    res.render("admin.hbs", { events: eventData ,admin_key :adminKey });
    console.log(eventData);
  } catch (error) {
    console.error('Error fetching event data:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/delete/:eventId', async (req, res) => {
  const eventId = req.params.eventId.replace(':', ''); // Remove the colon
  const adminKey = req.query.adminKey;

  console.log('Received eventId:', eventId);

  try {
      await Events.findByIdAndDelete(eventId);
      console.log("Deleted successfully")
      res.redirect('/admin');

  } catch (error) {
      console.error('Error deleting event:', error);
      res.status(500).send('Internal Server Error');
  }
});

// app.js
app.get('/edit/confirm/:eventId',async (req, res) => {
  const eventId = req.params.eventId;
  const adminKey = req.query.adminKey;

  try {
    // Fetch the event data by eventId
    const eventToUpdate = await Events.findById(eventId);

    if (!eventToUpdate) {
      // Event not found
      res.status(404).send('Event not found');
      return;
    }

    // Render edit confirmation page with event details and adminKey
    res.render('editConfirmation', { eventToUpdate, adminKey });
  } catch (error) {
    console.error('Error fetching event data for edit confirmation:', error);
    res.status(500).send('Internal Server Error');
  }
});


app.get('/edit/confirmed/:eventId',  upload.single('eventImage') ,async (req, res) => {
  const eventId = req.params.eventId;
  const adminKey = req.query.adminKey;

  try {
    // Fetch the event data by eventId
    const eventToUpdate = await Events.findById(eventId);

    if (!eventToUpdate) {
      // Event not found
      res.status(404).send('Event not found');
      return;
    }

    // Render the edit page with event details and adminKey
    res.render('edit', { eventToUpdate, adminKey });
  } catch (error) {
    console.error('Error fetching event data for edit confirmation:', error);
    res.status(500).send('Internal Server Error');
  }
});



app.post('/edit/confirmed/:eventId', upload.single('eventImage'), async (req, res) => {
  const eventId = req.params.eventId;
  const adminKey = req.query.adminKey;

  try {
    const eventToUpdate = await Events.findById(eventId);

    if (!eventToUpdate) {
      // Event not found
      res.status(404).send('Event not found');
      return;
    }

    // Update the event data based on the form submission
    eventToUpdate.eventName = req.body.eventName;
    eventToUpdate.aboutEvent = req.body.aboutEvent;

    // Check if a file was uploaded
    if (req.file) {
      // Save the file path to the imagePath field
      eventToUpdate.imagePath = req.file.path;
    }

    await eventToUpdate.save();

    res.redirect('/admin'); // Redirect to the admin page after edit confirmation
  } catch (error) {
    console.error('Error updating event data:', error);
    res.status(500).send('Internal Server Error');
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

    // Create a new Events document with the extracted data
    const newEvent = new Events({
      eventName: eventName,
      aboutEvent: aboutEvent,
      imagePath: imagePath, // Save the file path to the imagePath field
    });

    // Save the new event to the database
    await newEvent.save();

    // Redirect back to the admin page after adding the event
    res.redirect('/admin');
  } catch (error) {
    console.error('Error adding new event:', error);
    res.status(500).send('Internal Server Error');
  }
}); 

app.listen(port, () => {
    console.log(`The server is running on port ${port}`);
}); 
 