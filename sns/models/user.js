const Sequelize = require('sequelize');

class User extends Sequelize.Model {
  // 👇 1. 필드, 테이블 설정
  static initiate(sequelize) {
    User.init({
      email: {
        type: Sequelize.STRING(40),
        allowNull: true,
        unique: true,
      },
      nick: {
        type: Sequelize.STRING(15),
        allowNull: false,
      },
      password: {
        type: Sequelize.STRING(100),                // 암호화하면 길어짐.
        allowNull: true,
      },
      provider: {
        type: Sequelize.ENUM('local', 'kakao'),     // local, kakao 이외에는 에러임.
        allowNull: false,
        defaultValue: 'local',
      },
      snsId: {
        type: Sequelize.STRING(30),
        allowNull: true,
      },
    }, {
      sequelize,
      timestamps: true,                             // createdAt, updatedAt 
      underscored: false,
      modelName: 'User',
      tableName: 'users',
      paranoid: true,                               // deletedAt (삭제 시, 그대로 놔두고 deletedAt만 추가)
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }

  // 👇 2. 테이블 관계 
  static associate(db) {
    db.User.hasMany(db.Post, {as: 'Post'});         // Post (1:N) - 작성글 (Post)
    db.User.belongsToMany(db.User, {                // User (Followers)
      foreignKey: 'followingId',
      as: 'Followers',
      through: 'Follow',
    });
    db.User.belongsToMany(db.User, {                // User (Followings)
      foreignKey: 'followerId',
      as: 'Followings',
      through: 'Follow',
    });
    db.User.belongsToMany(db.Post, {                // Post (N:M) - 좋아요 (LikePosts)
        as: 'LikePosts',
        through: 'UserPost',
    });
    db.User.hasMany(db.Comment)                     // Comment (1:N) - 댓글
  }
};

module.exports = User;