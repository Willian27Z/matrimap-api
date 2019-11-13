const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;
//const Friend = require('./friend.js');
const Friend = new Schema({
    id: {
        type: ObjectId,
        required: true
    },
    status: {
        type: String,   // "confirmed", "recommandation", "invited"(invitation sent), "waiting"(invitation received)
        required: true
    }
});
const Message = require('./message.js');
const MyMessages = require('./myDiscussionMessage.js');
const UserSchema = new Schema({
    emailAddress:{
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    userName: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    joinedDate: {
        type: Date,
        default: Date.now
    },
    admin: {
        type: Boolean,
        required: true,
        default: false
    },
    lastLogin: {
        type: Date,
    },
    profil: {
        firstName : {
            type: String,
            required: true
        },
        lastName: {
            type: String,
            required: true
        },
        age: {
            type: Number,
        },
        genre: {
            type: String,
        },
        address: {
            type: String
        },
        avatar: {
            type: String
        },
        presentation: {
            type: String
        }
    },
    prefs: {
        private: {
            firstName : {
                type: Boolean,
                required: true,
                default: true
            },
            lastName: {
                type: Boolean,
                required: true,
                default: true
            },
            age: {
                type: Boolean,
                required: true,
                default: true
            },
            genre: {
                type: Boolean,
                required: true,
                default: true
            },
            address: {
                type: Boolean,
                required: true,
                default: true
            },
            scrapbook: {
                type: Boolean,
                required: true,
                default: true
            },
        },
        notifications: {
            privateMessage: {
                type: Boolean,
                required: true,
                default: true
            },
            newScrapbookPost: {
                type: Boolean,
                required: true,
                default: true
            },
            friendRecommendation: {
                type: Boolean,
                required: true,
                default: true
            },
            discussionInvitation: {
                type: Boolean,
                required: true,
                default: true
            },
            friendRequest: {
                type: Boolean,
                required: true,
                default: true
            }
        }
    },
    friends: [Friend],
    scrapbook: {
        posted: [Message],
        received: [Message]
    },
    discussions: {
        participant: [ObjectId],
        posted: [MyMessages]
    }
});
module.exports = User = mongoose.model('User', UserSchema);