const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { S3Client } = require('@aws-sdk/client-s3');
const multerS3 = require('multer-s3');

const { afterUploadImage, uploadPost, updatePost, readPost, deletePost, likePost, dislikePost, mylikePost } = require('../controllers/post');
const { isLoggedIn } = require('../middlewares');

const router = express.Router();

// 루트에 uploads폴더 생성
try {
  fs.readdirSync('uploads');
} catch (error) {
  console.error('uploads 폴더가 없어 uploads 폴더를 생성합니다.');
  fs.mkdirSync('uploads');
}

// // 👍 multer => Form(multipart/form-data) 데이터를 req.body 로 받음 (일반적인 form은 기본 body-parser가 알아서 받음)
// const upload = multer({                                                         // 👈 4가지 미들웨어 갖고 있음 (single, array, fields, none)
//   storage: multer.diskStorage({                                                 // 저장 위치
//     destination(req, file, cb) { // 루트의 uploads 폴더
//       cb(null, 'uploads/');
//     },
//     filename(req, file, cb) {
//       const ext = path.extname(file.originalname);
//       cb(null, path.basename(file.originalname, ext) + Date.now() + ext);
//     },
//   }),
//   limits: { fileSize: 5 * 1024 * 1024 },
// });

// 👇 S3 연결객체
const s3 = new S3Client({
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
    region: 'ap-northeast-2', 
});

// 👇 S3에 저장
const upload = multer({         // multer: (multipart/form-data) 데이터를 req.body로 받음
    storage: multerS3({             // 👈 multer에서 S3로 업로드
      s3,							// 👈 S3 연결객체 
      bucket: 'my-nodebird',		// 👈 버킷명
      key(req, file, cb) {		    // 👈 파일 저장 경로
        cb(null, `original/${Date.now()}_${file.originalname}`);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
  });
  
// POST /post/img  (사진 선택하자마자, 여기로 전송 됨)
router.post('/img', isLoggedIn, upload.single('img'), afterUploadImage);    // 👈 upload.single => 파일 1개 업로드 (req.body.속성명)

// POST /post/img  (사진 선택하자마자, 여기로 전송 됨)
router.post('/img', isLoggedIn, upload.single('img'), afterUploadImage);        // 👈 upload.single => 파일 1개 업로드 (req.body.속성명)

// POST /post  (생성)
const upload2 = multer();                                                       // 🙋‍♂️ multer 설정이 다르면, 새로 생성 (여기서는 글, 이미지URL 올림)
router.post('/', isLoggedIn, upload2.none(), uploadPost);                       // 👈 upload.none => 파일 없이 데이터 전송

// POST /post/update (업데이트)
const upload3 = multer(); 
router.post('/update', isLoggedIn, upload3.none(), updatePost);                 // req.params.postId:  업데이트하려는 게시물ID

// GET /post/:userId (해당 작성자의 게시글만 조회)
router.get('/:userId', readPost);

// GET /post/like/:postId (좋아요 등록)
router.get('/like/:postId', isLoggedIn, likePost);

// GET /post/dislike/:postId (좋아요 삭제)
router.get('/dislike/:postId', isLoggedIn, dislikePost);

// GET /post/mylike/:userId (좋아요 게시글 조회)
router.get('/mylike/:userId', isLoggedIn, mylikePost);

// POST /post/delete/:postId (삭제)
router.post('/delete/:postId', isLoggedIn, deletePost);      

module.exports = router;