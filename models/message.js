const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Comments = require('./comment.js');
const ObjectId = mongoose.Schema.Types.ObjectId;

// A Scrapbook message
const MessageSchema = new Schema({
    "_id": false,
    author: {
        type: ObjectId, // for messages posted: this is who the user posted to | for messages received: from whom
        required: true
    },
    recipient: {
        type: ObjectId, // for messages posted: this is who the user posted to | for messages received: from whom
        required: true
    },
    message: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    comments: [Comments]
});

module.exports = MessageSchema;
//module.exports = Message = mongoose.model('Message', MessageSchema);