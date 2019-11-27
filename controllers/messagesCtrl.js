const async = require('async');
const User = require('../models/user');

// Handles view my messages for scrapbook (on myspace component)
exports.view = function (req, res) {
    console.log("entered GET 'api/messages' route, execution exports.view on messagesCtrl.js");
    if(!req.user){
        return res.status(403).json({error: "not logged in"});
    }
    console.log("req.user: ");
    console.log(req.user);

    let userToSearch = req.user.id;
    if(req.params.id){
        userToSearch = req.params.id;
    }

    User.findById(userToSearch, function (err, user) {
        if (err){
            res.send(err);
        }

        // If request for another member's messages, check if friend and preferences
        // if(req.params.id){
        //     console.log("getting scrapbook for a friend?");
        //     // if not a friend
        //     if(!user.friends.find(element => element.id.equals(req.user.id) && element.status === "confirmed")){
        //         // if scrapbook is set to private
        //         if(user.prefs.private.scrapbook) {
        //             return res.status(403).json({error: "Not a friend of recipient"});  
        //         }                
        //     }
        // }

        // add userName and avatar to each post
        //getUsernames(user.scrapbook.received, req.user)
        let modifiedArray = new Array();
        console.log("started messages modification")
        let treatedMessage;
        async.each(user.scrapbook.received, function(element, callback){
            User.findById(element.author, async (err, authorUser) => {
                if(err){
                    console.log("ERROR!");
                    console.log(err);
                }
    
                // finding the comments usernames
                let treatedComments = new Array();
                async.each(element.comments, function(comment, callback2){
                    User.findById(comment.from, function(err, commentAuthor){
                        if(err){
                            console.log(err)
                        }
                        
                        let treatedComment = {
                            from: comment.from,
                            comment: comment.comment,
                            date: comment.date,
                            userName: commentAuthor.userName
                        }
                        console.log("pushing treated comment");
                        treatedComments.push(treatedComment);
                        callback2();
                    })
                }, function(err2){
                    if(err2){
                        console.log("errorprocessing one of the comments");
                        console.log(err2);
                    }
                    // add all info from the author here
                    treatedMessage = {
                        date: element.date,
                        comments: treatedComments,
                        author: element.author,
                        recipient: element.recipient,
                        message: element.message,
                        userName: authorUser.userName,
                        avatar: authorUser.profil.avatar,
                        editable: false
                    };
        
                    // Check if admin or author for editing
                    if(req.user.admin || req.user.id == element.author){
                        treatedMessage.editable = true;
                    }
                    console.log("pushing treated message");
                    modifiedArray.push(treatedMessage);
                    callback();
                })
            });
        }, function(err){
            if(err){
                console.log("error")
                res.status(500).json({error: err});
            } else {
                console.log("sending messages");
                res.json(modifiedArray);
            }
        });
    })
};

// Handles posting a new message
exports.new = function (req, res) {
    console.log("entered POST 'api/messages' route, execution exports.new on messagesCtrl.js");
    if(!req.user){
        return res.status(403).json({error: "not logged in"});
    }
    console.log("req.user: ");
    console.log(req.user);
    console.log("req.body: ");
    console.log(req.body);

    // 1) find recipient
    User.findById(req.user.id, function (err, user) {
        if (err) {
            res.send(err);
            console.log(err);
        } 
        if (!user){
            return res.status(404).json({error: "recipient not found"});
        };

        // 2) check if friend of author
        if (!user.friends.find(element => element.id.equals(req.body.recipient) && element.status === "confirmed")
            && req.body.recipient !== req.body.author && !req.user.admin){
            return res.json({message: "Vous êtes pas amis avec cette personne", type:"error"});            
        }

        const message = {
            author: req.body.author,
            recipient: req.body.recipient,
            message: req.body.message,
            date: new Date(),
            comments: []
        };
        
        // 3) update author's scrapbook.posted
        user.scrapbook.posted.push(message);
        if(req.body.author === req.body.recipient){
            user.scrapbook.received.push(message);
            user.save().then(()=>{
                return res.json({message: "Le message a été posté!", type: "success"});
            })
        }
        user.save().then(user => {
            console.log("posted on " + user.userName + " scrapbook.posted");

            // 4) update recipient's scrapbook.received
            User.findById(req.body.recipient, function(err, user2){
                if(err){
                    return res.status(500).json({error: "something went wrong when posting"});
                }
                if(!user2){
                    return res.status(404).json({error: "user not found when posting"});
                }
                user2.scrapbook.received.push(message);
                user2.save().then(result => {
                    console.log("posted on " + result.userName + " scrapbook.received");

                    // 5) update admin's statistics
                    //  TO DO
                    
                    // 6) Check if recipient is connected to notify via socket
                    //  TO DO

                    // 7) Send email is recipient has preference
                    let html = "<h3>Matrimap</h3><h4>Nouveau message pour vous!</h4><p>Bonjour. " + req.user.userName + " a posté un nouveau message sur votre mur. Connectez-vous pour voir ce qu'il(elle) vous a dit.</p><p>A bientôt!</p><p>Equipe Matrimap</p>"
    
                    mailer.sendHtmlMail(user2.emailAddress, "Nouveau Message sur votre Mur", html);

                    // 8) Send response to client
                    return res.json({message: "Le message a été posté!", type: "success"});
                })
            });
        })
        // postMessage(req.body)
        // .then(() => {
        //     console.log("sending response..");
        //     res.json({
        //         success: true,
        //         messagePosted: req.body
        //     })
        // });
    });
}

