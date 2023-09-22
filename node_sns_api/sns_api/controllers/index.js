const { v4: uuidv4 } = require('uuid');
const { User, Domain } = require('../models');

// 1. 메인화면 ('/')
exports.renderLogin = async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: { id: req.user?.id || null },
      include: { model: Domain },
    });
    res.render('login', {
      user,
      domains: user?.Domains,       // clientSecret 랜더링
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
}

// 2. 도메인 생성 ('/domain')
exports.createDomain = async (req, res, next) => {
  try {
    await Domain.create({           // 도메인 생성
      UserId: req.user.id,
      host: req.body.host,
      type: req.body.type,
      clientSecret: uuidv4(),       // clientSecret 생성 (uuid 패키지)
    });
    res.redirect('/');
  } catch (err) {
    console.error(err);
    next(err);
  }
};