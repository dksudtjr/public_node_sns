const express = require('express');
const { searchByHashtag, getMyPosts, test, myLikes, renderMain } = require('../controllers');

const router = express.Router();

// (JWT 검증 테스트) POST /test
router.get('/test', test);

// (내 포스트들) GET /myposts
router.get('/myposts', getMyPosts);

// (해시태그 검색) GET /search/:hashtag
router.get('/search/:hashtag', searchByHashtag);

// (좋아요 게시글 조회) GET /myLikes
router.get('/myLikes', myLikes);

router.get('/', renderMain);

module.exports = router;