exports.newComment = function(req, res){
    console.log("entered POST 'api/messages/comment' route, execution exports.newComment on messagesCtrl.js");
    if(!req.user){
        return res.status(403).json({error: "not logged in"});
    }
    console.log("req.user: ");
    console.log(req.user);
    console.log("req.body: ");
    console.log(req.body);

    User.findById(req.body.recipient, function(err, user){
        if (err) {
            console.log(err);
            res.send(err);
        } 
        if (!user){
            return res.status(404).json({error: "recipient not found"});
        };

        // check if author is friend of recipient or admin
        if (!user.friends.find(element => element.id.equals(req.user.id) && element.status === "confirmed")
            && req.body.recipient !== req.body.author && !req.user.admin){
            return res.json({message: "Cette personne n'est pas votre amis", type:"error"});           
        }

        //postComment(req.body)

        // Post comment on message's author's scrapbook > posted message
        User.findById(req.body.message.author, function(err, user2){
            // find the message in scrapbook.posted
            let messageInQuestion = user2.scrapbook.posted.find(element => {
                return element.message === req.body.message.message
            });
            if(!messageInQuestion){
                console.log("message not found on author's posted messages!");
                return res.json({message: "Quelque chose n'a pas fonctionné, désolé!", type:"error"});
            } else {
                messageInQuestion.comments.push({
                    from: req.body.author,
                    comment: req.body.newComment,
                    date: new Date()
                });
                user2.save().then(() => {
                    //post on recipient's scrapbook.received
                    console.log("posted comment on author's posted messages");
                    User.findById(req.body.recipient, function(err, user3){
                        let messageInQuestion2 = user3.scrapbook.received.find(element => {
                            return element.message === req.body.message.message
                        });
                        if(!messageInQuestion2){
                            console.log("message not found on recipient's received messages!");
                            res.json({message: "Quelque chose n'a pas fonctionné, désolé!", type:"error"});
                        } else {
                            messageInQuestion2.comments.push({
                                from: req.body.author,
                                comment: req.body.newComment,
                                date: new Date()
                            });
                            user3.save().then(()=>{
                                console.log("posted comment on recipient's received messages");
                                res.json({message: "Le commentaire a été posté!", type:"success"});
                            });
                        }
                    })
                })
            }
        });
    })
}

exports.deleteMessage = function(req, res){
    console.log("entered POST 'api/messages/delete' route, execution exports.deleteMessage on messagesCtrl.js");
    if(!req.user){
        return res.status(403).json({error: "not logged in"});
    }
    console.log("req.user: ");
    console.log(req.user);
    console.log("req.body: ");
    console.log(req.body);

    // Check if authority to delete
    if(!(req.user.admin || req.user.id === req.body.author || req.user.id === req.body.recipient)){
        console.log("Access denied to delete message")
        res.status(403).json({error: "you don't have the priviledge to delete this message"});
    }

    // get the author's scrapbook
    User.findById(req.body.author, function(err, user){
        if(err){
            console.log(err);
            res.status(500).json({error: err});
        }
        // find the message
        let messageInQuestion = user.scrapbook.posted.find(element => {
            return element.message === req.body.message
        });
        if(!messageInQuestion){
            console.log("message not found on author's posted messages!");
            return res.json({message: "Une erreur s'est produit", type: "error"});
        }
        // delete the message from array
        let index = user.scrapbook.posted.indexOf(messageInQuestion);
        user.scrapbook.posted.splice(index, 1);
        // save and proceed to deleting from recipient scrapbook
        user.save().then(()=>{
            User.findById(req.body.recipient, function(err, user2){
                let messageInQuestion2 = user2.scrapbook.received.find(element => {
                    return element.message === req.body.message
                });
                if(!messageInQuestion2){
                    console.log("message not found on recipient's received messages!");
                    return res.json({message: "Une erreur s'est produit", type: "error"});
                }
                let index = user2.scrapbook.received.indexOf(messageInQuestion2);
                user2.scrapbook.received.splice(index, 1);
                user2.save().then(()=>{
                    return res.json({message: "Le message a bien été supprimé", type: "success"});
                })
            });
        })
    });

    // deleteMessage(req.body).then(() => {
    //     res.json({type: "success", message: "Le message a bien été supprimé!"});
    // })
}

