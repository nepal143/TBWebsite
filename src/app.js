const express = require("express");
const path = require("path");
const hbs = require("hbs");

const port = process.env.PORT || 3000;

const app = express();
console.log(__dirname) ;
app.set("views", path.join(__dirname, "/../templates/views"));
app.set("view engine", "hbs");
hbs.registerPartials(path.join(__dirname, "/../templates/views/partials"));
app.use(express.static(path.join(__dirname, "/../public")));

app.get("/", (req, res) => {
    res.render("index.hbs");
});

app.listen(port, () => {
    console.log(`The server is running on port ${port}`);
});
