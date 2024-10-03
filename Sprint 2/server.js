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

//Terminal Listen Notif
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
    const {username: Username, role: Role, team: Team} = req.session.user || {};
        if(Role === 'Student') {
            res.render("MainPage.ejs", { Username, Role, Team});
        }
        else {
            res.render("MainPage.ejs", { Username, Role});
        }
    
})

app.get('/login',(req,res) => {
    res.render("Login.ejs")
})

app.get('/SignUp', (req,res) => {
    res.render("SignUp.ejs")
})

app.get('/TeamVis', (req,res) => {

    console.log("Session object:", req.session);

    const teamName = req.session.user.team;

    const teamQuery = "SELECT * FROM teams WHERE TeamName = ?";

    db.query(teamQuery, [teamName], (err,result) => {
        if(result && result.length > 0) {
            let teamMembers = [];
            result.forEach(team => {
                if (team.Member1) teamMembers.push(team.Member1);
                if (team.Member2) teamMembers.push(team.Member2);
                if (team.Member3) teamMembers.push(team.Member3);
                if (team.Member4) teamMembers.push(team.Member4);
            });

            res.render("TeamVisibility.ejs", {teamMembers: teamMembers, teamName: teamName});
        }
    })
});

app.get('/Logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return console.log(err);
        }
        res.redirect('/');
    });
});


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

        if(result && result.length > 0 ) {
            if(result[0].Password == Password) {
                console.log("User Sucessfully Logged In");

                req.session.user = {
                    id: result[0].ID,
                    username: result[0].Username,
                    role: Option,
                    team: null
                };

                console.log("Session after login:", req.session.user);

                if (req.session.user.role === "Student") {
                    const StudentName = result[0].Username;

                    const CheckQuery = "SELECT * FROM teams WHERE Member1 = ? OR Member2 = ? OR Member3 = ? OR Member4 = ?";

                    db.query(CheckQuery, [StudentName,StudentName,StudentName,StudentName], (error,newresult) => {
                        if(newresult && newresult.length > 0) {
                            console.log("Student belongs to team", newresult[0].TeamName);
                            req.session.user.team = newresult[0].TeamName;
                            return res.redirect('/');
                        }
                    });
                } else {
                    return res.redirect('/');
                }

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