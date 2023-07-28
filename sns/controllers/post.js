const { Post, Hashtag, User, Comment, Reply } = require('../models');

// 👇 0. [사진 업로드] 버튼 => 이미지 업로드 후, 이미지 주소를 클라이언트에게 다시 전송
exports.afterUploadImage = (req, res) => {
  console.log(req.file);                                    // 파일 데이터
  // res.json({ url: `/img/${req.file.filename}` });           // 이미지 미리보기 => 클라이언트에서 res.data.url로 접근  (views/main.html) (app.js - app.use('/img', express.static(path.join(__driname, 'uploads'))))
  // res.json({ url: req.file.location }); // 이미지 주소 (S3 버킷)
  const originalUrl = req.file.location;							// 👈 원본 
  const url = originalUrl.replace(/\/original\//, '/thumb/');		// 👈 썸네일
  res.json({ url, originalUrl });
};

// 👇 1. Post 생성
exports.uploadPost = async (req, res, next) => {
  try {
    // Post 생성 (multer가 req.body 받음)
    const post = await Post.create({
      content: req.body.content,
      img: req.body.url,
      UserId: req.user.id,                                  // FK
    });
    // Post에 Hashtag 연결
    const hashtags = req.body.content.match(/#[^\s#]*/g);
    if (hashtags) {
      // 여러 Hashtag 동시에 찾기
      const result = await Promise.all(                     // 프로미스 여러 개 동시에 실행 (모든 Promise가 완료될 때까지 기다린 후, 결과를 배열로 반환)
        hashtags.map(tag => {
          return Hashtag.findOrCreate({
            where: { title: tag.slice(1).toLowerCase() },
          })
        }),
      );
      await post.addHashtags(result.map(r => r[0]));        // r = [모델, 생성여부]
    }
    res.redirect('/');
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// 👇 2. Post 수정 => 1) 일단 원래 내용을 보내줌. 2) 수정
exports.updatePost = async (req, res, next) => {  
    try {
      // Post 수정 (성공하면, 1 반환)
      const success = await Post.update( 
        {
            content: req.body.content,
            img: req.body.url,
        },
        { where: {id: req.body.postId} }
      );
      // 수정한 Post 조회 (관계쿼리 사용하려면 post객체 필요)
      const post = await Post.findOne(
        { where: {id: req.body.postId} }
      );
      // Post에 Hashtag 연결
      const hashtags = req.body.content.match(/#[^\s#]*/g);
      if (hashtags) {
        // 여러 Hashtag 동시에 찾기
        const result = await Promise.all(                     // 프로미스 여러 개 동시에 실행 (모든 Promise가 완료될 때까지 기다린 후, 결과를 배열로 반환)
          hashtags.map(tag => {
            return Hashtag.findOrCreate({
              where: { title: tag.slice(1).toLowerCase() },
            })
          }),
        );
        await post.setHashtags([]);                           // 이전에 연결된 Hashtag들 모두 삭제
        await post.addHashtags(result.map(r => r[0]));        // r = [모델, 생성여부]
      }
      res.redirect('/');
    } catch (error) {
      console.error(error);
      next(error);
    }
  };

// 👇 3. 작성자의 Post들 조회
exports.readPost = async (req, res, next) => {
  try {
    const posts = await Post.findAll({
      where: {userId: req.params.userId},
      include: [
        {
          model: User,        // User도 가져옴 (id, nick 칼럼만)
          as: 'User',         // 👈 User와 여러 관계를 가지므로, 반드시 as로 명시               
          attributes: ['id', 'nick'],
        },
        {
          model: Hashtag,
          attributes: ['title'],
        },
        {
          model: Comment,           // 댓글
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
      ],
    });
    return res.render('main', {
      title: `NodeBird`,
      twits: posts,
      disableLink: 1, // 작성자 링크 제거
    })
  } catch (error) {
    console.error(error);
    return next(error);
  }
};

// 👇 4. Post 삭제
exports.deletePost = async (req, res, next) => {
  try {
    // 작성자의 Post들
    await Post.destroy({ where: {id: req.params.postId} });
    res.redirect('/');
  } catch (error) {
    console.error(error);
    return next(error);
  }
};

// 👇 5. 좋아요 등록
exports.likePost = async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { id: req.user.id }})
    if (user) {
      await user.addLikePosts(parseInt(req.params.postId, 10))
    }
    // 좋아요 1 증가
    const post = await Post.findByPk(parseInt(req.params.postId, 10));
    if (post) { 
      post.likes += 1;
      await post.save();
    }
    res.redirect('/');
  } catch (error) {
    console.error(error);
    return next(error);
  }
};

// 👇 6. 좋아요 삭제
exports.dislikePost = async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { id: req.user.id }})
    if (user) {
      await user.removeLikePosts(parseInt(req.params.postId, 10))
    }
    // 좋아요 1 감소
    const post = await Post.findByPk(parseInt(req.params.postId, 10));
    if (post) { 
      post.likes -= 1;
      await post.save();
    }
    // 이전 페이지 이동
    const previousPage = req.headers.referer || '/';
    res.redirect(previousPage);
  } catch (error) {
    console.error(error);
    return next(error);
  }
};

// 👇 7. 좋아요 게시글 조회
exports.mylikePost = async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { id: req.user.id }})
    if (user) {
      const posts = await user.getLikePosts({
        include: [
          {
            model: User,        // User도 가져옴 (id, nick 칼럼만)
            as: 'User',         // 👈 User와 여러 관계를 가지므로, 반드시 as로 명시               
            attributes: ['id', 'nick'],
          },
          {
            model: Hashtag,
            attributes: ['title'],
          },
          {
            model: Comment,           // 댓글
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
      })
      return res.render('main', {
        title: `NodeBird`,
        twits: posts,
        disableLink: 1, // 작성자 링크 제거
      })
    }
  } catch (error) {
    console.error(error);
    return next(error);
  }
};