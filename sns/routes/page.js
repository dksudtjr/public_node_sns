const express = require('express');
const { isLoggedIn, isNotLoggedIn } = require('../middlewares');
const { renderProfile, renderJoin, renderMain, renderHashtag, renderUpdate } = require('../controllers/page');

const router = express.Router();

router.use((req, res, next) => {                                            // 모든 라우터에 적용되는 미들웨어
  // 명시적으로 전달하지 않아도, 템플릿에서 접근 가능
  res.locals.user = req.user;                                               // 해당 요청에서만 데이터 유지 => 템플릿에서 사용 가능 (명시적으로 안 넘겨도 됨)
  // passport에서 req.user에 Followers, Followings, LikePost 추가함
  res.locals.LikePostsIdList = req.user?.LikePosts?.map(post=>post.id) || []
  res.locals.followerCount = req.user?.Followers?.length || 0;              // 옵셔널 체이닝(?) => undefined/null 속성 조회 시, 에러 안 남
  res.locals.followingCount = req.user?.Followings?.length || 0;
  res.locals.followingIdList = req.user?.Followings?.map(f => f.id) || [];
  next();
});

router.get('/profile', isLoggedIn, renderProfile);

router.get('/join', isNotLoggedIn, renderJoin);

router.get('/update/:postId', isLoggedIn, renderUpdate);    // Post 업데이트 화면

router.get('/', renderMain);

router.get('/hashtag', renderHashtag);      // http://localhost:8001/hashtag?키=값

module.exports = router;    