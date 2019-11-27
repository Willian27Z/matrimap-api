const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;
const DiscussionMessageSchema = new Schema({
    "_id": false,
    author: {
        type: ObjectId,
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
    }
});

module.exports = DiscussionMessageSchema

//module.exports = DiscussionMessage = mongoose.model('DiscussionMessage', DiscussionMessageSchema);