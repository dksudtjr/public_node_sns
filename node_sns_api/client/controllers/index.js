const axios = require('axios');


const URL = process.env.API_URL;
axios.defaults.headers.origin = process.env.ORIGIN; // origin 헤더 추가

// 👇 세션에 JWT 저장 & 요청(+JWT) 전송
const request = async (req, api) => {
  try {
    // 👇 1. 세션에 토큰 X => 토큰 발급
    if (!req.session.jwt) {
      const tokenResult = await axios.post(`${URL}/token`, {  // 👈 clientSecret 보냄 (req.body) 
        clientSecret: process.env.CLIENT_SECRET,
      });
      req.session.jwt = tokenResult.data.token;               // 👈 세션에 토큰 저장
    }
    // 👇 2. 세션에 토큰 O => 토큰 보냄
    return await axios.get(`${URL}${api}`, {
      headers: { authorization: req.session.jwt },            // 👈 headers: { authorization: 토큰 }
    }); // API 요청
  } 
  catch (error) {
    // 👇 토큰 만료(419) => 자동으로 토큰 재발급
    if (error.response?.status === 419) {                     
      delete req.session.jwt;
      return request(req, api);
    } 
    // 토큰 만료(419) 외의 다른 에러 => 에러 메시지 (새로운 버전, 1분에 한 번 요청)
    return error.response; // return 했으므로, 에러가 아니라 응답이다. (error 뜨게 하려면, throw)
  }
};

// 내 포스트들
exports.getMyPosts = async (req, res, next) => {
  try {
    const result = await request(req, '/posts/my');
    res.json(result.data);
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// 해시태그 검색
exports.searchByHashtag = async (req, res, next) => {
  try {
    const result = await request(
      req, `/posts/hashtag/${encodeURIComponent(req.params.hashtag)}`,
    );
    res.json(result.data);
  } catch (error) {
    if (error.code) {
      console.error(error);
      next(error);
    }
  }
};

// 토큰 테스트 라우터
exports.test = async (req, res, next) => {
  try {
    // 👇 1. 세션에 토큰 X => 토큰 발급
    if (!req.session.jwt) {  
      const tokenResult = await axios.post('http://localhost:8002/v1/token', {  // 👈 clientSecret 보냄 (req.body) 
        clientSecret: process.env.CLIENT_SECRET,
      });
      if (tokenResult.data?.code === 200) {                                     // 토큰 발급 성공
        req.session.jwt = tokenResult.data.token;                               // 👈 세션에 토큰 저장
      } else {
        return res.json(tokenResult.data);
      }
    }
    // 👇 2. 세션에 토큰 O => 토큰 보냄
    const result = await axios.get('http://localhost:8002/v1/test', {
      headers: { authorization: req.session.jwt },                              // 👈 headers: { authorization: 토큰 }
    });
    return res.json(result.data);
  } catch (error) {
    console.error(error);
    if (error.response?.status === 419) { // 토큰 만료 시
      return res.json(error.response.data);
    }
    return next(error);
  }
};

// 좋아요 게시글 조회
exports.myLikes = async (req, res, next) => {
  try {
    const result = await request(req, '/posts/myLikes');
    res.json(result.data);
  } catch (error) {
    console.error(error);
    next(error);
  }
};

exports.renderMain = (req, res) => {
  res.render('main', { key: process.env.CLIENT_SECRET })
}