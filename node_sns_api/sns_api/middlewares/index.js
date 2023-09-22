const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/user');
const Domain = require('../models/domain');
const cors = require('cors');


// 👇 1. passport 로그인 O
exports.isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {                    
        next();
    } else {
        res.status(403).send('로그인 필요');
    }
};

// 👇 2. passport 로그인 X
exports.isNotLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        next();
    } else {
        const message = encodeURIComponent('로그인한 상태입니다.');
        res.redirect(`/?error=${message}`);
    }
};

// 👇 JWT 검증 (유효하기만 하면, 인증 완료)
exports.verifyToken = (req, res, next) => {
    try {
      // 👇 다음 미들웨어에서도 인증된 "토큰의 내용" 사용  
      res.locals.decoded = jwt.verify(req.headers.authorization, process.env.JWT_SECRET); // 클라이언트가 요청 헤더(authorization)에 JWT 보냄 
      return next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') { // 유효기간 초과
        return res.status(419).json({
          code: 419,
          message: '토큰이 만료되었습니다',
        });
      }
      return res.status(401).json({             // 위조된 토큰 (시그니처 불일치)
        code: 401,
        message: '유효하지 않은 토큰입니다',
      });
    }
  };

// 👇 무료 사용량 제한 (express-rate-limit)
exports.apiLimiter = rateLimit({  // 1분에 1회
  windowMs: 60 * 1000,    // 1분
  max: 10,                // 1회
  handler(req, res) {     // 제한 초과 시, 콜백함수 실행
    res.status(this.statusCode).json({
      code: this.statusCode, // 기본값 429
      message: '무료 사용자는 1분에 1번만 요청할 수 있습니다.',
    });
  },
});

// 👇 프리미엄 사용량 제한 (express-rate-limit) 
exports.premiumApiLimiter = rateLimit({  // 1분에 1회
  windowMs: 60 * 1000,    // 1분
  max: 3,                 // 3회
  handler(req, res) {     // 제한 초과 시, 콜백함수 실행
    res.status(this.statusCode).json({
      code: this.statusCode, // 기본값 429
      message: '유료 사용자는 1분에 3번만 요청할 수 있습니다.',
    });
  },
});


// // 👇 사용량 제한 (express-rate-limit) - User에 type이 있는 경우
// exports.apiLimiter = async(req, res, next) => {
//   let user;
//   // User에 따라 사용량 다름 (무료/프리미엄)
//   if (res.locals.decoded) {
//     user = await User.findOne({ where: {id: res.locals.decoded.id} }); // 이전에 verifyToken 미들웨어 있어야, 토큰 내용물(res.locals.decoded) 받음 (verifyToken 미들웨어 없는 경우는 토큰 생성할 때이므로, 무료 사용자로 간주)
//   }
//   // 1분에 1000회/3회  
//   rateLimit({    
//     windowMs: 60 * 1000,                          // 1분
//     max: user?.type == 'premium' ? 1000 : 3,     // 1000회 / 3회
//     handler(req, res) {     // 제한 초과 시, 콜백함수 실행
//       res.status(this.statusCode).json({
//         code: this.statusCode, // 기본값 429
//         message: '1분에 3번만 요청할 수 있습니다.',
//       });     
//     },
//   })(req, res, next);
// }



// // 👇 사용량 제한 (express-rate-limit)
// exports.apiLimiter = async (req, res, next) => {
//   // 현재 요청을 보낸 도메인 (ORIGIN 헤더) 
//   const domain = await Domain.findOne({ where: {host: new URL(req.get('origin')).host} });
//   // 1분에 1000회/3회
//   if (domain.type == 'premium') {
//     rateLimit({    
//       windowMs: 60 * 1000,    // 1분
//       max: 1000,              // 1000회
//       handler(req, res) {     // 제한 초과 시, 콜백함수 실행
//         res.status(429).json({
//           code: 429, // 기본값 429
//           message: '1분에 1번만 요청할 수 있습니다.',
//         });     
//       },
//     })(req, res, next);
//   }
//   else {
//     rateLimit({    
//       windowMs: 60 * 1000,    // 1분
//       max: 3,                 // 3회
//       handler(req, res) {     // 제한 초과 시, 콜백함수 실행
//         res.status(429).json({
//           code: 429, // 기본값 429
//           message: '1분에 1번만 요청할 수 있습니다.',
//         });     
//       },
//     })(req, res, next);
//   }
// }

// 👇 구 버전에 붙이는 미들웨어
exports.deprecated = (req, res) => {
  res.status(410).json({
    code: 410,
    message: '새로운 버전이 나왔습니다. 새로운 버전을 사용하세요.',
  });
};

exports.corsWhenDomainMatches = async (req, res, next) => {
  // 1. 현재 요청을 보낸 클라이언트의 도메인이 등록되어 있으면,
  const domain = await Domain.findOne({
    where: { host: new URL(req.get('origin')).host },
  });
  if (domain) {
    // 2. 해당 도메인만 CORS 허용
    cors({ 
      origin: req.get('origin'),  // 허용할 도메인 => Access-Control-Allow-Origin: 도메인
      credentials: true,          // 클라이언트의 요청에 인증정보(쿠키, 인증 헤더) 허용 => Access-Control-Allow-Credentials: true
    })(req, res, next);
  } else {
    next();
  }
};