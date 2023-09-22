const express = require('express');

const { verifyToken, deprecated } = require('../middlewares');
const { createToken, tokenTest, getMyPosts, getPostsByHashtag } = require('../controllers/v1');

const router = express.Router();

// 이후 모든 라우터에서 해당 미들웨어(deprecated)가 먼저 실행 됨
router.use(deprecated);


// (JWT 생성/발급) POST /v1/token 
router.post('/token', createToken);

// (JWT 검증 테스트) POST /v1/test   
router.get('/test', verifyToken, tokenTest);

// (내 포스트) GET /v1/posts/my
router.get('/posts/my', verifyToken, getMyPosts);

// (해시태그 검색) GET /v1/posts/hashtag/:title
router.get('/posts/hashtag/:title', verifyToken, getPostsByHashtag);


module.exports = router;