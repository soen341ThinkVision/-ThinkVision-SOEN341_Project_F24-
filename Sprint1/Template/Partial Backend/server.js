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

app.post('/LogUser', (req,res) => {
    console.log("Recieved POST body request for login", req.body);

    const {Username,Password} = req.body;

    
    const TryQuery = 'SELECT * FROM students WHERE Username = ?'

    db.query(TryQuery, Username, (err,result) => {
        if(result.length > 0) {
            if(result[0].Password == Password) {
                console.log("User Sucessfully Logged In");
                alert("Sucessful Log In");
            } else {
                console.log("Wrong Password");
                alert("Wrong Password");
            }
        } else {
            console.log("User Was not found");
            alert("User was not found");
        }
    })
})