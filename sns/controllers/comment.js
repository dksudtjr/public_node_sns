const { User, Post, Hashtag, Comment, Reply } = require('../models');

// const jsonData = {
//   content,
//   userId,
//   postUserId,
//   postId,
//   commentId
// };


// POST /comment/:postId (댓글) 
exports.comment = async (req, res, next) => { // req.params.postId:  (댓글이 등록될) 게시물
  try { // (controllers/page) 메인화면 랜더링할 때, 프론트에 전달할 twits(posts)에 Comment를 include해야 함
      
      // 프론트에서 보낸 데이터(json) 
      const data = req.body;
      // Comment 생성 (Post, User 연결)
      const comment = await Comment.create({
        content: data.content,
        PostId: parseInt(data.postId, 10),
        UserId: parseInt(data.userId, 10),
      });
      res.send('success')
    } catch (error) {
    console.error(error);
    next(error);
  }
};


// POST /comment/reply/:commentId (대댓글)
exports.reply = async (req, res, next) => { // req.params.commentId: (대댓글이 등록될) 댓글
  try {
        const data = req.body;
        const reply = await Reply.create({
          content: data.content,
          PostId: parseInt(data.postId, 10),        // 게시글ID
          UserId: parseInt(data.userId, 10),        // 대댓글 작성자ID
        })
        await reply.setComment(parseInt(data.commentId, 10))
        res.send('success');
      } catch (error) {
      console.log(error);
      next(error);
  } 
};
