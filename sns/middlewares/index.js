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