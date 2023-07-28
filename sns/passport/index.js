const passport = require('passport');
const local = require('./localStrategy');
const User = require('../models/user');
const Post = require('../models/post');

module.exports = () => {
  // 👇 1. (로그인) 세션 저장 => req.session
  passport.serializeUser((user, done) => {                      // (req.session) 세션에 저장  ...  (user:  passport.authenticate의 req.login이 user 전달함.)
    done(null, user.id);                                        // done(에러, 저장할 데이터)                                      
  });

  // 👇 2. (매 요청) 로그인한 user 객체 => req.user
  passport.deserializeUser((id, done) => {                      // (req.user) 생성 ... serializeUser에서 세션에 저장한 user.id가 첫번째 인자로 넘어옴
    User.findOne({ 
        where: { id },
        // Followers, Followings, LikePost 포함
        include: [
            {
                model: User,
                attributes: ['id', 'nick'],
                as: 'Followers'                                 // User와 관계를 여러개 가지면, 어떤 관계인지 명시해야 함
            },
            {
                model: User,
                attributes: ['id', 'nick'],
                as: 'Followings',
            },
            {
                model: Post,                // 👈 어디서든 "좋아요 한 게시글"에 접근하도록 req.user에 담아두자. (routes/page) res.locals.LikePostsIdList = req.user?.LikePosts?.map(post=>post.id) || []
                as: 'LikePosts',
            }
        ],
    })
      .then(user => done(null, user))                           // done(에러, req.user)
      .catch(err => done(err));
  });

  // 👇 passport.use(localStrategy)
  local();                                                      
};