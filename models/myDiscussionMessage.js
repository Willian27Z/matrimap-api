const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

// The user's messages schema, contained in user's object
const MyDiscussionMessageSchema = new Schema({
    discussion: {
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

module.exports = MyDiscussionMessageSchema;
//module.exports = MyDiscussionMessage = mongoose.model('MyDiscussionMessage', MyDiscussionMessageSchema);