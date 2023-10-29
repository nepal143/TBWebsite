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


// db connection 
const uri = "mongodb+srv://Ignite_n:I2SbetFH0PeusgdI@cluster0.wnh37zr.mongodb.net/?retryWrites=true&w=majority&appName=AtlasApp"
function connect(){
    try{
       mongoose.connect(uri)  
       connectionStatus = true;
       console.log("success")
    }
    catch(err){
        console.error(err)
    }
}

connect()

app.get("/", (req, res) => {
    res.render("index.hbs");
});

app.listen(port, () => {
    console.log(`The server is running on port ${port}`);
});
