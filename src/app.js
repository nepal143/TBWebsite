const express = require("express");
const path = require("path");
const hbs = require("hbs");
const mongoose = require("mongoose") 
const port = process.env.PORT || 3000;

const app = express();
console.log(__dirname) ;
app.set("views", path.join(__dirname, "/../templates/views"));
app.set("view engine", "hbs");
hbs.registerPartials(path.join(__dirname, "/../templates/views/partials"));
app.use(express.static(path.join(__dirname, "/../public")));
const Event = require("./models/Event");


// db connection 

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://Ignite_n:I2SbetFH0PeusgdI@cluster0.7ahbezy.mongodb.net/?retryWrites=true&w=majority&appName=AtlasApp"; 

async function connection(){
  await mongoose.connect(uri);
  console.log("connected sucessfully ") ;
}

try{
  connection() ;
} catch (error) { 
  console.log(error)
}


app.get("/", (req, res) => { 
    res.render("index.hbs");
});




app.post("/addEvent", async (req, res) => {
    try {
        const { title, description } = req.body;
        const event = new Event({ title, description });
        await event.save();
        res.status(201).send("Event added successfully");
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Route to get all events
app.get("/getEvents", async (req, res) => {
    try {
        const events = await Event.find();
        res.json(events);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Route to delete an event
app.delete("/deleteEvent/:eventId", async (req, res) => {
    try {
        const eventId = req.params.eventId;
        await Event.findByIdAndDelete(eventId);
        res.send("Event deleted successfully");
    } catch (error) {
        res.status(500).send(error.message);
    }
});





app.listen(port, () => {
    console.log(`The server is running on port ${port}`);
});
