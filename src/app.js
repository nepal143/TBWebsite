// importing modlues 
const express = require("express");
const path = require("path");
const hbs = require("hbs");

const port = process.env.PORT || 3000; // port initializing 

const app = express();


// setting up the path 
app.set("views", path.join(__dirname, "templates/views"));
hbs.registerPartials(path.join(__dirname, "templates/views/partials"));
app.use(express.static(path.join(__dirname, "public")));



// different routers 
app.get("/", (req, res) => {
    res.render("index")
});




// listening on port 
app.listen(port, () => {
    console.log(`The server is running on port ${port}`);
});
