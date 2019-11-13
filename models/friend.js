const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;
const FriendSchema = new Schema({
    id: {
        type: ObjectId,
        required: true
    },
    status: {
        type: String,   // "confirmed", "recommandation", "invited"(invitation sent), "waiting"(invitation received)
        required: true
    }
});

module.exports = Friend = mongoose.model('Friend', FriendSchema);