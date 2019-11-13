const router = require('express').Router();
const contactController = require('../contactController');

// Set default API response
router.get('/', function (req, res) {
    res.json({
        status: 'API Working',
        message: 'Welcome to Matrimap API!'
    });
});

// Contact routes
router.route('/contacts')
    .get(contactController.index)
    .post(contactController.new);
    
router.route('/contacts/:contact_id')
    .get(contactController.view)
    .patch(contactController.update)
    .put(contactController.update)
    .delete(contactController.delete);

// Export API routes
module.exports = router;