/******************************* 
******AUXILIARY FUNCTIONS*******
*******************************/

// const getUsernames = async function(array, requester){
//     modifiedArray = new Array();
//     console.log("started messages modification")
//     let treatedMessage;
//     // Looping through each message
//     for (const element of array) {
//         // finding the author info of each message
//         User.findById(element.author, (err, authorUser) => {
//             if(err){
//                 console.log("ERROR!");
//                 console.log(err);
//             }

//             // finding the comments usernames
//             let treatedComments = new Array();
//             for(const comment of element.comments){
//                 User.findById(comment.from, function(err, commentAuthor){
//                     if(err){
//                         console.log(err)
//                     }
                    
//                     let treatedComment = {
//                         from: comment.from,
//                         comment: comment.comment,
//                         date: comment.date,
//                         userName: commentAuthor.userName
//                     }
//                     console.log("pushing treated comment");
//                     treatedComments.push(treatedComment);
//                 })
//             }

//             // add all info from the author here
//             treatedMessage = {
//                 date: element.date,
//                 comments: treatedComments,
//                 author: element.author,
//                 recipient: element.recipient,
//                 message: element.message,
//                 userName: authorUser.userName,
//                 avatar: authorUser.profil.avatar,
//                 editable: false
//             };

//             // Check if admin or author for editing
//             if(requester.admin || requester.id == element.author){
//                 treatedMessage.editable = true;
//             }
//             console.log("pushing treated message");
//             modifiedArray.push(treatedMessage);
//         });
//     }
//     console.log("done changing messages");
//     return modifiedArray;
// }

// const postMessage = async function (form){
//     console.log("posting message...");
//     const message = {
//         author: form.author,
//         recipient: form.recipient,
//         message: form.message,
//         date: new Date(),
//         comments: []
//     };
//     await User.findById(form.author, function(err, doc){
//             if(err){
//                 return res.status(500).json({error: "something went wrong when posting"});   
//                 // console.log("error on posting: " + err);
//                 // return false;
//             }
//             if(!doc){
//                 return res.status(404).json({error: "user not found when posting"});
//             }
//             doc.scrapbook.posted.push(message);
//             doc.save().then(async result => {
//                 console.log("posted on " + result.userName + " scrapbook.posted: ");
//                 await User.findById(form.recipient, function(err, doc2){
//                     if(err){
//                         return res.status(500).json({error: "something went wrong when posting"});   
//                         // console.log("error on posting: " + err);
//                         // return false;
//                     }
//                     if(!doc2){
//                         return res.status(404).json({error: "user not found when posting"});
//                     }
//                     doc2.scrapbook.received.push(message);
//                     doc2.save().then(result => {
//                         console.log("posted on " + result.userName + " scrapbook.received: ");
//                     })
//                 });
//             })
//     });
// }

// const postComment = async function(body) {
//     //post on author
//     await User.findById(body.message.author, function(err, user){
//         let messageInQuestion = user.scrapbook.posted.find(element => {
//             return element.message === body.message.message
//         });
//         if(!messageInQuestion){
//             console.log("message not found on author's posted messages!");
//         } else {
//             messageInQuestion.comments.push({
//                 from: body.author,
//                 comment: body.newComment,
//                 date: new Date()
//             });
//             user.save().then(() => {
//                 //post on recipient
//                 console.log("posted comment on author's posted messages");
//                 User.findById(body.recipient, async function(err, user){
//                     let messageInQuestion = user.scrapbook.received.find(element => {
//                         return element.message === body.message.message
//                     });
//                     if(!messageInQuestion){
//                         console.log("message not found on recipient's received messages!");
//                     } else {
//                         messageInQuestion.comments.push({
//                             from: body.author,
//                             comment: body.newComment,
//                             date: new Date()
//                         });
//                         await user.save();
//                         console.log("posted comment on recipient's received messages");
//                     }
//                 })
//             })
//         }
//     });
// }