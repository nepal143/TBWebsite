const express = require("express");
const path = require("path");
const hbs = require("hbs");
const mongoose = require("mongoose") 
const port = process.env.PORT || 4000; 
const Events = require('./models/Events'); // Adjust the path accordingly
const app = express();
console.log(__dirname) ;
app.set("views", path.join(__dirname, "/../templates/views"));
app.set("view engine", "hbs");
hbs.registerPartials(path.join(__dirname, "/../templates/partials"));
app.use(express.static(path.join(__dirname, "/../public")));


// db connection 

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://nepalsss008:TechBoard@cluster0.ci3h0hk.mongodb.net/" ;

async function connection(){
  await mongoose.connect(uri);
  console.log("connected sucessfully ") ;
}

try{
  connection() ;
} catch (error) { 
  console.log(error)
}



// Coding events  
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 


app.get("/", (req, res) => {
    res.render("index.hbs");
});

app.get("/admin", (req, res) => {
    res.render("admin.hbs");
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


app.listen(port, () => {
    console.log(`The server is running on port ${port}`);
});
 