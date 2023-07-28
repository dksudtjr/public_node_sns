const User = require('../models/user');

// 👇 팔로우 (POST /user/:id/follow)
exports.follow = async (req, res, next) => {
  try {
    // 팔로워
    const user = await User.findOne({ where: { id: req.user.id }});    // req.user.id: followerId        (deserializeUser => req.user)
    if (user) {
      // 팔로잉
      await user.addFollowing(parseInt(req.params.id, 10));             // req.params.i: followingId     (쿼리 파라미터 /:id/)
      res.send('success');
    } else {
      res.status(404).send('no user');
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// 👇 언팔로우 (POST /user/:id/unfollow)
exports.unfollow = async (req, res, next) => {
    try {
        // 팔로워
        const user = await User.findOne({ where: { id: req.user.id } });    // req.user.id: followerId        (deserializeUser => req.user)
        if (user) {
            // 팔로잉
            await user.removeFollowing(parseInt(req.params.id, 10));    // req.params.id: followingId     (쿼리 파라미터 /:id/)
            res.send('success');
        } else {
            res.status(404).send('no user');
        }
    } catch (error) {
        console.log(error);
        next(error);
    } 
};
