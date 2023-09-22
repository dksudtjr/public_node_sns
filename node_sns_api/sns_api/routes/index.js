const express = require('express');
const { renderLogin, createDomain } = require('../controllers');
const { isLoggedIn } = require('../middlewares');

const router = express.Router();

// 메인화면 (로그인 화면, 도메인 등록 화면)
router.get('/', renderLogin);

// 도메인 생성 (+clientSecret)
router.post('/domain', isLoggedIn, createDomain);

module.exports = router;