'use strict'
/******************************* 
*****ENVIRONMENT VARIABLES******
*******************************/

//reads in configuration from a .env file
require('dotenv').config(); 

const PORT = process.env.PORT || 2727;
const dbPort = process.env.DB_PORT || 27017;
const dbUrl = process.env.DB_URL || "localhost";
const dbCollection = process.env.DB_COLLECTION || "auth-test";


/******************************* 
***********NODE MODULES*********
*******************************/

const express = require("express");
const cp = require("cookie-parser");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const passport = require("passport");
const path = require("path");
const app = express();

/******************************* 
*********EXTERNAL FILES*********
*******************************/

const apiRoutes = require("./routes/api");
const authRoutes = require("./routes/user");
const socketIO = require("./socket-io");

/******************************* 
**********STATIC FILES**********
*******************************/



/******************************* 
**********MIDDLEWARE************
*******************************/
//  Body-Parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true  //auth tuto says this should be false
}));

//  Mongoose
//fixes an issue with a depricated default in Mongoose.js
mongoose.set("useCreateIndex", true);
mongoose.set('useFindAndModify', false);
mongoose.connect(`mongodb://${dbUrl}/${dbCollection}`, {useNewUrlParser: true})
    .then(_ => console.log("Connected Successfully to MongoDB"))
    .catch(err => console.error(err));

//initializes the passport configuration.
app.use(passport.initialize());
require("./passport-config")(passport);

//custom Middleware for logging each request going to the API, optional for debugging reasons
app.use((req,res,next) => {
    if (req.body) console.log(req.body);
    if (req.params) console.log(req.params);
    if (req.query) console.log(req.query);
    console.log(`Received a ${req.method} request from ${req.ip} for ${req.url}`);
    next();
});

//for handling preflight requests
app.use((req,res,next) => {
    if (req.method === "OPTIONS") {
        res.writeHead(200, {
            "content-type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, GET, OPTIONS, DELETE, PUT",
            "Access-Control-Allow-Headers": "X-Requested-With, Content-Type, Origin, Authorization, Accept, Client-Security-Token, Accept-Encoding, X-Auth-Token, content-type"
        });
        res.end();
    } else {
        res.setHeader("Access-Control-Allow-Origin", "*");
        next();
    }
});

app.use("/js", express.static(path.normalize(__dirname + "/assets/js")));
app.use("/img", express.static(path.normalize(__dirname + "/assets/img")));
app.use("/css", express.static(path.normalize(__dirname + "/assets/css")));


/******************************* 
 *************ROUTES*************
 *******************************/

//registers our authentication routes with Express.
app.use("/user", authRoutes);

app.use("/api", passport.authenticate('jwt', {session:false}), apiRoutes);

app.use(function (req, res) {
    res.sendFile(path.normalize(__dirname + "/app/index.html"));
});

/******************************* 
 ***********LISTENING***********
 *******************************/

const httpServer = app.listen(PORT, function(){
    console.log("Server listening at port: " + PORT);
});

socketIO.listen(httpServer);