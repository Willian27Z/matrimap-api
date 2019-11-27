const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;
const CommentSchema = new Schema({
    "_id": false,
    from: {
        type: ObjectId,
        required: true
    },
    comment: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true,
        default: Date.now
    }
});

module.exports = CommentSchema;
//module.exports = Comment = mongoose.model('Comment', CommentSchema);