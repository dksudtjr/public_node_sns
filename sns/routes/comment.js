const express = require('express');

const { isLoggedIn } = require('../middlewares');
const { comment, reply } = require('../controllers/comment');

const router = express.Router();

// POST /comment/:postId (댓글)
router.post('/:postId', isLoggedIn, comment);         // req.params.postId:  (댓글이 등록될) 게시물

// POST /comment/reply/:commentId (대댓글)
router.post('/reply/:commentId', isLoggedIn, reply);         // req.params.commentId: (대댓글이 등록될) 댓글

module.exports = router;