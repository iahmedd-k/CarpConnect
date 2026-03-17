const express = require('express');
const { getUserProfile, getCommunityData } = require('../controllers/userController');

const router = express.Router();

router.get('/community', getCommunityData);
router.get('/:id/profile', getUserProfile);

module.exports = router;
