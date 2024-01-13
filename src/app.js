const express = require("express");
const path = require("path");
require('dotenv').config();
const hbs = require("hbs");
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



// middlewares 
const authenticateAdmin = (req, res, next) => {
  const adminKey = req.query.adminKey;
  if (adminKey && adminKey === process.env.ADMIN_KEY) {
    next();
  } else {

    res.status(401).send('Unauthorized access');
  }
};

app.use('/admin', authenticateAdmin);




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

app.post('delete/:eventId', async (req, res) => {
  const eventId = req.params.eventId;
  try {
    await Events.findByIdAndDelete(eventId);
    console.log("deleted successfully ")
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


app.get('/edit/confirmed/:eventId', async (req, res) => {
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


// app.js
app.post('/edit/confirmed/:eventId', async (req, res) => {
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

    // Update the event data based on the form submission
    eventToUpdate.eventName = req.body.eventName;
    eventToUpdate.AboutEvent = req.body.aboutEvent;
    // Update other event details as needed

    // Save the updated event data
    await eventToUpdate.save();

    // Redirect to the admin page after edit confirmation
    res.render("/admin" , {adminKey : admin_key})
  } catch (error) {
    console.error('Error updating event data:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
    console.log(`The server is running on port ${port}`);
}); 
 