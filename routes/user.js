const router = require('express').Router();
const User = require('../models/user'); // Mongoose Model for creating a user
const bcrypt = require('bcryptjs');     // BcryptJS is a no setup encryption tool
const jwt = require('jsonwebtoken');    // library for some utilities
const passport = require('passport');

require('dotenv').config();     //gives us access to our environment variables 
const secret = process.env.SECRET || "there is no spoon!";


// Registration Process
router.post('/register', (req,res) => {
    console.log(req.body);
    // 1. Check the database for an existing user by Email and Username.
    User.findOne(
        { $or: [
            { emailAddress: req.body.email },
            { userName: req.body.username }
        ]}
    )
    .then(user => {
        // 1.1 If there is a user already, return an error.
        if(user){
            let error = 'Email Address Exists in Database.';
            return res.status(400).json(error);
        // 1.2 If there is not a user already, move on.
        }
        const newUser = new User({
            emailAddress: req.body.email,
            userName: req.body.username,
            password: req.body.password,
            profil: {
                firstName: req.body.firstName,
                lastName: req.body.lastName
            }
        });
        console.log("New user created: " + newUser);
        // 2. Salt and Hash the password
        bcrypt.genSalt(10, (err, salt) => {
            if(err) throw err;
            bcrypt.hash(newUser.password, salt, (err, hash) => {
                if(err) throw err;
                newUser.password = hash;
                //Save User to Database.
                newUser.save()
                //Return success to the client.
                //.then(user => res.json(user))
                .then(user => {
                    const payload = {
                        // All user information I want to pass with the token
                        id: user._id,
                        username: user.userName,
                        email: user.emailAddress,
                        admin: user.admin
                    };
                    jwt.sign(
                        payload, 
                        secret, 
                        { expiresIn: 36000 },
                        (err, token) => {
                            if (err) {
                                res.status(500).json({ error: "Error signing token", raw: err });
                            }
                            res.json({ 
                                success: true,
                                token: token,
                                expiresIn: 36000,
                                id: user._id,
                                username: user.userName,
                                email: user.emailAddress,
                                admin: user.admin
                            });
                        }
                    );     
                })
                .catch(err => res.status(400).json(err));
            });
        });
    });
});

// Authentication Process
router.post('/login', (req,res) => {
    const email = req.body.email;
    const password = req.body.password;   
    //Searches for user in database
    console.log("checking for user...");
    User.findOne({ emailAddress: email })   
    .then(user => {
        if (!user) {
            return res.status(404).json({message: "No account found!"});
        }
        // Compare sent password vs. stored password.
        bcrypt.compare(password, user.password)
        .then(isMatch => {
            //if password hashes match, generate a token and send to the user
            if (isMatch) {
                const payload = {
                    // All user information I want to pass with the token when requesting the api
                    id: user._id,           // Will be used to find user in database
                    username: user.userName,
                    email: user.emailAddress,
                    admin: user.admin
                };
                jwt.sign(
                    payload, 
                    secret, 
                    { expiresIn: 36000 },
                    (err, token) => {
                        if (err) {
                            res.status(500).json({ error: "Error signing token", raw: err });
                        }
                        res.json({ 
                            success: true,
                            token: token,
                            expiresIn: 36000,
                            id: user._id,
                            username: user.userName,
                            email: user.emailAddress,
                            admin: user.admin
                        });
                    }
                );      
            } else {
                console.log("wrong password!");
                res.status(400).json({error: "Password is incorrect"});
            }
        });
    })
    .catch(error => {
        console.log(error);
        res.status(500).json(error);
    });
});

router.get('/lostpassword', (req, res) => {
    const email = req.query.email;
    User.findOne({ emailAddress: email })
    .then(user => {
        if(user){
            console.log("user found: " + user.userName + " | " + user.emailAddress);
            res.status(200).json({user: user.userName, email: user.emailAddress});
            // add logic to reinitialize password and send email with new password to user
        } else {
            console.log("user not found!");
            res.status(404).json({error: "email not registered"});
        }
    })
});

// Export API routes
module.exports = router;