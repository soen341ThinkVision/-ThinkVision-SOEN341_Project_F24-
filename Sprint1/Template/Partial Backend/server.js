//Importing Libraries (npm)
const express = require("express")
const app = express()
const mysql = require("mysql")
const bodyParser = require("body-parser");


app.use(express.urlencoded({extended: false}))
app.use(express.json())
app.use(express.static("css"));

//Terminal Listen Notif
app.listen(5000, () => {
    console.log("Server running on port 5000")
})

//Database Connection

const db = mysql.createConnection({
    host: 'localhost',
    user:'root',
    password:'',
    database:'pas'
})

db.connect((err) => {
    if(err) {
        console.log("Error conectiong to database")
    } else {
        console.log("MySql database connected")
    }
})

// Routes

app.get('/', (req,res) => {
    res.send("main.ejs")
})

app.get('/login',(req,res) => {
    res.render("Login.ejs")
})

app.get('/SignUp', (req,res) => {
    res.render("SignUp.ejs")
})

//Reroute



// POSTS

app.post('/Register', (req,res) => {
    console.log("Recieved POST body request for registration", req.body);
    
        const {ID, Username, Password} = req.body;

        const Values = [ID,Username,Password];

        const insertQuery = "INSERT INTO students (ID, Username, Password) VALUES (?,?,?)";

        db.query(insertQuery, Values, (err,result) => {
            if(err) {
                console.log("Error registering user");
                console.log(err);
            } else {
                console.log("User sucessfully added");
                res.redirect("/Login");
                alert("User has been added sucessfully");
            }
        })
    
})
