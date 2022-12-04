
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const { default: mongoose } = require("mongoose");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = ({
    email: String,
    password: String
});

const User = mongoose.model("User", userSchema);


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
    const user = new User({
        email: req.body.username,
        password: req.body.password
    });
    
    user.save(function(err){
        if(err){
            console.log(err);
            res.render("register");
        }else {
            console.log("successfully added to the database");
            res.render("home");
        }
    });
});

app.post("/login", (req,res)=>{
    User.findOne({email: req.body.username}, (err, foundUser)=>{
        if(err){
            console.log(err);
        }else if(foundUser.password === req.body.password){
            console.log(`User ${req.body.username} has been logged in`);
            res.render("secrets");
        } else {
            console.log("Incorrect password");
        }
        res.render("login");
    })
});

app.listen(3000, ()=>{
    console.log("Server started on port 3000");
});