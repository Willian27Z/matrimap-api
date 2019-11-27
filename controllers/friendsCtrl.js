const async = require('async');
const User = require('../models/user');
const mailer = require('../mailing');

// Retrieves a user's friend list and dynamically adds their current username and avatar
exports.view = function(req, res) {
    console.log("entered GET 'api/friends/:id' route, execution exports.view on friendsCtrl.js");
    console.log("req.user: ");
    console.log(req.user);

    User.findById(req.params.id, function(err, user){
        if(err)  {
            console.log(err)
            res.send(err);
        }

        //getUsersInfos(user.friends)

        // Get usernames and avatar for each friend
        let friendsList = new Array();
        async.each(user.friends, function(element, callback){
            User.findById(element.id, function(err, friendInfo) {
                if(err){
                    console.log("ERROR!");
                    console.log(err);
                }
                // add all info from the author here
                newFriend = {
                    id: element.id,
                    status: element.status,
                    date: element.date,
                    pseudo: friendInfo.userName,
                    avatar: friendInfo.profil.avatar
                }
                // if it is a recommandation
                if(friendInfo.recommandedBy && friendInfo.status === "recommandation"){
                    newFriend.recommandedBy = friendInfo.recommandedBy
                }
                friendsList.push(newFriend);
                callback();
            });
        }, function(err){
            if(err){
                console.log("Error getting friends");
                res.status(500).json({error: "Error getting friends info"})
            } else {
                console.log("sending friends list");
                res.json(friendsList);
            }
        });
    })
}

// on the friend, adds the user as friend with status "invited"
// on the user, adds a friend with status "waiting"
exports.invite = function(req, res) {
    console.log("entered GET 'api/friends/invite/:id' route, execution exports.invite on friendsCtrl.js");
    console.log("req.user: ");
    console.log(req.user);


    // add user as friend with status "invited" to recipient req.params.id
    User.findById(req.params.id, function(err, user){
        const friendInQuestion = user.friends.find(element => element.id == req.user.id);
        // friendInQuestion is me (req.user)

        // if I already exist in his friends array
        if(friendInQuestion){

            // if my status is "confirmed" in his account, something must have gone wrong, check my account
            if(friendInQuestion.status === "confirmed"){
                console.log("the user already has you as confirmed friend");
                
                // check if friend already in user's account    
            }

            // if my status is "waiting", I must have ignored his request earlier
            // in this case, confirm to him and create or update my account
            if(friendInQuestion.status === "waiting" ){
                console.log(user.userName + " was waiting for you, confirming...");
                friendInQuestion.status = "confirmed";
                friendInQuestion.date = new Date();
                user.save().then(()=>{
                    //send socket - TODO

                    // add friend with status "confirmed" to author or change status from "recommandation" to "waiting"
                    User.findById(req.user.id, function(err, user2){
                        const friendInQuestion2 = user2.friends.find(element => element.id == req.params.id);
                        // friendInQuestion2 here is him (req.params.id)

                        // If this friend is anything but confirmed in my account, then update
                        if(friendInQuestion2 && friendInQuestion2.status !== "confirmed"){
                            friendInQuestion2.status = "confirmed";
                            friendInQuestion2.date = new Date();
                            user2.save().then(()=>{
                                return res.json({message: user.userName + " a été ajouté à votre liste d'amis!", type:"success"});
                            })
                        }
                        // If he is already confirmed, there's nothing else to do
                        if(friendInQuestion2 && friendInQuestion2.status === "confirmed"){
                            return res.json({message: user.userName + " a été ajouté à votre liste d'amis!", type:"success"});
                        }

                        // else, create this friend as confirmed and save
                        user2.friends.push({
                            id: req.params.id,
                            status: "confirmed",
                            date: new Date()
                        })
                        user2.save().then((user2)=>{
                            return res.json({message: user.userName + " a été ajouté à votre liste d'amis!", type:"success"});
                        });
                    });
                });
            } 
            // if i'm a recommandation in his account, change my status to invited
            // create or change my account
            if(friendInQuestion.status === "recommandation") {
                friendInQuestion.status = "invited";
                friendInQuestion.date = new Date();
                user.save().then((user)=>{
                    //send email to user invited
                    //TO DO
            
                    // check if he is already on my friends list, if not create
                    User.findById(req.user.id, function(err, user2){
                        const friendInQuestion2 = user2.friends.find(element => element.id == req.params.id)
                        
                        // if he is confirmed, there must have been an erreur
                        // if he is invited, there must have been an erreur 
                        // if he is waiting, can't invite again
                        if(friendInQuestion2 && friendInQuestion2.status !== "recommandation"){
                            return res.json({message: "Déjà votre amis ou invitation déjà envoyé", type:"error"});
                        } 
                        // if he is recommendation, change status to "waiting"
                        if(friendInQuestion2 && friendInQuestion2.status === "recommandation"){
                            friendInQuestion2.status = "waiting";
                            user2.save().then((user2)=>{
                                return res.json({message: "invitation envoyé à " + user.userName, type:"success"});
                            });
                        }
                    });
                });
            }
            // if my status is "invited", that means I already invited him
            // must create friend with status "confirmed" for req.user and change status to "confirm" for req.params.id
            if(friendInQuestion.status === "invited") {
                return res.json({message: "Vous avez déjà invité " + user.userName + " à devenir amis", type:"error"});
            }
        // if I'm not in his friends yet
        } else {
            user.friends.push({
                id: req.user.id,
                status: "invited",
                date: new Date()
            });
            user.save().then((user)=>{
                //send email
                let html = "<h3>Matrimap</h3><h4>Nouvelle Demande d'amis</h4><p>Bonjour. " + req.user.userName + " vous a demandé de devenir son amis. Connectez-vous pour savoir pour lui répondre.</p><p>A bientôt!</p><p>Equipe Matrimap</p>"
    
                mailer.sendHtmlMail(user.emailAddress, "Nouvelle Demande d'amis", html);
        
                // add friend with status "waiting" to user   
                User.findById(req.user.id, function(err, user2){
                    const friendInQuestion2 = user2.friends.find(element => element.id == req.params.id);
                        
                    // if he is confirmed, there must have been an erreur
                    // if he is invited, there must have been an erreur 
                    // if he is waiting, can't invite again
                    if(friendInQuestion2 && friendInQuestion2.status !== "recommandation"){
                        return res.json({message: "Déjà votre amis ou invitation déjà envoyé", type:"error"});
                    } 
                    // if he is recommendation, change status to "waiting"
                    if(friendInQuestion2 && friendInQuestion2.status === "recommandation"){
                        friendInQuestion2.status = "waiting";
                        user2.save().then((user2)=>{
                            return res.json({message: "invitation envoyé à " + user.userName, type:"success"});
                        })
                    }

                    if(!friendInQuestion2){
                        // else if I don't have him in my list, create and save
                        user2.friends.push({
                            id: req.params.id,
                            status: "waiting",
                            date: new Date()
                        });
                        user2.save().then((user2)=>{
                            res.json({message: "invitation envoyé à " + user2.userName, type:"success"});
                        });
                    }
                });
            });
        }
    });
}

