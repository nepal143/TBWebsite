const express = require("express");
const path = require("path");
require("dotenv").config();
const hbs = require("hbs");
const multer = require("multer");
const mongoose = require("mongoose");
const port = process.env.PORT || 4000;
const Events = require("./models/Events"); // Adjust the path accordingly
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

// Use an IIFE to handle the asynchronous operation properly
(async () => {
  try {
    await connection();
  } catch (error) {
    console.error(error);
    process.exit(1); // Exit the process with a non-zero status code to indicate an error
  }
})();

// Multer storage function to store images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage }); // Use storage option instead of dest

// Middlewares
const authenticateAdmin = (req, res, next) => {
  const adminKey = req.query.adminKey;
  if (adminKey && adminKey === admin_key) {
    next();
  } else {
    res.status(401).send("Unauthorized access");
  }
};

app.post('/upload', upload.single('file'), (req, res) => {
  const { filename, originalname, size } = req.file;

 
  res.json({
    filename,
    originalname,
    size,
    message: 'File uploaded successfully!',
  });
});

app.use("/admin", authenticateAdmin);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));


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
    res.render("admin.hbs", { events: eventData, admin_key: admin_key });
    console.log(eventData);
  } catch (error) {
    console.error("Error fetching event data:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/delete/:eventId", async (req, res) => {
  const eventId = req.params.eventId;
  try {
    await Events.findByIdAndDelete(eventId);
    console.log("deleted successfully ");
    res.redirect("/admin");
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/edit/confirm/:eventId", async (req, res) => {
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

app.get(
  "/edit/confirmed/:eventId",
  upload.single("eventImage"),
  async (req, res) => {
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
  }
);

app.post("/edit/confirmed/:eventId", async (req, res) => {
  const eventId = req.params.eventId;
  const adminKey = req.query.adminKey;
  try {
    const eventToUpdate = await Events.findById(eventId);
    if (!eventToUpdate) {
      res.status(404).send("Event not found");
      return;
    }
    eventToUpdate.eventName = req.body.eventName;
    eventToUpdate.AboutEvent = req.body.aboutEvent;
    await eventToUpdate.save();
    res.redirect("/admin"); // Redirect to admin page after successful update
  } catch (error) {
    console.error("Error updating event data:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(port, () => {
  console.log(`The server is running on port ${port}`);
});
