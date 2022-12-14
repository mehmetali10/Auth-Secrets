require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose= require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1/userDB");

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
passport.deserializeUser(function(id, done) {
  User.findById(id, function(err,user){
      done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile.displayName);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get("/", (req, res)=>{res.render("home")});

app.get("/login", (req, res)=>{res.render("login");});

app.get("/register", (req, res)=>{res.render("register");});


app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] }));


app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    console.log("Successful authentication, redirect to secrets");
    res.redirect("/secrets");
});


app.get("/secrets", function(req, res){
    User.find({"secret": {$ne: null}}, function(err, foundUsers){
      if (err){
        console.log(err);
      } else {
        if (foundUsers) {
          res.render("secrets", {usersWithSecrets: foundUsers});
        }
      }
    });
  });


app.get("/submit", (req,res)=>{
    if(req.isAuthenticated()){
        res.render("submit");
    }else {
        res.redirect("/login");
    }
});

app.post("/submit", (req,res)=>{
    const submittedSecret = req.body.secret;

    User.findById(req.user.id, (err, foundUser)=>{
        if(err){
            console.log(err);
            res.render("/submit");
        } else {
            if(foundUser){
                foundUser.secret = submittedSecret;
                foundUser.save(function(){
                    res.redirect("/secrets");
                });
            }
        }
    })
})


app.post("/register", (req, res)=>{
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err){
            console.log(err);   
            res.redirect("/register");
        }else{
            passport.authenticate("local")(req, res, ()=>{
                console.log(`${req.body.username} has been registered`)
                res.redirect("/secrets");
            });
        }
    });
});


app.post("/login", (req,res)=>{
   const user = new User({
    username: req.body.username,
    password: req.body.password
   });

   req.login(user, (err)=>{
    if(err){
        console.log(err);
    }else{
        passport.authenticate("local")(req, res, ()=>{
            console.log(`user ${user.username} has been loged in`);
            res.redirect("/secrets");
        })
    }
   });
});


app.get("/logout", (req, res)=>{
    req.logout(function(err){
        if(err) { return next(err);}
        console.log(`user loged out`);
        res.redirect("/");
    });
});


app.listen(3000, ()=>{
    console.log("Server started on port 3000");
});