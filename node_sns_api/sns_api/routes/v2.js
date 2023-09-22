/*
    <v1과 차이점>
    1. (routes) 미들웨어(apiLimiter) 추가
    2. (controller) 토큰 유효기간: 30분
*/

const express = require('express');

// 👇 (미들웨어) 토큰 검증, 사용량제한 
const { verifyToken, apiLimiter, premiumApiLimiter, corsWhenDomainMatches } = require('../middlewares');
const { createToken, tokenTest, getMyPosts, getPostsByHashtag, getMyLikes } = require('../controllers/v2');

// 모델
const { Domain } = require('../models')

const router = express.Router();

// CORS 허용 (등록된 도메인이면, CORS 허용)
router.use(corsWhenDomainMatches);


// 👇 도메인에 따라 사용량 제한 다름
router.use(async (req, res, next) => {
    const domain = await Domain.findOne({ where: {host: new URL(req.get('origin')).host} });
    // free 도메인 (1번/1분)
    if (domain.type == 'free') { 
        console.log('무료😁'); 
        apiLimiter(req, res, next) 
    }
    // premium 도메인 (3번/1분)
    else { 
        console.log('프리미엄😁'); 
        premiumApiLimiter(req, res, next) 
    }
})

// (JWT 생성/발급) POST /v2/token 
router.post('/token', createToken); // verifyToken 미들웨어 없는 경우는 토큰 생성할 때이므로, apiLimiter에서 무료 사용자로 간주

// (JWT 검증 테스트) POST /v2/test   
router.get('/test', verifyToken, tokenTest); // verifyToken이 먼저 나와야, apiLimiter에서 사용자가 "무료/프리미엄"인지 구분 가능 (참고: middlewares/apiLimiter)

// (내 포스트) GET /v2/posts/my
router.get('/posts/my', verifyToken, getMyPosts);

// (해시태그 검색) GET /v2/posts/hashtag/:title
router.get('/posts/hashtag/:title', verifyToken, getPostsByHashtag);

// (좋아요 게시글 조회) GET v2/posts/myLikes
router.get('/posts/myLikes', verifyToken, getMyLikes);

module.exports = router;

