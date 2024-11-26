// Importing Libraries (npm)
const express = require("express");
const session = require("express-session");

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("css"));
app.use("/scripts", express.static("./node_modules/sweetalert2/dist"));

// Increase security by hiding version information from end users
app.disable("x-powered-by");

app.use(
  session({
    secret: "BreakingBad", // Use a strong secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true if using HTTPS
  })
);

// Routes
app.use("/", require("./routes/routes.js"));

module.exports = app;
