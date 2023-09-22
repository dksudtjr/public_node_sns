const Sequelize = require('sequelize');

/*
    클라이언트 키 => 클라이언트 식별
    도메인 => CORS
*/

class Domain extends Sequelize.Model {  // 등록된 도메인만 API 사용
  static initiate(sequelize) {
    Domain.init({
      host: {
        type: Sequelize.STRING(80),
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM('free', 'premium'),
        allowNull: false,
      },
      clientSecret: {
        type: Sequelize.UUID,
        allowNull: false,
      },
    }, {
      sequelize,
      timestamps: true,
      paranoid: true,
      modelName: 'Domain',
      tableName: 'domains',
    });
  }

  static associate(db) {
    db.Domain.belongsTo(db.User);
  }
};

module.exports = Domain;