// On the user, changes the status of a friend from "invited" to "confirmed"
// On the friend, changes the status of the user from "waiting" to "confirmed" 
exports.accept = function(req, res) {
    console.log("entered GET 'api/friends/accept/:id' route, execution exports.accept on friendsCtrl.js");
    console.log("req.user: ");
    console.log(req.user);

    // user.id is the one who accepted: invited => confirmed
    User.findById(req.user.id, function(err, user){
        const friendInQuestion = user.friends.find(element => element.id.equals(req.params.id));
        // check if friend with status "invited"
        if(!friendInQuestion || friendInQuestion.status !== "invited"){
            res.status(403).json({message: "Vous ne pouvez pas ajouter " + req.params.id + " comme amis sans une invitation", type:"error"})
        } 

        
        friendInQuestion.status = "confirmed";
        friendInQuestion.date = new Date();
        user.save().then(() => {
            // params.id is the one who was waiting: waiting => confirmed
            User.findById(req.params.id, function(err, userWaiting){
                const userAccepted = userWaiting.friends.find(element => element.id.equals(req.user.id));
                // check if friend with status "waiting"
                if(!userAccepted || userAccepted.status !== "waiting"){
                    res.status(403).json({message: req.params.id + " n'a pas invité " + req.user.userName + " comme amis", type:"error"})
                } else {
                    userAccepted.status = "confirmed";
                    userAccepted.date = new Date();
                    userWaiting.save().then(()=>{
                        res.json({message: userWaiting.userName + " a été ajouté à votre liste d'amis!", type:"success"});
                    })
                }
            })
        })
        
    })
}

