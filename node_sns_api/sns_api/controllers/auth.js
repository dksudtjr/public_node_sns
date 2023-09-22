const bcrypt = require('bcrypt');
const passport = require('passport');
const User = require('../models/user');

// 1. 회원가입
exports.join = async (req, res, next) => {
  const { email, nick, password } = req.body;                       // json, form 데이터
  try {
    const exUser = await User.findOne({ where: { email } });
    if (exUser) {
      return res.redirect('/join?error=exist');
    }
    const hash = await bcrypt.hash(password, 12);                   // 비밀번호 암호화
    await User.create({
      email,
      nick,
      password: hash,
    });
    return res.redirect('/');                                       // 302
  } catch (error) {
    console.error(error);
    return next(error);
  }
}

// 2. 로그인
exports.login = (req, res, next) => { 
  passport.authenticate('local', (authError, user, info) => {       // 👈 1) (인증) LocalStrategy 호출 후, 인자 받음
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
    return req.login(user, (loginError) => {                        // 👈 2) (세션 저장) passport.serializeUser 호출 + 세션쿠키 전송
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
  req.logout(() => {                                                // req.session 삭제
    res.redirect('/');
  });
};