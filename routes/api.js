const router = require('express').Router();
//const contactController = require('../contactController');
const messagesController = require('../controllers/messagesCtrl');
const userController = require('../controllers/userCtrl');
const friendsController = require('../controllers/friendsCtrl');
const discussionController = require('../controllers/discussionCtrl');
const recommendController = require('../controllers/recommendCtrl');

// Set default API response
router.get('/', function (req, res) {
    res.json({
        status: 'API Working',
        message: 'Welcome to Matrimap API!'
    });
});

// For my messages or posting a message
router.route('/messages')
    .get(messagesController.view)
    .post(messagesController.new);
// For deleting a message
router.route('/messages/delete').post(messagesController.deleteMessage);
// For new comment
router.route('/messages/comment').post(messagesController.newComment);
// For a member scrapbook
router.route('/messages/:id').get(messagesController.view);


// For a friends list
router.route('/friends/invite/:id').get(friendsController.invite);
// To accept a friend request
router.route('/friends/accept/:id').get(friendsController.accept);
// To recommend a friend to another friend
router.route('/friends/recommend').get(friendsController.recommend);
// To unfriend a a friend
router.route('/friends/unfriend/:id').get(friendsController.unfriend);
// to ignore a recommendation or invitation
router.route('/friends/ignore/:id').get(friendsController.ignore);
// To get a friends list
router.route('/friends/:id').get(friendsController.view);


//For my profile
router.route('/profile').get(userController.myProfile).post(userController.updataMyProfile);
// update preferences
router.route('/profile/prefs').post(userController.updataMyPrefs);
// For a member profile
router.route('/profile/:id').get(userController.view);
//searching a member
router.route('/search').get(userController.search);


router.route('/discussions')
    // For my list of discussions 
    .get(discussionController.view)
    //creating a discussion
    .post(discussionController.new);

// Deleting a message from a post
router.route('/discussions/delete/:id').post(discussionController.deleteMessage);

router.route('/discussions/:id')
    // Post a message in a discussion
    .post(discussionController.post)
    // deleting a whole discussion
    .delete(discussionController.delete);

router.route('/recommend').get(recommendController.myRecommends).post(recommendController.updateMyRecommends)
router.route('/recommend/:id').get(recommendController.get);

// Export API routes
module.exports = router;