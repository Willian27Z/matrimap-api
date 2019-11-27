const SocketIO = require("socket.io");
const User = require("./models/user");
const Discussion = require("./models/discussion");
const ObjectId = require("mongoose").Types.ObjectId;

const connectedUsers = new Array();
const chatRooms = new Array();

const applySocketIo = function(httpServer){

    const io = new SocketIO(httpServer);
    
    sendStats(io);

    io.on('connection', function (socket) {
        
        //console.log("someone connected via websocket!");
        //console.log(socket.id);
        socket.emit('welcome', { hello: 'from Matrimap API !' });
        socket.on('message', function (data) {
            console.log("message from websocket:")
            console.log(data);
        });

        socket.on("identify", function (data){
            // {id: id, username: username, email: email}
            if (!connectedUsers.find(e => e.id === data.id)){
                connectedUsers.push({
                    id: data.id,
                    username: data.username,
                    email: data.email,
                    socket: socket,
                    roomID: null,
                    status: null,
                    waiting: null,  // when waiting for someone to accept an invitation
                    join: null,     // when waiting to accep an invitation
                    inContact: null,// when accepted an invitation (both)
                });
                console.log("user " + data.username + " connected to socket.io");
            } else {
                console.log("user " + data.username + " already registered");
            }

            // notify friends
            notifyFriends(data.id, socket, true);
            // notify admins?
        })
        
        socket.on('check-friend', function(data){
            console.log("checking friend");
            let friendSearched = connectedUsers.find(e => e.id === data.id)
            if(friendSearched){
                socket.emit("friend", {id: data.id, connected: true, status: friendSearched.status});
            } else {
                socket.emit("friend", {id: data.id, connected: false});
            }
        })

        socket.on("start-chat", function(data){
            // userA = "en attente", userB = "rejoindre"
            let userA = connectedUsers.find(e => e.id === data.userA)
            let userB = connectedUsers.find(e => e.id === data.userB)
            let roomID = userA.id + "&" + userB.id
            
            if(userA.roomID || userB.roomID){
                console.log("one of the users is busy!");
                userA.socket.emit("friend-busy", userB.username);
            } else {
                // both sockets join a room
                userA.roomID = roomID;
                userA.socket.join(roomID);
                userB.roomID = roomID;
                userB.socket.join(roomID);
    
                // create chatRoom "instance"
                chatRooms.push(roomID);
    
                // send room id, user status "en attente", friend status "rejoindre"
                io.to(roomID).emit("chatRoomEntered", roomID);
                // io.to(roomID).emit("chatRoomEntered", {
                //     roomID: roomID, 
                //     users: [{
                //         id: userA.id,
                //         username: userA.username
                //         },{
                //         id: userB.id,
                //         username: userB.username
                //     }]
                // });
            }
        });

        socket.on("invite-chat", function(data){
            let userA = connectedUsers.find(e => e.id === data.userA) // who made the request
            let userB = connectedUsers.find(e => e.id === data.userB) // who should accept/refuse
            if(!userA.waiting && !userA.join && !userA.inContact && !userB.waiting && !userB.join && !userB.inContact){
                userA.waiting = userB;
                userB.join = userA;
                userB.socket.emit("chat-invitation", {id: userA.id, username: userA.username});
            } else {
                userA.socket.emit("user-busy");
            }
        });

        socket.on("accept-chat", function(data){
            let userA = connectedUsers.find(e => e.id === data.userA) // who accepted the request
            let userB = connectedUsers.find(e => e.id === data.userB) // who was waiting for the answer

            if(userA.join && userB.waiting && !userA.inContact && !userB.inContact){
                userA.inContact = userA.join;
                userA.join = null;
                console.log(userA.username  + " connected to " + userB.username);
                userA.socket.emit("in-contact", {id: userB.id, username: userB.username})
                userB.inContact = userB.waiting;
                userB.waiting = null;
                console.log(userA.username  + " connected to " + userB.username);
                userB.socket.emit("in-contact", {id: userA.id, username: userA.username});
            } else {
                userA.socket.emit("user-busy");
            }
        });

        socket.on("chat-message", function(data){
            let user = connectedUsers.find(e => e.id === data.author.id)
            let message = {
                author: data.author.username,
                message: data.message,
                date: data.date
            }
            user.inContact.socket.emit("chat-message", message);
            user.socket.emit("chat-message", message);

            // io.to(data.roomID).emit("chat-message", {
            //     author: data.author,
            //     message: data.message,
            //     date: data.date
            // });
        });

        socket.on("join-chat", function(data){
            //let otherAlreadySignedIn;
            console.log("annoucing " + data.username);
            io.to(data.roomID).emit("user-joined", {id: data.userID, username: data.username});
            // first loop just to see if the other is already there
            // connectedUsers.forEach(user => {
            //     if(user.status === data.roomID){
            //         otherAlreadySignedIn = user;
            //     }
            // });
        });

        socket.on("end-chat", function(id){
            let user = connectedUsers.find(e => e.id === id)
            if(user){
                user.socket.emit("close-contact", user.id);
                if(user.inContact){
                    user.inContact.socket.emit("close-contact", user.id);
                    user.inContact.inContact = null;
                    user.inContact = null;
                }
            }


            // io.to(data.roomID).emit("chat-ended", data.userID);
            // let index = chatRooms.indexOf(data.roomID);
            // if(index >= 0){
            //     chatRooms.splice(index, 1);
            // }
            // connectedUsers.forEach(user => {
            //     if(user.roomID === data.roomID){
            //         user.roomID = null;

            //     }
            // });
        });

        socket.on("disconnect", function() {
            let user = connectedUsers.find(e => e.socket.id === socket.id)
            

            // end chat if participated in one
            // if(user.roomID){
            //     io.to(user.roomID).emit("chat-ended", user.userID);
            //     let index = chatRooms.indexOf(user.roomID);
            //     if(index >= 0){
            //         chatRooms.splice(index, 1);
            //     }
            //     connectedUsers.forEach(user2 => {
            //         if(user2.roomID === user.roomID){
            //             user2.roomID = null;

            //         }
            //     });
            // }
            
            if(user){
                // notify friends
                notifyFriends(user.id, null, false);    
                if(user.waiting){
                    user.waiting.socket.emit("invitation-cancelled", user.id);
                    user.waiting.join = null;
                }
                if(user.join){
                    user.join.socket.emit("invitation-cancelled", user.id);
                    user.join.waiting = null;
                }
                if(user.inContact){
                    user.inContact.socket.emit("close-contact", user.id);
                    user.inContact.inContact = null;
                }
                console.log("user " + user.username + " disconnected from websocket");
                let index = connectedUsers.indexOf(user);
                connectedUsers.splice(index, 1);
            } else {
                console.log("user not found among connectedUsers");
            }

            // notify admins?
        })
    });

    console.log("Websocket listening!");
}



