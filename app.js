require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose= require("mongoose");
//const encrypt = require("mongoose-encryption");
//const md5 = require("md5");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

const User = new mongoose.model("User", userSchema);

app.get("/", (req, res)=>{
    res.render("home")
});

app.get("/login", (req, res)=>{
    res.render("login");
});

app.get("/register", (req, res)=>{
    res.render("register");
});

app.post("/register", (req, res)=>{
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        if(err){
            console.log(err);
            res.render("register");
        }
        else
        {
            const user = new User({
                email: req.body.username,
                password: hash
            });
            user.save(function(err){
                if(err)
                {
                    console.log(err);
                    res.render("register");
                }
                else
                {
                    console.log("successfully added to the database");
                    res.render("home");
                }
            });
        }
       
    });
});


app.post("/login", (req,res)=>{
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email: username}, (err, foundUser) => {
        if(err)
        {
            console.log(err);
            res.render("login");
        }
        else if(foundUser)
        {
            bcrypt.compare(password, foundUser.password, function(error, result) { 
                if(err)
                {
                    console.log(error);
                    res.render("login");
                }
                else if(result)
                {
                console.log(`User ${username} has been logged in`);
                 res.render("secrets");
                }
                else
                {
                    console.log("Invalid password");
                    res.render("login");
                }
             });
        }
        
    });
});

app.listen(3000, ()=>{
    console.log("Server started on port 3000");
});