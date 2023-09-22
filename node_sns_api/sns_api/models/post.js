const Sequelize = require('sequelize');

// 게시글 1개 + 이미지 1개
class Post extends Sequelize.Model { 
  static initiate(sequelize) {
    Post.init({
      content: {
        type: Sequelize.STRING(140),
        allowNull: false,
      },
      img: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      likes: {
        type: Sequelize.INTEGER,
        defaultValue: 0, // 좋아요 갯수의 기본값은 0으로 설정
      },
    }, {
      sequelize,
      timestamps: true,
      underscored: false,
      modelName: 'Post',
      tableName: 'posts',
      paranoid: false,
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
    });
  }
  
  static associate(db) {
    db.Post.belongsTo(db.User, {as: 'User'});     // User (1:N) - 작성자 (User)
    db.Post.belongsToMany(db.Hashtag, {through: 'PostHashtag'});        // 해시태그를 사용한 게시물 (Post에서 "hashtagId=특정ID"인 게시물)
    db.Post.belongsToMany(db.User, {              // User (N:M) - 좋아요 (LikeUsers)
      as: 'LikeUsers',
      through: 'UserPost',
    });
    db.Post.hasMany(db.Comment)   //  Comment (1:N)
  }
}

module.exports = Post;