const User = require('../models/user');
const Discussion = require('../models/discussion');
const async = require('async');
const mongoose = require('mongoose');
const mailer = require('../mailing');


// retrieve a list with all discussions which user participates or owns
exports.view = function(req, res){
    console.log("entered GET 'api/discussions' route, execution exports.view on discussionCtrl.js");

    // get all discussions that include this user as participant or owner
    Discussion.find({ $or : [
        { owner: req.user.id },
        { participants: req.user.id }
    ]}, function (err, docs){
        if(err){
            console.log(err);
            return res.json({message:"erreur au chargement des discussions", type: "error"})
        }

        // process each discussion: get usernames and avatars for owner and participants, apply for messages
        
        // create array with all user id's to avoid repeating query's
        const userIds = new Array();
        docs.forEach(doc => {
            // get owner id
            if(!userIds.includes(doc.owner.toString())){
                userIds.push(doc.owner.toString());
            }
            // get participants id
            doc.participants.forEach(participant => {
                if(!userIds.includes(participant.toString())){
                    userIds.push(participant.toString());
                }
            })
            // get messages' author id
            doc.messages.forEach(message => {
                if(!userIds.includes(message.author.toString())){
                    userIds.push(message.author.toString());
                }
            })
        });
        console.log("users list");
        console.log(userIds);
        // Loop through each user id to get their usernames and avatars and group in object in another array
        const usersInfos = new Array();
        async.each(userIds, function(userId, callback){
            User.findById(userId, function(err, user){
                
                let userInfo = {
                    id: userId,
                    username: user.userName,
                    avatar: user.profil.avatar
                }
                usersInfos.push(userInfo);
                callback();
            })
        }, function(err){
            if(err){
                return res.json({message: "Erreur pendant le traitement des discussions", type: "error"});
            } else {
                // for owner, participants and each message in a discussion, add the info and store in new response array
                const response = new Array();
                docs.forEach(doc => {
                    // get the owner info
                    let treatedOwner = usersInfos.find(e => doc.owner.equals(e.id));
                    // get the participants info
                    let treatedParticipants = new Array();
                    doc.participants.forEach(participant => {
                        let participantInfo = usersInfos.find(e => participant.equals(e.id));
                        treatedParticipants.push(participantInfo);
                    })
                    // get author's info for each message
                    let treatedMessages = new Array();
                    doc.messages.forEach(message => {
                        let authorInfo = usersInfos.find(e => message.author.equals(e.id));
                        let treatedMessage = {
                            author: authorInfo,
                            message: message.message,
                            date: message.date,
                            editable: false,
                        }
                        // check user rights for editing / deleting message
                        if(message.author.equals(req.user.id) || req.user.admin){
                            treatedMessage.editable = true;
                        }
                        treatedMessages.push(treatedMessage);
                    })
                    // prepare response
                    const treatedDiscussion = {
                        id: doc['_id'],
                        owner: treatedOwner,
                        participants: treatedParticipants,
                        subject: doc.subject,
                        messages: treatedMessages,
                        date: doc.date,
                        editable: false
                    }
                    // check user rights for editing / deleting
                    if( doc.owner.equals(req.user.id) || req.user.admin){
                        treatedDiscussion.editable = true;
                    }
                    response.push(treatedDiscussion);
                });
                // console.log(docs);
                return res.json(response);
            }
        });
    });
}

// create a new discussion
exports.new = function(req, res){
    console.log("entered POST 'api/discussions' route, execution exports.new on discussionCtrl.js");

// BODY
// {
//     friendOptions: Friends[],
//     owner: string,
//     participants: string[],
//     subject: string,
//     messageInitial: string,
//     date: Date,
// }
    const incoming = req.body;

    // check if user is friend with all participants
    User.findById(req.user.id, function(err, user){
        
        // check if each participant is a friend of user
        incoming.participants.forEach(participant => {
            // If one of them is not a confirmed friend
            if(!user.friends.find(friend => friend.id.equals(participant) && friend.status === "confirmed")){
                return res.json({message: "Un des personnes n'est pas votre amis", type: "error"});
            }
        })

        // check if user is a friend of each participant
        let friendCheck = true;
        async.each(incoming.participants, function(participant, callback){
            User.findById(participant, function(err, userParticipant){
                // if friend not found as confirmed, fail friend check
                if(!userParticipant.friends.find(friend => friend.id.equals(req.user.id) && friend.status === "confirmed")){
                    friendCheck = false;
                }
                callback();
            })
        }, function(err){
            if(err){
                return res.json({message: "Une erreur s'est produit. Essayez plus tard", type: "error"});
            }
            if(!friendCheck){
                return res.json({message: "Un des personnes n'est pas votre amis", type: "error"});
            } 
            // friend check passed
            // create new discussion
            const newDiscussion = new Discussion({
                owner: req.user.id,
                participants: incoming.participants,
                subject: incoming.subject,
                messages: [{
                    author: req.user.id,
                    message: incoming.messageInitial,
                    date: new Date()
                }],
                date: new Date()
            })
            newDiscussion.save().then(discussion => {
                console.log("nouvelle discussion crée:");
                console.log(discussion);
                
                // statistics, admin
                // send email to participants
                let html = "<h3>Matrimap</h3><h4>Nouvelle Conversation</h4><p>Bonjour. Vous avez été ajouté à une nouvelle conversation privée par " + req.user.userName + "</p><p>A bientôt!</p><p>Equipe Matrimap</p>"
                
                async.each(incoming.participants, function(part, callback){
                    User.findById(part, (err, doc)=>{
                        if(req.user.id !== part){
                            mailer.sendHtmlMail(doc.emailAddress, "Nouveau Message dans '" + discussion.subject +"'" , html);
                        }
                        callback();
                    })
                }, err => {
                    // send response
                    return res.json({message: "La discussion a été crée", type: "success"});
                })
                // notification
                

            });
        });
    });
}

