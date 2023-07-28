const { User, Post, Hashtag, Comment, Reply } = require('../models');

// 프로필
exports.renderProfile = (req, res) => {
  res.render('profile', { title: '내 정보 - NodeBird' });
};

// 회원가입
exports.renderJoin = (req, res) => {
  res.render('join', { title: '회원가입 - NodeBird' });
};


// Post 업데이트 화면
exports.renderUpdate = async(req, res) => {
    try{    
        const post = await Post.findOne({ where: { id: req.params.postId }}) // 원래 게시글
        res.render('update', { title: '업데이트 - NodeBird', post});
    } catch(error){

    }
  };




// 메인화면
exports.renderMain = async (req, res, next) => {
  try {
    // Post 가져옴
    const posts = await Post.findAll({
      // 포함 (order 사용할 수 없음)
      include: [
        {
          model: User,                // 작성자  
          as: 'User',                 // 👈 User와 여러 관계를 가지므로, as로 명시               
          attributes: ['id', 'nick'],
        },
        {
          model: Hashtag,
          attributes: ['title'],
        },
        {
          model: Comment,             // 댓글
          include: [
            { model: User },          // 댓글 작성자
            { model: Reply,
              include: [
                { model: User }
              ] }
          ],   
        }
      ],
      order: [
        [['createdAt', 'DESC']],      // Post
        [{ model: Comment }, 'createdAt', 'ASC'], // 👈👈 Comment (include 내부에서 order 사용할 수 없음)
        [{ model: Comment, include: [{ model: Reply}], }, { model: Reply}, 'createdAt', 'ASC'],  // 대댓글을 createdAt 기준 오름차순으로 정렬
      
      ]
    });
    res.render('main', {
      title: 'NodeBird',
      twits: posts,
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
}

// 해시태그 검색 (/hashtag?키=값)
exports.renderHashtag = async (req, res, next) => {
    // 1. 검색어 
    const query = req.query.hashtag;        // 쿼리스트링 => req.query.키 ( <form>에서 method의 기본값이 GET이므로, 쿼리스트링으로 전달 됨 (서버에서 req.query.hashtag로 받음) )
    if (!query) {
      return res.redirect('/');
    }
    try {
      // 2. 해당 Hashtag의 Post들
      const hashtag = await Hashtag.findOne({ where: { title: query } });
      let posts = [];
      if (hashtag) {
        posts = await hashtag.getPosts(
          { 
            include: [
              { model: User, as: 'User', attributes: ['id', 'nick'], }, // 👈 User와 여러 관계를 가지므로, 반드시 as로 명시   
              { model: Hashtag, attributes: ['title'] }, 
              { model: Comment,     // 댓글
                include: [ {model: User}, { model: Reply, include: [{ model: User }]}]
              },
            ],    
            order: [
              [['createdAt', 'DESC']],      // Post
              [{ model: Comment }, 'createdAt', 'ASC'], // 👈👈 Comment (include 내부에서 order 사용할 수 없음)
              [{ model: Comment, include: [{ model: Reply}], }, { model: Reply}, 'createdAt', 'ASC'],  // 대댓글을 createdAt 기준 오름차순으로 정렬
            ]
          }
        );
      }
      return res.render('main', {
        title: `${query} | NodeBird`,
        twits: posts,
      });
    } catch (error) {
      console.error(error);
      return next(error);
    }
};