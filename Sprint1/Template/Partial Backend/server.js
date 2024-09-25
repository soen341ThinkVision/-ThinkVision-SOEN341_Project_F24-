// Importing Libraries (npm)
const express = require("express");
const app = express();
const mysql = require("mysql");
const bodyParser = require("body-parser");
const session = require('express-session');

app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(express.static("css"));

// Session Middleware
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: {secure: false}
}));

// Terminal Listen Notif
app.listen(5000, () => {
    console.log("Server running on port 5000");
});

// Database Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'pas'
});

db.connect((err) => {
    if (err) {
        console.log("Error connecting to database");
    } else {
        console.log("MySql database connected");
    }
});

// Routes
app.get('/', (req, res) => {
    res.render("main.ejs");
});

app.get('/login', (req, res) => {
    res.render("Login.ejs");
});

app.get('/SignUp', (req, res) => {
    res.render("SignUp.ejs");
});

app.get('/dashboard', isAuthenticated, (req, res) => {
    res.send(`Welcome ${req.session.user.username}`);
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return console.log(err);
        }
        res.redirect('/login');
    });
});

// POSTS
app.post('/Register', (req, res) => {
    console.log("Received POST body request for registration", req.body);

    const {ID, Username, Password} = req.body;
    const Values = [ID, Username, Password];
    const insertQuery = "INSERT INTO students (ID, Username, Password) VALUES (?,?,?)";

    db.query(insertQuery, Values, (err, result) => {
        if (err) {
            console.log("Error registering user");
            console.log(err);
        } else {
            console.log("User successfully added");
            res.redirect("/Login");
        }
    });
});

app.post('/LogUser', (req, res) => {
    console.log("Received POST body request for login", req.body);

    const {Username, Password} = req.body;
    const TryQuery = 'SELECT * FROM students WHERE Username = ?';

    db.query(TryQuery, Username, (err, result) => {
        if (result.length > 0) {
            if (result[0].Password === Password) {
                console.log("User Successfully Logged In");
                req.session.user = {
                    id: result[0].ID,
                    username: result[0].Username
                };
                res.redirect('/dashboard');
            } else {
                console.log("Wrong Password");
                res.send("Wrong Password");
            }
        } else {
            console.log("User Was not found");
            res.send("User was not found");
        }
    });
});

function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    } else {
        res.redirect('/login');
    }
}