const router = require('express').Router();
const User = require('../models/user'); // Mongoose Model for creating a user
const bcrypt = require('bcryptjs');     // BcryptJS is a no setup encryption tool
const jwt = require('jsonwebtoken');    // library for some utilities
const passport = require('passport');
const mailer = require('../mailing');
const generatePassword = require("password-generator");

require('dotenv').config();     //gives us access to our environment variables 
const secret = process.env.SECRET || "there is no spoon!";


// Registration Process
router.post('/register', (req,res) => {
    console.log(req.body);
    // 1. Check the database for an existing user by Email and Username.
    User.findOne(
        { $or: [
            { emailAddress: req.body.email.toLowerCase() },
            { userName: req.body.username }
        ]}
    )
    .then(user => {
        // 1.1 If there is a user already, return an error.
        if(user){
            return res.json({ 
                success: false,
                message: "l'adresse mail ou nom d'utilisateur est déjà utilisé",
                type: "error"
            });
        // 1.2 If there is not a user already, move on.
        }
        const newUser = new User({
            emailAddress: req.body.email.toLowerCase(),
            userName: req.body.username,
            password: req.body.password,
            admin: false,
            profil: {
                firstName: req.body.firstName,
                lastName: req.body.lastName
            }
        });
        if(req.body.username === "Admin"){
            newUser.admin = true;
        }
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
                                message: "Bienvenu " + req.body.firstName + "! Votre compte a bien été crée",
                                type: "success",
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
    const email = req.body.email.toLowerCase();;
    const password = req.body.password;   
    //Searches for user in database
    console.log("checking for user...");
    User.findOne({ emailAddress: email })   
    .then(user => {
        if (!user) {
            res.json({message: "L'adresse email ou mot de passe n'est pas correct", type: "error"});
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
                            message: "Bienvenue à nouveau " + user.profil.firstName,
                            type: "success",
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
                res.json({message: "L'adresse email ou mot de passe n'est pas correct", type: "error"});
            }
        });
    })
    .catch(error => {
        console.log(error);
        res.status(500).json(error);
    });
});

router.get('/lostpassword', (req, res) => {
    const email = req.query.email.toLowerCase();
    console.log("retrieving new password for " + email);
    User.findOne({ emailAddress: email })
    .then(user => {
        if(user){
            console.log("user found: " + user.userName + " | " + user.emailAddress);
            console.log("reinitialising password...")
            // add logic to reinitialize password and send email with new password to user
            // TODO
            let newPassword = generatePassword(12, false);

            bcrypt.genSalt(10, (err, salt) => {
                if(err) throw err;
                bcrypt.hash(newPassword, salt, (err, hash) => {
                    if(err) throw err;
                    // update password
                    user.password = hash;
                    //Save User to Database.
                    user.save()
                    .then(user => {
                        let html = "<h3>Matrimap</h3><h4>Reinitialization du mot de passe</h4><p>Bonjour. Vous avez demandez la réinitialization de votre mot de passe. Voici votre nouveau mot-de-passe:</p><p>" + newPassword + "</p><p>A bientôt!</p><p>Equipe Matrimap</p>"

                        mailer.sendHtmlMail(user.emailAddress, "Réinitialisation du mot-de-passe", html);

                        res.json({message: "Le nouveau mot de passe a été envoyé à " + user.emailAddress, type: "success"});
                            
                    })
                    .catch(err => res.status(500).json(err));
                });
            });
        } else {
            console.log("user not found!");
            res.json({message: "Cet adresse mail n'est enregistré dans notre base de donnée", type: "error"});
        }
    })
});

router.get('/admin/:id', (req, res) => {
    User.findById(req.params.id, (err, user) => {
        console.log(`Is user ${user.userName} admin? => ${user.admin}!`);
        res.json({admin: user.admin});
    })
})

router.get('/stats', (req, res) => {
    let totalMessage = 0
    // User.count
})

// Export API routes
module.exports = router;