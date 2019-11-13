const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;
const CommentSchema = new Schema({
    from: {
        type: ObjectId,
        required: true
    },
    comment: {
        type: String,
        required: true
    }
});

module.exports = CommentSchema;
//module.exports = Comment = mongoose.model('Comment', CommentSchema);