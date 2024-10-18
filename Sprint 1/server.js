//Importing Libraries (npm)
const express = require("express")
const app = express()
const session = require('express-session');
const mysql = require("mysql")
const bodyParser = require("body-parser");


app.use(express.urlencoded({extended: true}))
app.use(express.json())
app.use(express.static("css"));

app.use(session({
    secret: 'BreakingBad', // Use a strong secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));




app.listen(5002, () => {
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
    const {username: Username, role: Role} = req.session.user || {};
    console.log("Username:", Username, "Role:", Role);
    res.render("MainPage.ejs", { Username, Role});
})

app.get('/login',(req,res) => {
    res.render("Login.ejs")
})

app.get('/SignUp', (req,res) => {
    res.render("SignUp.ejs")
})

app.get('/Logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return console.log(err);
        }
        res.redirect('/');
    });
});

// app.post(`/RateTeacher`, (req,res) => {
//     const {rating, username} = req.body;
//     db.find({username: username}, (err, result) => {
//         if (err) {
//             console.log("Error finding user");
//         } else {
//             console.log("User found", result);
//             db.update({username: username}, {rating: rating}, (err, result) => {
//                 if (err) {
//                     console.log("Error updating user");
//                 } else {
//                     console.log("User updated", result);
//                 }
//             })
//         }
//     })
// })

// POSTS

app.post('/Register', (req,res) => {
    console.log("Recieved POST body request for registration", req.body);
    
        const {ID, Username, Password, Option} = req.body;

        const Values = [ID,Username,Password];

        let insertQuery;

        if(Option === 'Student') {
            insertQuery = "INSERT INTO students (ID, Username, Password) VALUES (?,?,?)";
        }

        if(Option === 'Teacher') {
            insertQuery = "INSERT INTO teachers (ID, Username, Password) VALUES (?,?,?)";
        }

        db.query(insertQuery, Values, (err,result) => {
            if(err) {
                console.log("Error registering user");
                console.log(err);
            } else {
                console.log("User sucessfully added");
                res.redirect("/login");
            }
        })
    
})

app.post('/LogUser', (req,res) => {
    console.log("Recieved POST body request for login", req.body);

    const {Username,Password,Option} = req.body;

    let TryQuery;

    if(Option === 'Student') {
        TryQuery = "SELECT * FROM students WHERE Username = ?";
    }

    if(Option === 'Teacher') {
        TryQuery = "SELECT * FROM teachers WHERE Username = ?";
    }

    console.log("Executing query:", TryQuery, "with Username:", Username);

    db.query(TryQuery, Username, (err,result) => {
        if(result.length > 0 ) {
            if(result[0].Password == Password) {
                console.log("User Sucessfully Logged In");
                req.session.user = {
                    id: result[0].ID,
                    username: result[0].Username,
                    role: Option
                };

                console.log("Session after login:", req.session.user);
                res.redirect('/');

            } else {
                console.log("Wrong Password");
            }
        } else {
            console.log("User Was not found");
        }
    })
});

function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    } else {
        res.redirect('/login');
    }
}