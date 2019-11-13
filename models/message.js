const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Comments = require('./comment.js');
const ObjectId = mongoose.Schema.Types.ObjectId;
const MessageSchema = new Schema({
    user: {
        type: ObjectId, // for messages posted: this is who the user posted to | for messages received: from whom
        required: true
    },
    message: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    comments: [Comments]
});

module.exports = MessageSchema;
//module.exports = Message = mongoose.model('Message', MessageSchema);