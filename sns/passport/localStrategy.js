const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

const User = require('../models/user');

module.exports = () => {
  // 인증 로직
  passport.use(new LocalStrategy({
    usernameField: 'email',                 // req.body.속성명
    passwordField: 'password',              // req.body.속성명
    passReqToCallback: false,
  }, async (email, password, done) => {     // 👈 인증 (usernameField, passwordField, password.authenticate('local')의 콜백함수)
    try {
      const exUser = await User.findOne({ where: { email } });
      if (exUser) {
        const result = await bcrypt.compare(password, exUser.password);
        if (result) {
          done(null, exUser);               // password.authenticate('local')의 콜백함수 실행 => done(서버에러, 유저, 로직에러)
        } else {
          done(null, false, { message: '비밀번호가 일치하지 않습니다.' });
        }
      } else {
        done(null, false, { message: '가입되지 않은 회원입니다.' });
      }
    } catch (error) {
      console.error(error);
      done(error);
    }
  }));
};