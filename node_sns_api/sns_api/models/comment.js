const Sequelize = require('sequelize');

class Comment extends Sequelize.Model { 
  static initiate(sequelize) {
    Comment.init(
      {
        content: {
          type: Sequelize.STRING(140),
          allowNull: false,
        },
      }, 
      {
        sequelize,
        timestamps: true,
        underscored: false,
        modelName: 'Comment',
        tableName: 'comments',
        paranoid: false,
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
      }
    );
  }
  
  static associate(db) {
    // Reply (1:N) - 답글
    db.Comment.hasMany(db.Reply);
    // User (N:1) - 댓글 작성자
    db.Comment.belongsTo(db.User);
    // Post (N:1) - 게시글
    db.Comment.belongsTo(db.Post); 
  }
}

module.exports = Comment;