const express = require('express');
const { sendMessage, getMessages, deleteMessage, markSeen } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, sendMessage);
router.get('/:bookingId', protect, getMessages);
router.delete('/:messageId', protect, deleteMessage);
router.patch('/:bookingId/seen', protect, markSeen);

module.exports = router;
