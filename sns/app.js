const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const session = require('express-session');
const nunjucks = require('nunjucks');
const dotenv = require('dotenv');
const passport = require('passport');
const helmet = require('helmet');											// 각종 보안 (배포 전, 추가하면 좋음)
const hpp =require('hpp');														// 각종 보안 (배포 전, 추가하면 좋음)
const redis = require('redis');												// Redis에 연결
const RedisStore = require("connect-redis").default		// Redis에 세션 저장 (express-session에 의존)

dotenv.config();                    									// .env파일을 process.env에 대입

// Redis 연결
const redisClient = redis.createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
  password: process.env.REDIS_PASSWORD,
});
redisClient.connect().catch(console.error);


const pageRouter = require('./routes/page');
const authRouter = require('./routes/auth');
const postRouter = require('./routes/post');
const userRouter = require('./routes/user');
const commentRouter = require('./routes/comment')
const { sequelize } = require('./models');
const passportConfig = require('./passport');
const logger = require('./logger'); // logger 객체

const app = express();
// passport 설정 (passport.serializeUser, passport.deserializeUser, passport.use(localStrategy))
passportConfig(); 																								
app.set('port', process.env.PORT || 8001);

// 넌적스 (템플릿 엔진)
app.set('view engine', 'html');
nunjucks.configure('views', {                          		 		    // 템플릿 폴더 경로
  express: app,
  watch: true,                                         					  // HTML파일 변경 => 재랜더링
});
// 모델을 MySQL서버와 연동 (config에 따라)
sequelize.sync({ force: false })																	// 테이블이 없으면, 자동으로 생성 (force: 기존 테이블 삭제 후, 재생성)
  .then(() => {
    console.log('데이터베이스 연결 성공');
  })
  .catch((err) => {
    console.error(err);
  });

// 로깅
if (process.env.NODE_ENV == 'production') { // NODE_ENV는 동적으로 변하므로 .env에 넣을 수 없음 => sudo NODE_ENV=production PORT=80 pm2 start app.js -i 0	# 서버 실행
	app.use(morgan('combined')); // 더 많은 사용자 정보
	// 배포 전, 각종 보안을 위해 다음의 2개 패키지 추가
	app.use(helmet({contentSecurityPolicy: false, crossOriginEmbedderPolicy: false, crossOriginResourcePolicy: false,})); // 너무 엄격해서 3개 옵션 해제
	app.use(hpp());
} else {
	app.use(morgan('dev'))
}
// 정적파일(public) 제공
app.use(express.static(path.join(__dirname, 'public')));					// 자동으로 정적파일 제공 (public폴더를 static폴더로 만듦)
app.use('/img', express.static(path.join(__dirname, 'uploads'))); // app.use(요청경로, express.static(실제경로)) => 프론트에서 /img 요청으로 [uploads]폴더 접근
// req.body
app.use(express.json());																					// json => req.body
app.use(express.urlencoded({ extended: false }));									// form => req.body
// 세션
app.use(cookieParser(process.env.COOKIE_SECRET));									// 쿠키 발급/파싱

// Redis에 세션 저장 (express-session에 의존)
const sessionOption = {
	resave: false,																									// 매번 세션 재저장
	saveUninitialized: false,																				// 처음부터 세션 생성
	secret: process.env.COOKIE_SECRET,
	cookie: {
		httpOnly: true,																								// 클라이언트에서 js로 접근
		secure: false,																								// https
	},
	store: new RedisStore({ client: redisClient }),
}
app.use(session(sessionOption)); 																	// req.session 생성 => 세션데이터 접근 => 세션쿠키 생성/전송/파싱


// passport 설정
app.use(passport.initialize());																		// passport 초기화 (req객체에 passport 설정) ... req.isAuthenticated, req.login, req.logout, req.user
app.use(passport.session()); 																			// 세션 저장/복원 (req.session에 passport 설정)

// 라우팅
app.use('/', pageRouter);																					// 메인화면, 회원가입 화면, 프로필 화면, 해시태그 검색
app.use('/auth', authRouter);																			// 회원가입, 로그인, 로그아웃
app.use('/post', postRouter);																			// 업로드 (이미지는 선택할 때 먼저 업로드한 후, 게시글 업로드할 때 이미지주소만 업로드함.)
app.use('/user', userRouter);																			// 팔로우 (/user/:id/follow), 언팔로우 (/user/:id/unfollow)
app.use('/comment', commentRouter);

// 404 NOT FOUND
app.use((req, res, next) => {
  const error =  new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  error.status = 404;
	logger.info('hello'); 				// logger객체로 info 로그 기록 (logger객체 설정대로 combinded.log 파일에 기록)
	logger.error(error.message); 	// logger객체로 error 로그 기록 (logger객체 설정대로 error.log 파일에 기록)
  next(error); 									// 곧장 에러처리 미들웨어로 감
});

// 에러 처리 (인수 4개)
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV !== 'production' ? err : {};
  res.status(err.status || 500);
  res.render('error');																						// views/error.html
});

// express 앱(서버) 실행
app.listen(app.get('port'), () => {
  console.log(app.get('port'), '번 포트에서 대기중');
});