module.exports.listen = applySocketIo;


//**********AUXILIARY FUNCTION***********/

const notifyFriends = function(id, socket, connected){
    User.findById(id, function(err, user){
        let friends = user.friends.filter(e => e.status === "confirmed");    // ids are ObjectId, not strings

        connectedUsers.forEach(connectedUser => {
            if(friends.find(e => e.id.equals(connectedUser.id))){
                console.log("found friend online !");
                console.log(connectedUser.username);   
                connectedUser.socket.emit("friend", {id: id, connected: connected});
                if(connected){
                    socket.emit("friend", {id: connectedUser.id, connected: connected})
                }
            }
        })
    })
}

let statsTimer;
const sendStats = function(socketServer) {
    if(statsTimer){
        return;
    } else {
        statsTimer = setInterval( () => {
            console.log("Counting stats");
            let messages = 0;
            // get all users
            User.find({}, (err, docs) => {
                if(err){
                    console.log(err)
                } else if (!docs){
                    console.log("no users found?");
                }
                //console.log(docs);
                docs.forEach(doc => {
                    // add each received message to count
                    messages += doc.scrapbook.received.length;
                });
                // get all discussions
                Discussion.find({}, (err, discs) => {
                    if(err){
                        console.log(err)
                    } else if (!docs){
                        console.log("no discussions found?");
                    }
                    discs.forEach(discussion => {
                        // add each message to count    
                        messages += discussion.messages.length;
                    });
                    // console.log("stats:");
                    // console.log({messages: messages, onlineUsers: connectedUsers.length});
                    socketServer.sockets.emit("stats", {messages: messages, onlineUsers: connectedUsers.length});
                });
    
            })
        }, 10000);
    }

}