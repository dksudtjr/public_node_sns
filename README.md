# SNS

- 해당 프로젝트는 [http://13.124.2.128/](http://13.124.2.128/) 에서 이용할 수 있습니다.
- 코드는 [https://github.com/dksudtjr/public_node_sns](https://github.com/dksudtjr/public_node_sns)에서 확인할 수 있습니다.

<br><br>

# 🔍 Preview


![Untitled](assets/Untitled.png)

## 📖 Table of Contents


1. [프로젝트 소개](#1-프로젝트-소개)
    - [게발 환경](#개발-환경)
3. [SNS](#2-sns)
    - [주요 기능](#주요-기능)
    - [데이터베이스](#데이터베이스)
    - [로그인 (passport)](#로그인-passport)
    - [(서버의 하드로) 이미지 업로드](#서버의-하드로-이미지-업로드)
    - [팔로잉, 해시태그 검색](#팔로잉-해시태그-검색)
    - [댓글, 댓글의 댓글](#댓글-댓글의-댓글)
4. [이미지 리사이징 (S3, AWS Lambda)](#3-이미지-리사이징-s3-aws-lambda)
    - [(AWS S3로) 이미지 업로드](#AWS-S3로-이미지-업로드)
    - [Lambda (이미지 리사이징)](#lambda-이미지-리사이징)
5. [배포 (pm2, Redis)](#4-배포-pm2-Redis)
    - [pm2](#-pm2)
    - [connect-redis (레디스에 세션 저장)](#connect-redis-레디스에-세션-저장)
6. [API 서버](#5-API-서버)
    - [SOP, CORS, JWT](#SOP-CORS-JWT)
    - [로그인, 도메인 등록, clientSecret](#로그인-도메인-등록-clientsecret)
    - [JWT 생성/발급](#jwt-생성발급)
    - [세션에 JWT 저장 후, 전송](#세션에-jwt-저장-후-전송)
    - [API 서버 (조회 - 내 포스트, 해시태그)](#api-서버-조회---내-포스트-해시태그)
    - [CORS](#cors)


# 1. 프로젝트 소개

---

- Node.js를 활용하여 SNS 프로젝트를 개발 및 배포했습니다. 회원, 게시글, 팔로우, 좋아요, 댓글, 댓글의 댓글, 해시태그 등의 기능을 갖췄습니다. 또한 요청에 따라 JSON 데이터를 응답하도록 SNS 서버와 DB를 공유하는 별도의 API 서버를 개발했습니다.
- 주요 특징으로는 4가지가 있습니다.
    1. Node.js의 비동기 논블로킹 I/O 특성을 고려하여, 동시에 처리될 수 있는 작업들(여러 해시태그를 동시에 찾는 작업)을 백그라운드 스레드 풀을 이용해서 처리함으로써 성능을 향상시켰습니다.
    2. CPU 집약적인 작업(이미지 리사이징)을 `AWS Lambda`가 대신 실행하도록 개발하여 Javascript 싱글 스레드의 약점을 보완했습니다. 
    3. `pm2` 패키지의 클러스터 모드를 통해 CPU 코어 갯수만큼 서버 프로세스를 생성 및 실행했습니다. 이에 따라 여러 프로세스가 하나의 저장 공간을 공유하도록 Redis에 세션 데이터를 저장했습니다.
    4.  API 서버는 CORS를 통해 SOP 문제를 해결했으며, 세션 방식을 사용한 SNS 서버와 다르게 JWT를 통해 인증하도록 개발했습니다.


## 개발 환경

---

### **🛠️ 기술 스택**

- **Backend**: Node.js, Express.js
- **Database**: MySQL (via **`mysql2`**), Redis
- **Authentication**: Passport.js (**`passport-local`**), JSON Web Tokens
- **Middleware**: **`morgan`**, **`helmet`**, **`hpp`**
- **File Upload**: **`multer`**, **`multer-s3`**
- **Session**: **`express-session`**, **`connect-redis`**
- **ORM**: Sequelize
- **Template Engine**: Nunjucks
- **Cloud**: AWS Lightsail, AWS S3, AWS Lambda
- **Log Management**: Winston
- **Development Tools**: **`nodemon`**, **`dotenv`**, **`pm2`**

### **📦 프로젝트 의존성**

1. **SNS 프로젝트**

```json
"dependencies": {
  "@aws-sdk/client-s3": "^3.378.0",
  "bcrypt": "^5.1.0",
  "connect-redis": "^7.1.0",
  "cookie-parser": "^1.4.6",
  "dotenv": "^16.3.1",
  "express": "^4.18.2",
  "express-session": "^1.17.3",
  "helmet": "^7.0.0",
  "hpp": "^0.2.3",
  "morgan": "^1.10.0",
  "multer": "^1.4.5-lts.1",
  "multer-s3": "^3.0.1",
  "mysql2": "^3.5.1",
  "nunjucks": "^3.2.4",
  "passport": "^0.6.0",
  "passport-local": "^1.0.0",
  "pm2": "^5.3.0",
  "redis": "^4.6.7",
  "sequelize": "^6.32.1",
  "sequelize-cli": "^6.6.1",
  "winston": "^3.10.0"
},
"devDependencies": {
  "nodemon": "^3.0.1"
}
```

1. **API 서버**

```json
"dependencies": {
  "bcrypt": "^5.0.0",
  "cookie-parser": "^1.4.5",
  "cors": "^2.8.5",
  "dotenv": "^16.0.1",
  "express": "^4.17.1",
  "express-rate-limit": "^6.8.1",
  "express-session": "^1.17.1",
  "jsonwebtoken": "^9.0.1",
  "morgan": "^1.10.0",
  "mysql2": "^2.1.0",
  "nunjucks": "^3.2.1",
  "passport": "^0.6.0",
  "passport-kakao": "1.0.0",
  "passport-local": "^1.0.0",
  "sequelize": "^6.19.2",
  "uuid": "^8.3.2"
},
"devDependencies": {
  "nodemon": "^2.0.16"
}
```

### **🔄 배포 및 로드 밸런싱**

- 서버는 **`pm2`**를 이용해 배포 및 로드 밸런싱이 진행되었습니다. pm2의 클러스터 모드를 활용하여 CPU 코어 갯수만큼 서버 프로세스를 생성 및 실행했습니다.

### **☁️ 클라우드 환경**

- AWS Lightsail: DB(MySQL) 서버, 웹(Node.js) 서버
- AWS S3: 이미지 저장
- AWS Lambda: 이미지 리사이징 작업


# 2. SNS

---

## 주요 기능

---

- 로그인
- 게시글 작성
    - 단어 앞에 #이 있을 경우, 해시태그 생성
    - 리사이징된 이미지를 랜더링
    - 리사이징이 완료되지 않았을 경우, 원본 이미지를 랜더링
- 팔로우
    - ‘팔로우’ 하면, ‘팔로잉/팔로워’ 목록에 추가
- 좋아요
    - ‘좋아요’ 하면, ‘좋아요’ 목록에 추가
- 댓글
    - 게시글에 댓글 추가
- 댓글의 댓글
    - 댓글의 댓글 추가
- 해시태그
    - 해시태그를 통해 게시글 검색

## 데이터베이스

---

### **폴더 구조**

- `models`
    - `index.js`
        - sequelize 객체 (MySQL 연결객체)
        - db객체 (sequelize, 모델)
        - 모델들을 sequelize에 연결
    - `user.js`: 사용자
    - `post.js`: 게시글
    - `hashtag.js`: 해시태그 (태그로 검색하기 위해 별도 테이블)
- `config`
    - `config.json` - MySQL 접속 정보
- `app.js` - 모델을 MySQL 서버와 연결

### 테이블 관계 (N:M)

> 총 5개의 테이블이 생성된다. (User, Hashtag, Post, Follow(중간테이블), PostHashtag(중간테이블))
> 
1. 사용자 - 게시글 : `1:N` (`belongsTo`를 사용한 모델에 `foreignKey`컬럼 생성)
2. 사용자 - 사용자: `N:M`
    - 사용자 - 사용자(Followers): `1:N`
    - 사용자 - 사용자(Followings): `1:N`
3. 게시글 - 해시태그: `N:M` (서로 1:N 관계)

> N:M 관계
> 
> - `N:M` 관계는 서로가 서로를 `1:N` 관계로 갖고 있기 때문에, 자신의 외래키 컬럼에 서로의 `PK`를 갖는다.
> - 일반적으로 `N:M` 관계는 중간 테이블을 생성해서 관리한다. 중간 테이블은 각 테이블의 `FK`를 컬럼으로 갖는다.
- 해당 프로젝트에서는 팔로잉 기능을 위해 User모델과 User모델 간 `N:M` 관계가 있다.
- 같은 모델끼리 `N:M` 관계를 갖는다면, `as`로 구분 (`as`는 관계메서드에서 사용 (`user.getFollowers`))
- `trough`: 중간 테이블 (각 테이블의 외래키로 구성)
- `A.getFollowers()`
    - A의 `Followers` 찾으려면, ’팔로잉(FK) = A’인 사람을 찾는다 (`foreignKey: 'followingId'`)
    - A의 `Followings` 찾으려면, ‘팔로워(FK) = A’ 인 사람을 찾는다 (`foreignKey: 'followerId'`)

## 로그인 (passport)

---

### 폴더 구조

- `controllers`
    - `auth.js` - 🔓 로그인 (`passport.authenticate('local')`) - passport 폴더 사용 (인증, 세션저장/조회 등)
- `passport`
    - `localStrategy.js` - 인증 로직 (`passport.use(new LocalStrategy())`)
    - `index.js` - 세션에 user데이터 저장/조회 (`passport.serializeUser()`/`passport.deserializeUser()`)
- `app.js` - passport 설정

### passport

![Untitled](assets/Untitled%201.png)

- `passport`: 인증 미들웨어 (세션, 쿠키 등 복잡한 작업을 간단하게!)
- `req.session`: 세션 데이터
- `req.user`: passport가 사용자 정보를 저장 (`passport.deserializeUser()`)

`bash`

```bash
npm i passport passport-local passport-kako bcrypt
```

1. 로그인 => 세션(`req.session`)에 user 데이터 저장 (serialize) + 쿠키 전송
2. 매 요청 => 쿠키 조회 + 세션(`req.session`)에서 user 데이터(`req.user`) 조회 (deserialize)

### 미들웨어 커스텀

- 미들웨어에 기능을 추가하고 싶을 때, 사용한다.
- 커스텀하려는 미들웨어를 내부 미들웨어로 만들고, `(req, res, next)` 붙인다.
- 여기서는, `passport.authenticate('local')` 미들웨어를 다음처럼 커스텀했다.

`controllers/auth.js`

```jsx
exports.login = (req, res, next) => {
  passport.authenticate('local', (authError, user, info) => {
    ...
  })(req, res, next)
}
```

### 로그인

`controllers/auth.js` - 로그인

```jsx
// 👇 2. 로그인
exports.login = (req, res, next) => { 
  passport.authenticate('local', (authError, user, info) => {   // 📌 1) 인증 => LocalStrategy 호출 후, 콜백함수 실행
    // 서버 에러 
    if (authError) {
      console.error(authError);
      return next(authError);
    }

    // 로직 에러
    if (!user) {
      return res.redirect(`/?error=${info.message}`);
    }

    // 로그인 성공
    return req.login(user, (loginError) => {  // 📌 2) 세션에 user데이터 저장 + 쿠키 전송 => passport.serializeUser 호출
      if (loginError) {
        console.error(loginError);
        return next(loginError);
      }
      return res.redirect('/');
    });
  })(req, res, next);
};

// 3. 로그아웃
exports.logout = (req, res) => {
  req.logout(() => {  // 세션 삭제 (req.session)  ... passport에서 제공하는 req.logout() => express-session이 세션 데이터 삭제 (원래는 req.session.destroy()로 세션 삭제해줘야 함)
    res.redirect('/');
  });
};
```

## (서버의 하드로) 이미지 업로드

---

### 폴더 구조

> 게시글 생성을 2단계로 나눠서 실행
> 
> 1. 이미지 업로드 → 파일 선택하자마자, 이미지 업로드 후, 이미지 주소를 클라이언트에게 다시 전송
> 2. 게시글 생성 → [제출] 버튼을 클릭하면, 게시글 생성 (내용, 이미지 주소, 작성자ID)
- `routes`
    - `post.js` - 이미지 업로드, 게시글 생성
- `controllers`
    - `post.js` - 이미지 업로드 ,게시글 생성
    - `page.js` - 메인화면에 게시글 랜더링

### multer

1. form(`multipart/form-data`) 파일 업로드 → `upload.single(input의 name)`
2. 업로드한 파일 접근 → `req.file`
3. 파일 이외 데이터 → `req.body`

### Promise.all([promise1, promise2])

> 여러 Hashtag 동시에 찾기 → Post에 Hashtag들을 연결
> 
1. 병렬 처리: `Promise.all()`은 여러 개의 `Promise`를 동시에 병렬로 실행한다.
2. 반환 값: 모든 `Promise`가 완료될 때까지 기다린 후, 결과를 배열로 반환한다. 이 배열의 순서는 전달된 `Promise` 배열의 순서와 동일하다.
3. 거부 처리: 하나라도 거부되면 `Promise.all()`은 첫 번째로 거부된 Promise의 결과를 반환하고 나머지 Promise는 무시된다.

```jsx
const promise1 = Promise.resolve(1);
const promise2 = Promise.resolve(2);
const promise3 = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve(3);
  }, 1000);
});

// 여러 개의 Promise를 배열로 전달하여 병렬로 실행
Promise.all([promise1, promise2, promise3])
  .then(values => {
    console.log(values); // [1, 2, 3]
  })
  .catch(error => {
    console.error(error); // 에러 처리
  });
```

### include (JOIN)

- `include`: 관계 있는 모델을 함께 가져옴
- `MySQL`로 따지면 `JOIN` 기능
- 만약 특정 사용자를 가져오면서, 그 사람의 댓글까지 모두 가져오고 싶다면 `include` 속성을 사용
- 어떤 모델과 관계가 있는지를 `include` 배열에 넣어주면 된다. (여러 모델과 관계가 있을 수 있으므로, 배열)

`js`

```jsx
const user = await User.findOne(
  { include: [{model: Comment}] } // 함께 가져올 모델 (여러 관계를 가질 수 있으므로 배열)
);

console.log(user.comments); // comments 키는 hasMany이므로 복수형으로 자동 변환되어 생성 (hasOne이면, 단수형)
```

## 팔로잉, 해시태그 검색

---

### 파일 구조

- `passport`
    - `index.js` - `deserializeUser`
        - 유저(`req.user`)에 팔로워, 팔로잉 추가
        - `req.user`를 바꾸려면 `deserializeUser` 조작해야 함.
- `routes`
    - `user.js` - 팔로우 (`/user/:id/follow`)
    - `page.js` - 해시태그 검색 (`/hashtag?키=값`)
        - (`res.locals.키 = 값`) 템플릿에서 user, followerCount, followingCount, followingList 사용
- `controllers`
    - `user.js` - 팔로우
    - `page.js` - 해시태그 검색 (해당 Hashtag의 Post들)
- `app.js` - 서버에 라우터(`user.js`, `page.js`) 연결 + 정적파일(`uploads`폴더) 연결

### passport.deserializeUser() → req.user

- passport가 `passport.deserializeUser()`를 통해 `req.user`에 사용자 정보를 저장
- 라우터가 실행되기 전에 `deserializeUser`가 먼저 실행 됨 => `req.user`
- `<form>`태그에서 method 지정 안 하면, 쿼리스트링으로 전달 (GET)
    - `/hashtag?키=값` => `req.query.키`

### req객체 속성

- `express`에서 다음을 지원
    1. 요청 본문 → `req.body` (body-parser => `json`, form(`url-encoded`)
    2. form(`multipart/form-data`) → `req.file`, `req.body`
    3. 요청 쿼리 스트링 → `req.query.키`
    - `<form>`태그에서 method 지정 안 하면, 쿼리스트링으로 전달 (GET) - `/hashtag?키=값` => `req.query.키`
    1. URL 파라미터 (`/:<URL 파라미터>/follow`) → `req.params.<URL 파라미터>`

## 댓글, 댓글의 댓글

---

### 데이터 모델

1. `User`
    - `hasMany(db.Post)` - `1:N`
2. `Post`
    - `hasMany(db.Comment)` - `1:N`
3. `Comment`
    - `hasMany(db.Reply)` - `1:N`
4. `Reply`
    - `belongsTo(db.Comment)` - `N:1`

### 정렬

- `createdAt`기준으로 `Post`는 내림차순 정렬하고, 각 `Post`의 `Comment`들은 오름차순 정렬
    - <span style="color: orange">`include` 내부에서는 `order`를 사용할 수 없습니다.</span> `include`는 연관된 모델들을 가져올 때 사용되며, 이때 `order`를 사용하고 싶다면 `include` 바깥에서 정의해야 합니다.

### 구현

프론트에서 댓글인지, 대댓글인지 구분해서 서버로 보냄.

1. 서버(`/comment/:postId`)로 보내면, 댓글
2. 서버(`/comment/reply/:commentId`)로 보내면, 대댓글

# 3. 이미지 리사이징 (S3, AWS Lambda)

---

1. 지금까지 `multer`를 이용해서 서버의 하드(uploads폴더)에 이미지 업로드
    - 멀티 프로세싱을 사용할 경우, 프로세스 간 공유해야 하는 데이터는 DB에 저장
    - 이미지가 하나의 서버에만 저장되어 있기 때문에, 다른 서버에 접속한 사용자는 이미지에 접근할 수 없음
2. `S3`에 이미지 업로드
    - 원본 (`original/`) => 업로드할 때, 미리보기 (리사이징에 시간 걸림)
    - 리사이징 (`tumb/`) => 메인화면 게시글 (Lambda의 리사이징이 완료되지 않았으면, 원본을 보여줌)
3. S3버킷에 원본 이미지 파일이 저장(`original/`)되면, 리사이징해서 다시 S3에 저장 (`thumb/`)

![Untitled](assets/Untitled%202.png)

## **(AWS S3로) 이미지 업로드**

---

### S3 버킷 (생성/권한/액세스키)

1. S3 버킷 생성
    - 버킷 이름: `my-nodebird`
    - AWS리전: `ap-northeast-2` (서울)
    - `모든 퍼블릭 액세스 허용` (실무에서는 앞단에 서비스를 하나 둬서, 권한 체크 후, 액세스 허용함)
2. S3 버킷 정책 (조회, 업로드)
3. AWS 액세스 키 (IAM)
    - 서버에서 AWS 서비스에 접근 (`S3`, `Lamda` 등)
        - *계정 - 보안 자격 증명 - 새 액세스 키 만들기 - 액세스 키/비밀 액세스 키*

### 이미지 업로드 (multer → S3)

- `@aws-sdk/client-s3`: `S3` 연결 객체
- `multer-s3`: `multer` → `S3` 업로드

`routes`/`post.js` - 이미지 업로드 (multer → S3)

```jsx
...

const fs = require('fs');
const { S3Client } = require('@aws-sdk/client-s3'); 	// 📌 S3 연결객체 
const multerS3 = require('multer-s3');					// 📌 업로드 (multer  → S3)

...

// 👇 1. S3 연결객체
const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
  region: 'ap-northeast-2',
});

// 👇 2. 이미지 업로드 (multer → S3)
const upload = multer({
  storage: multerS3({			// 📌 업로드 (multer  → S3)
    s3,							// 📌 S3 연결객체 
    bucket: 'nodebird33',		//  버킷명
    key(req, file, cb) {		//  파일 저장 경로
      cb(null, `original/${Date.now()}_${file.originalname}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// POST /post/img  (사진 선택하자마자, 여기로 전송 됨)
router.post('/img', isLoggedIn, upload.single('img'), afterUploadImage);    // 👈 upload.single => 파일 1개 업로드

...
```

`controllers`/`post.js` - S3에 이미지 업로드 후, 클라이언트에게 이미지 주소 전송

```jsx
const { Post, Hashtag } = require('../models');

exports.afterUploadImage = (req, res) => {
  console.log(req.file);
  res.json({ url: req.file.location }); // 📌 이미지 주소 
};
```

## **Lambda (이미지 리사이징)**

1. `S3`에 이미지 업로드
    - 원본 (`original/`) => 업로드할 때, 미리보기 (리사이징에 시간 걸림)
    - 리사이징 (`tumb/`) => 메인화면 게시글 (Lambda의 리사이징이 완료되지 않았으면, 원본을 보여줌)
2. S3버킷에 원본 이미지 파일이 저장(`original/`)되면, 리사이징해서 다시 S3에 저장 (`thumb/`)

### Lambda 코드

`aws-upload`/`index.js` - Lambda 코드

```jsx
const sharp = require('sharp');             // 이미지 처리 라이브러리 (리사이징, 크롭, 필터링 등)
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');

// 👇 S3 연결 객체
const s3 = new S3Client(); // 📌 Lambda에서 실행 시, 자동으로 "AWS 액세스 키" 넣어줌

// Lambda에서 실행되는 함수
// 👇 1. 인자(event): S3 버킷(my-nodebird/original/)의 "생성 event" (버킷명, 파일경로, 파일명, 확장자) 
exports.handler = async (event, context, callback) => {
    const Bucket = event.Records[0].s3.bucket.name;
    const Key = decodeURIComponent(event.Records[0].s3.object.key);     // original/펭수.png
    const filename = Key.split('/').at(-1);                             // 펭수.png
    const ext = Key.split('.').at(-1).toLowerCase();
    const requiredFormat = ext === 'jpg' ? 'jpeg' : ext;
    console.log('name', filename, 'ext', ext);

    try {
        // 👇 2. 원본 이미지 (S3에서 가져옴)
        const getObject = await s3.send(new GetObjectCommand({ Bucket, Key })); // S3 객체
        const buffers = [];
        for await (const data of getObject.Body) {          // S3 객체의 내용을 stream(여러 chunk) 형태로 반환 => 하나의 배열에 모음
            buffers.push(data);
        }
        const imageBuffer = Buffer.concat(buffers);         // 하나의 큰 버퍼(imageBuffer)로 합침 (이미지 처리 라이브러리들이 입력으로 버퍼를 요구하기 때문)
        console.log('put', imageBuffer.length);
        
        // 👇 3. 이미지 리사이징
        const resizedImage = await sharp(imageBuffer)
            .resize(200, 200, { fit: 'inside' })            // 최대 200x200 이내  
            .toFormat(requiredFormat)
            .toBuffer();
        
        // 👇 4. S3(thumb/)에 저장
        await s3.send(new PutObjectCommand({
            Bucket,
            Key: `thumb/${filename}`,                       // thumb/펭수.png
            Body: resizedImage,
        }))
        console.log('put', resizedImage.length);
        return callback(null, `thumb/${filename}`);         // callback(에러, 응답)
    } catch (error) {
        console.error(error);
        return callback(error);
    }
}
```

### **업로드1 (aws-upload 폴더 → S3)**

`bash`

```bash
npm i										          	# 패키지 설치 (리눅스 환경에서 실행)
zip -r aws-upload.zip ./*						# 압축
aws s3 cp "aws-upload.zip" s3://my-nodebird		# S3로 업로드 (AWS 액세스 키 등록)
```

### **업로드2 (S3 → Lambda)**

1. `코드 소스`: `S3`에서 업로드
    - *s3://my-nodebird/aws-upload.zip*
2. `트리거 추가`: `original`(원본 이미지) 폴더의 모든 생성 이벤트
    - *s3://my-nodebird/original*
3. `일반 구성`: 제한시간: 10초

# 4. 배포 (pm2, Redis)

---

## pm2

1. 서버 재실행 (에러 발생 시)
2. 멀티 프로세싱
    - 일반(`fork`)모드, `cluster`모드
        - 일반(`fork`): pm2를 이용해 앱을 실행한다면 `fork` 모드 (자식 프로세스)로 설정되고, 서버 실행 즉시 Daemon화 되어, 종료하거나 에러가 발생하지 않는 이상 24시간 계속 유지된다. 백그라운드에서 데몬으로 돌아가서 nodemon과는 달리 콘솔에 다른 명령어를 입력할 수 있다.
        - 📌 `cluster`: 부모-자식 관계가 아니라 다수의 동등한 프로세스 또는 노드를 그룹화한다. 원하는 CPU 코어 갯수만큼 멀티 프로세스 생성/실행한다. (8코어 16스레드 컴퓨터라면, 프로세스 16개 돌아감)
            - `pm2 start [파일명] -i [프로세스 수]`
                - 원하는 CPU 코어 갯수만큼 멀티 프로세스 생성/실행
    - 멀티 프로세싱 => 노드 프로세스 여러 개 => 메모리(세션) 공유 X => `Redis` 필요
3. 로드 밸런싱
    - 자동으로 여러 요청을 여러 노드 프로세스에 고르게 분배

## connect-redis (레디스에 세션 저장)

> Redis에 세션을 저장하면,
> 
> - 로그인 후, 서버를 재시작해도 로그인이 유지 됨.
> - 멀티 프로세싱에서 여러 노드 프로세스가 하나의 저장공간을 공유함

1. `Redis DB` 생성 *([redis.com](http://redis.com/) - 레디스를 호스팅해주는 서비스 (서버에 직접 설치도 가능함))*
    - `Redis DB` 생성 => `public endpoint`(포트 포함), `default user password`
    - `.env`에 `REDIS_HOST`, `REDIS_HOST`, `REDIS_PASSWORD` 작성
2. `redis`: 드라이버 *(`express`와 `Redis` 연결)*
3. `connect-redis`: 미들웨어 *(`Redis`에 세션 저장 - (`express-session`에 의존))*

`콘솔`

```bash
npm i redis connect-redis # 별도로 Redis DB 설치해야 함
```

`.env` - Redis 연결 정보

```bash
REDIS_HOST=redis-[포트번호].c14.us-east-1-2.ec2.cloud.redislabs.com # 레디스 - Public endpoint
REDIS_PORT=[포트번호] # 레디스 - Public endpoint
REDIS_PASSWORD=41lL904Z153mw6YkZZd1TDCQk[-------] # 레디스 - Default user password
```

`app.js` - Redis 연결 & 세션 저장

```
const hpp = require('hpp');
const redis = require('redis');
const session = require('express-session');
const RedisStore = require('connect-redis').default; // 📌 express-session에 의존
// 👇 Redis 연결
dotenv.config();
const redisClient = redis.createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
  password: process.env.REDIS_PASSWORD,
  legacyMode: true,
});
redisClient.connect().catch(console.error);

...

// 👇 Redis에 세션 저장
const sessionOption = {
  resave: false,
  saveUninitialized: false,
  secret: process.env.COOKIE_SECRET,
  cookie: {
    httpOnly: true,
    secure: false,
  },
  store: new RedisStore({ client: redisClient }), // 📌 Redis에 세션 저장
};
app.use(session(sessionOption))
```

# 5. API 서버

## SOP, CORS, JWT

1. **Origin**
    - 출처 (`프로토콜` + `호스트` + `포트`)
    
    ```jsx
    console.log(location.origin); // "https://www.naver.com" (포트 번호 80번은 생략됨)
    ```
    
2. **SOP**
    - 동일 출처 정책 (동일한 출처에서만 리소스를 가져올 수 있다)
    - 보안상의 이유 (다른 출처로의 요청을 제한 → 해커의 crsf(요청위조), xss(스크립트 삽입) 공격을 어렵게 한다.)
3. **CORS** (해결책)
    - CORS 에러 → 브라우저가 다른 도메인의 서버에 접근하는 경우, 브라우저에서 발생하는 에러
    - 브라우저에는 에러가 뜨지만, 정작 서버 쪽에는 정상적으로 응답 (사실 서버가 응답헤더 정보(`Access-Control-Origin`)를 덜 줘서 그런것이다.)
    - 일반적인 CORS
        1. 요청헤더 (`Origin`)
        2. 응답헤더 (`Access-Control-Allow-Origin`)에 `Origin` 등록
        3. 클라이언트에서 `Origin`과 서버가 보내준 `Access-Control-Allow-Origin`을 비교 → 수용/에러
    - 인증정보 포함 CORS
        1. `Access-Control-Allow-Credentials: true`: 클라이언트에서 인증정보 보낼 수 있음 *쿠키(세션ID), Authorization헤더(토큰)*
        2. `Access-Control-Allow-Origin: 허용할 도메인`: 인증 정보를 포함하면, ``(와일드 카드)는 사용할 수 없다.
    - 예비 요청 (Preflight Request)
        - 사실 브라우저는 요청을 보낼때 한번에 바로 보내지않고, 먼저 예비 요청을 보내서 서버와 통신할 수 있는지 확인 후, 본 요청을 보낸다. 이때 브라우저가 예비요청을 보내는 것을 Preflight라고 부르며, 이 예비요청의 HTTP 메소드를 GET이나 POST가 아닌 `OPTIONS`라는 요청이 사용된다는 것이 특징이다.
4. **CORS + JWT인증 구현**
    
    ```jsx
    const cors = require('cors');
    router.use(cors({
      origin: req.get('origin'), // 👈 Access-Control-Allow-Origin: 허용할 도메인
      credentials: true, // 👈 Access-Control-Allow-Credentials: true
    }))
    ```
    
    - 클라이언트가 도메인을 등록하고 받은 `clientSecret`(도메인 ID) 보내면, 서버는 `clientSecret`으로 DB 조회해서 "등록된 도메인"인지 1회 확인한 후, `JWT`를 발급한다. 이후부터는 클라이언트가 요청에 `JWT`를 포함해서 보내고, 서버는 DB 조회 없이 `JWT`만 유효하면, 인증 완료한다.
    1. JWT 발급: 도메인 등록 → `clientSecret` 발급 → `clientSecret` 전송 → `JWT` 발급
    2. JWT 사용: 요청(+JWT) → 인증(DB조회 없이, 유효하면 인증완료)
5. **JWT 기반 인증**
    - 기존의 세션기반 인증은 서버가 DB에 세션데이터를 저장하고 이를 조회하기 때문에 많은 오버헤드가 발생한다. 하지만 토큰은 클라이언트에 저장되기 때문에 서버의 부담을 덜 수 있다. 토큰 자체에 데이터가 들어있기 때문에 클라이언트에서 받아 위조되었는지 판별만 하면 되기 떄문이다.
    - 모바일 앱과 서버가 통신 및 인증할때 가장 많이 사용된다. 왜냐하면 웹에는 쿠키와 세션이 있지만 모바일 앱에서는 없기 때문이다.
        - 세션 기반 (stateful) - 서버가 상태를 관리사용자 로그인 → DB에 세션데이터 저장 → 쿠키에 세션ID 전송 → 브라우저의 쿠키에 세션ID 저장 → 요청마다 세션ID 전송 → 세션ID로 세션데이터 조회
        - 토큰 기반 (stateless) - 클라이언트가 상태를 관리사용자 로그인 → 토큰 발급 → 브라우저의 쿠키나 스토리지에 토큰 저장 → 요청마다 토큰 전송 → 토큰 검증 (토큰에 데이터가 포함되어 있어서 DB조회 필요 없음)
    - 단점
        1. 세션쿠키는 세션ID만 들어있지만, 토큰은 모든 데이터를 포함하므로 네트워크 부하
        2. 토큰을 탈취당하면, 토큰이 만료될 때까지 클라이언트에서 재발급이나 삭제가 어려움
6. JWT

![Untitled](assets/Untitled%203.png)

## **로그인, 도메인 등록, clientSecret**

![Untitled](assets/Untitled%204.png)

- `sns_api`
    - `app.js`
        - `app.use('/auth', authRouter)`: 로그인 로직 (passport)
        - `app.use('/', indexRouter)`: 메인화면 (로그인 화면, 도메인 등록 화면)
    - `models`
        - `domain.js` - `N:1` (Domain:User)
            - host: 주소
            - type: 무료/프리미엄
            - clientSecret: 도메인ID (랜덤값)
        - `user.js` - `1:N` (User:Domain)
    - `views`
        - `login.html` - 메인화면 (`/`)
            - 로그인 O => "도메인 등록" 화면 (clientSecret 생성)
            - 로그인 X => "로그인" 화면
    - `routes`
        - `index.js` - 메인화면, 도메인 생성
    - `controllers`
        - `index.js` - 메인화면(clientSecret 랜더링), 도메인 생성 (clientSecret 생성)

## **JWT 생성/발급**

![Untitled](assets/Untitled%205.png)

1. 클라이언트: `clientSecret` 전송
2. 서버:
    1. `clientSecret`(도메인ID)로 등록된 도메인인지 확인
    2. `JWT` 생성/발급

- `sns_api`
    - `.env` - COOKIE_SECRET, KAKAO_ID, JWT_SECRET(비밀키)
    - `middlewares`
        - `index.js` - 토큰 인증 (`res.locals.decoded`)
    - `routes`
        - `v1.js` - 토큰 발급(`/token`), 토큰 인증 테스트(`/test`)
    - `controllers`
        - `v1.js` - 토큰 발급(`clientSecret` 받은 후, `JWT` 생성/발급), 토큰 인증 테스트
    - `app.js` - 서버에 라우터(`v1.js`) 연결

## **세션에 JWT 저장 후, 전송**

![Untitled](assets/Untitled%206.png)

1. 클라이언트: `clientSecret` 전송
2. 서버: `JWT` 생성/발급
3. 클라이언트: 세션에 `JWT` 저장 (`req.session`) *... (목적: 재사용)*
4. 클라이언트: 요청 시, `JWT` 포함 (`Authorization`헤더)

- `client`
    - `app.js` - 넌적스, 세션, 라우터(`index.js`) 연결
    - `.env` - COOKIE_SECRET, CLIENT_SECRET
    - `routes`
        - `index.js` - 토큰 인증 테스트 (`/test`)
    - `controllers`
        - `index.js`1) 서버로 `CLIENT_SECRET` 보냄2) 받은 `JWT`를 세션에 저장 (`req.session`)3) 요청 시, `JWT` 포함 (`Authorization`헤더)

## **API 서버 (조회 - 내 포스트, 해시태그)**

- 서버
    - 토큰 확인(변조 검사) 후, json 응답
- 클라이언트 서버
    - 요청 헤더(`ORIGIN`) <= (client/controllers/index - `axios.defaults.headers.origin`)
    - 토큰 재발급 & 요청(+`JWT`)

- `sns_api`
    - `routes`
        - `v1.js` - 내 포스트, 해시태그 검색
    - `controllers`
        - `v1.js` - 내 포스트, 해시태그 검색
- `client`
    - `.env` - API_URL(서버 URL), ORIGIN(클라이언트 URL)
    - `routes`
        - `index.js` - 내 포스트, 해시태그 검색
    - `controllers`
        - `index.js`요청 헤더(`ORIGIN`) <= (client/controllers/index - `axios.defaults.headers.origin`)토큰 재발급 & 요청(+`JWT`)내 포스트, 해시태그 검색

## CORS

- 클라이언트는 요청헤더에 `Origin` 포함
    - `client`/`controllers`/`index.js`
        - `axios.defaults.headers.origin = process.env.ORIGIN; // origin 헤더 추가`
- 서버는 응답헤더에 `Access-Control-Allow-Credentials`, `Access-Control-Allow-Origin` 포함
    1. `Access-Control-Allow-Credentials: true`: 클라이언트에서 인증정보 보낼 수 있음 *쿠키(세션ID), Authorization헤더(토큰)*
    2. `Access-Control-Allow-Origin: 허용할 도메인`: 인증 정보를 포함하면, ``(와일드 카드)는 사용할 수 없다.

- `client`
    - `routes`
        - `index.js` - 메인(`/`) 요청 시, 메인화면 랜더링 (`controllers`/`index.js` 호출
    - `controllers`
        - `index.js` - 메인화면 랜더링`(views`/`main.js` 호출)
    - `views`
        - `main.js` - 메인화면에서 javscript로 `JWT` 발급 요청 => `clientSecret` 보내고, `JWT` 받음 (CORS 발생)
- `sns_api`
    - `routes`
        - `v2.js` - 라우터에 미들웨어(CORS 허용) 적용
            - `const { corsWhenDomainMatches } = require('../middlewares'); router.use(corsWhenDomainMatches);`
    - `middlewares`
        - `index.js` - 클라이언트의 도메인이 등록되어 있으면, CORS 허용
