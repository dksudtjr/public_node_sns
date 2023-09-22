/*
    <v1과 차이점>
    1. (routes) 미들웨어(apiLimiter) 추가
    2. (controller) 토큰 유효기간: 30분
*/

const jwt = require('jsonwebtoken');
const { Domain, User, Post, Hashtag } = require('../models');

// 👇 (JWT 생성/발급) POST /v2/token 
exports.createToken = async (req, res) => {
  const { clientSecret } = req.body;
  try {
    const domain = await Domain.findOne({
      where: { clientSecret },
      include: {
        model: User,
        attribute: ['nick', 'id'],
      },
    });
    // 1. 등록된 도메인 X => 에러
    if (!domain) {
      return res.status(401).json({
        code: 401,
        message: '등록되지 않은 도메인입니다. 먼저 도메인을 등록하세요',
      });
    }
    // 2. 등록된 도메인 O => JWT 생성
    const token = jwt.sign({
      id: domain.User.id,
      nick: domain.User.nick,
    }, process.env.JWT_SECRET, {
      expiresIn: '30m',                         // 👈 30분
      issuer: 'nodebird',
    });
    // JWT 발급
    return res.json({
      code: 200,
      message: '토큰이 발급되었습니다',
      token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: 500,
      message: '서버 에러',
    });
  }
};

// 👇 (JWT 검증 테스트) POST /v2/test 
exports.tokenTest = (req, res) => {
  res.json(res.locals.decoded);                  // res.locals.decoded <= verifyTokne 미들웨어에서 넘겨줌
};

// 👇 (내 포스트) GET /v2/posts/my
exports.getMyPosts = (req, res) => {
  Post.findAll({ where: { userId: res.locals.decoded.id } })    // res.locals.decoded <= verifyTokne 미들웨어에서 넘겨줌
    .then((posts) => {
      console.log(posts);
      res.json({
        code: 200,
        payload: posts,
      });
    })
    .catch((error) => {
      console.error(error);
      return res.status(500).json({
        code: 500,
        message: '서버 에러',
      });
    });
};

// 👇 (해시태그 검색) GET /v2/posts/hashtag/:title
exports.getPostsByHashtag = async (req, res) => {
  try {
    // 해시태그
    const hashtag = await Hashtag.findOne({ where: { title: req.params.title } });      // 파라미터 (/v2/posts/hashtag/:title)
    if (!hashtag) {
      return res.status(404).json({
        code: 404,
        message: '검색 결과가 없습니다',
      });
    }
    // 해당 해시태그의 포스트들
    const posts = await hashtag.getPosts();
    return res.json({
      code: 200,
      payload: posts,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: 500,
      message: '서버 에러',
    });
  }
};

// 👇 (좋아요 게시글 조회) GET /v2/posts/mylikes
exports.getMyLikes = async (req, res) => {
    try {
      const user = await User.findOne({ where: { id: res.locals.decoded.id }});
      if (user) {
        const posts = await user.getLikePosts({
            include: [{ model: User, as: 'User', attributes: ['id', 'nick'], },]
        });
        return res.json({
            code: 200,
            payload: posts,
        });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        code: 500,
        message: '서버 에러',
      });
    }
  };