// adds a friend with "recommandation" status to another friend and notifies by email
exports.recommend = function(req, res) {
    console.log("entered GET 'api/friends/recommend' route, execution exports.recommend on friendsCtrl.js");
    console.log("req.user: ");
    console.log(req.user);

    // req.user is who recommended
    // req.params.recommend is the one to be recommanded
    // req.params.to is the one to receive the recommandation

    // check if req.user is confirmed friend with both
    User.findById(req.user.id, function(err, user){
        let friendRecommanded = user.friends.find(element => element.id.equals(req.query.recommend));
        const friendReceiver = user.friends.find(element => element.id.equals(req.query.to));
        if(!friendRecommanded || !friendReceiver){
            console.log("not friend with one the user!")
            return res.json({message: "Vous n'êtes pas amis avec l'un des deux", type: "error"});
        }

        // check if recommended is already in receiver friend list
        User.findById(friendReceiver.id, function(err, friend){
            friendRecommanded = friend.friends.find(element => element.id.equals(req.query.recommend));
            if(friendRecommanded){
                return res.json({message: "Ces personnes sont déjà en contact", type: "error"});
            }
            
            // add recommended to receiver friend list with status "recommandation" and recommendedBy: req.user
            friend.friends.push({
                id: req.query.recommend,
                status: "recommandation",
                recommendedBy: req.user.id,
                date: new Date()
            })
            friend.save().then(()=>{
                // send email to receiver
                let html = "<h3>Matrimap</h3><h4>Nouvelle Recommandation d'amis</h4><p>Bonjour. " + req.user.userName + " vous a recommandé quelqu'un comme amis. Connectez-vous pour savoir qui!</p><p>A bientôt!</p><p>Equipe Matrimap</p>"
    
                mailer.sendHtmlMail(friend.emailAddress, "Nouvelle Recommandation d'amis", html);

                // send success response
                return res.json({message: "La recommandation a été envoyé!", type: "success"});
            })
        })
    })
}

// remove friend from req.user and params.id
exports.unfriend = function(req, res) {
    console.log("entered GET 'api/friends/unfriend/:id' route, execution exports.unfriend on friendsCtrl.js");
    console.log("req.user: ");
    console.log(req.user);
    
    // Find friend in user's friend list, check and remove
    User.findById(req.user.id, function(err, user){
        let friendToRemove = user.friends.find(element => element.id.equals(req.params.id));
        
        if(!friendToRemove){
            console.log("friend not found on user's friend list!");
            return res.status(404).json({message: "friend not found on user's friend list"})
        }

        if(friendToRemove.status !== "confirmed"){
            console.log("friend was not confirmed on user's friend list!");
            return json({message: "Vous ne pouvez pas retirer un amis non confirmé", type: "error"});
        }

        //removing
        let index = user.friends.indexOf(friendToRemove);
        user.friends.splice(index, 1);

        user.save().then(()=>{

            // Find user in ex-friend friends list, check and remove
            User.findById(req.params.id, function(err, exFriend){
                let userToRemove = exFriend.friends.find(element => element.id.equals(req.user.id));
                
                if(!userToRemove){
                    console.log(req.user.userName + " was not found on " + exFriend.userName + "'s friend list!");
                    return res.json({message: exFriend.userName + " n'est plus votre ami", type: "success"})
                }
        
                if(userToRemove.status !== "confirmed"){
                    console.log("User was not a confirmed friend of " + exFriend.userName);
                    return res.json({message: exFriend.userName + " n'est plus votre ami", type: "success"})
                }

                //removing
                let index2 = user.friends.indexOf(userToRemove);
                exFriend.friends.splice(index2, 1);

                exFriend.save().then(()=>{
                    return res.json({message: exFriend.userName + " n'est plus votre ami", type: "success"})
                });
            });
        });
    });
}

// remove friend with "invite" or "recommandation" from user friend list
exports.ignore = function(req, res) {
    console.log("entered GET 'api/friends/ignore/:id' route, execution exports.ignore on friendsCtrl.js");
    console.log("req.user: ");
    console.log(req.user);

    User.findById(req.user.id, function(err, user){
        let friendToRemove = user.friends.find(element => element.id.equals(req.params.id));
        
        if(!friendToRemove){
            console.log("friend not found on user's friend list!");
            return res.status(404).json({message: "friend not found on user's friend list"})
        }

        if(friendToRemove.status !== "invited" && friendToRemove.status !== "recommandation"){
            console.log("friend was not invited nor recommended on user's friend list!");
            return res.json({message: "Vous ne pouvez pas ignorer un amis confirmé ou en attente", type: "error"});
        }

        //removing
        let index = user.friends.indexOf(friendToRemove);
        user.friends.splice(index, 1);

        user.save().then(()=>{
            return res.json({message: "La demande a été ignoré", type: "success"});
        });
    });
}