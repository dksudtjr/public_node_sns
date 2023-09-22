const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const morgan = require('morgan');
const session = require('express-session');
const nunjucks = require('nunjucks');
const dotenv = require('dotenv');

dotenv.config();
const authRouter = require('./routes/auth');
const indexRouter = require('./routes');
const v1 = require('./routes/v1');
const v2 = require('./routes/v2');

const { sequelize } = require('./models');
const passportConfig = require('./passport');

const app = express();

// passport 설정 (passport.serializeUser, passport.deserializeUser, passport.use(localStrategy))
passportConfig();                                       // 인증, 세션, 사용자(req.user)  => req.session, req.user, passport.use(new LocalStrategy)
// 포트
app.set('port', process.env.PORT || 8002);              // sns 웹 서버(8001포트)와 다른 포트이므로, 동시에 실행
// 넌적스
app.set('view engine', 'html');
nunjucks.configure('views', {
  express: app,
  watch: true,
});
// 모델과 DB(MySQL) 연동 + 테이블 생성 (config.js 참고)
sequelize.sync({ force: false })                        // 테이블이 없으면, 자동으로 생성 (force: 기존 테이블 삭제 후, 재생성)
  .then(() => {
    console.log('데이터베이스 연결 성공');
  })
  .catch((err) => {
    console.error(err);
  });

// 콘솔 로깅
app.use(morgan('dev'));
// 정적파일(public) 제공
app.use(express.static(path.join(__dirname, 'public')));
// req.body (json, form 데이터 받음)
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// 세션 (req.session 생성)
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: process.env.COOKIE_SECRET,
  cookie: {
    httpOnly: true,
    secure: false,
  },
}));
// passport 설정
app.use(passport.initialize());                         // passport 초기화 (req객체에 passport 설정) ... req.isAuthenticated, req.login, req.logout, req.user
app.use(passport.session());                            // 세션 저장/복원 (req.session에 passport 설정)

// 라우팅
app.use('/v1', v1);
app.use('/v2', v2);
app.use('/auth', authRouter);
app.use('/', indexRouter);


// 404 NOT FOUND
app.use((req, res, next) => {
  const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  error.status = 404;
  next(error);
});

// 에러 처리 (인수 4개)
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV !== 'production' ? err : {};
  res.status(err.status || 500);    
  res.render('error');
});

// express 앱(서버) 실행
app.listen(app.get('port'), () => {
  console.log(app.get('port'), '번 포트에서 대기중');
});