// post a message in a discussion
exports.post = function(req, res){
    console.log("entered POST 'api/discussions/:id' route, execution exports.post on discussionCtrl.js");
    // {
    //     author: this.authService.getUserID(),
    //     message: this.messageToSend
    // }  
    // cehck that message is not empty
    if(!req.body.message.trim()){
        return res.json({message: "Pas de contenu à poster", type: "error"});
    }

    // check if user is a part of the discussion or admin
    Discussion.findById(req.params.id, function(err, discussion){
        if(!discussion.owner.equals(req.user.id) && !discussion.participants.includes(mongoose.Types.ObjectId(req.user.id)) && !req.user.admin){
            // no permission to post to this discussion
            return res.json({message: "Vous ne faites pas partie de cette discussion!", type: "error"})
        }

        // create message and post
        let message = {
            author: req.body.author,
            message: req.body.message,
            date: new Date()
        }

        discussion.messages.push(message);
        discussion.save().then(()=>{
            // statistics, admin
            
            // send email
            let html = "<h3>Matrimap</h3><h4>Nouveau Message</h4><p>Bonjour. L'utilisateur " + req.user.userName + " a posté un nouveau message dans la conversation '" + discussion.subject + "'</p><p>A bientôt!</p><p>Equipe Matrimap</p>"
            async.each(discussion.participants, function(part, callback){
                User.findById(part, (err, doc)=>{

                    mailer.sendHtmlMail(doc.emailAddress, "Nouveau Message dans '" + discussion.subject +"'" , html);
                    callback();
                })
            }, err => {
                return res.json({message: "Votre message a été envoyé", type: "success"});
            })
        })
    })
}

// delete a discussion
exports.delete = function(req, res){
    console.log("entered DELETE 'api/discussions/delete/:id' route, execution exports.delete on discussionCtrl.js");

    Discussion.findById(req.params.id, function(err, doc){
        
        // check if user has authority
        if(!doc.owner.equals(req.user.id) && !req.user.admin){
            return res.json({message: "Vous n'avez pas autorisation pour supprimer cette discussion", type: "error"});
        }

        // proceed to delete
        Discussion.findByIdAndDelete(req.params.id, function (err){
            if(err){
                console.log(err)
                return res.json({message: "Une erreur s'est produit", type: "error"});
            } else {
                return res.json({message: "La discussion a été supprimé", type: "success"});
            }
        });
    });
}

// delete a message
exports.deleteMessage = function(req, res){
    console.log("entered POST 'api/discussions/delete/:id' route, execution exports.deleteMessage on discussionCtrl.js");

    Discussion.findById(req.params.id, function(err, doc){
        
        // find message in discussion
        let message = doc.messages.find(e => e.message === req.body.message);
        if(!message){
            return res.json({message: "Message non trouvé", type: "error"});
        }

        // check if user has authority
        if(!message.author.equals(req.user.id) && !req.user.admin){
            return res.json({message: "Vous n'avez pas autorisation pour supprimer ce message", type: "error"});
        }

        // proceed to delete
        let index = doc.messages.indexOf(message);
        if(index >= 0){
            doc.messages.splice(index, 1);
            doc.save().then(()=>{
                // statistics?
                
                return res.json({message: "Le message a été supprimé", type: "success"});
            });
        } else {
            return res.json({message: "Message non trouvé", type: "error"});
        }
    });
}