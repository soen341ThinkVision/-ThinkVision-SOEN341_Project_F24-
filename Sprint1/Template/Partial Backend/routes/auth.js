const express = require("express")
const app = express()

app.post('/Register', (req,res) => {
    try {
        const {ID, username, password} = req.body;
        const Values = [ID,username,password];
        const insertQuery = "INSERT INTO students (ID, Username, Password) VALUES (?,?,?)"
    }
})