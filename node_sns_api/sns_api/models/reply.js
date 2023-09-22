const Sequelize = require('sequelize');

class Reply extends Sequelize.Model { 
  static initiate(sequelize) {
    Reply.init(
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
        modelName: 'Reply',
        tableName: 'replies',
        paranoid: false,
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
      }
    );
  }
  
  static associate(db) {
    // Comment (N:1) - 댓글
    db.Reply.belongsTo(db.Comment);
    // User (N:1) - 대댓글 작성자
    db.Reply.belongsTo(db.User);
    // Post (N:1) - 게시글
    db.Reply.belongsTo(db.Post);
  }
}

module.exports = Reply;