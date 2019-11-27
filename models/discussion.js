const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;
const messages = require('./discussionMessage');

// A discussion object
const DiscussionSchema = new Schema({
    owner: {
        type: ObjectId, // who can delete this discussion
        required: true
    },
    participants: [ObjectId],
    subject: {
        type: String,
        required: true
    },
    messages: [messages],
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = Discussion = mongoose.model('Discussion', DiscussionSchema, 'discussions');