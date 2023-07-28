const express = require('express');

const { isLoggedIn } = require('../middlewares');
const { follow, unfollow } = require('../controllers/user');

const router = express.Router();

// POST /user/:id/follow (팔로우)
router.post('/:id/follow', isLoggedIn, follow);         // req.params.id => 팔로우하려는 id

// POST /user/:id/unfollow (언팔로우)
router.post('/:id/unfollow', isLoggedIn, unfollow);         // req.params.id => 팔로우하려는 id

module.exports = router;