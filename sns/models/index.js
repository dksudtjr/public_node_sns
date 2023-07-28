const Sequelize = require('sequelize');
const fs = require('fs');
const path = require('path');
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];              // 초기화(npx sequelize init)로 생성됨

const db = {};                                                // sequelize, 모델들
const sequelize = new Sequelize(                              // MySQL 연결 객체
  config.database, config.username, config.password, config,
);

db.sequelize = sequelize;

const basename = path.basename(__filename);
fs
  .readdirSync(__dirname)                                     // 현재 폴더의 모든 파일을 조회
  .filter(file => {                                           // 모델 파일 (숨김 파일, index.js, js 확장자가 아닌 파일 제외)
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => { 
    const model = require(path.join(__dirname, file));        // 모델
    console.log(file, model.name);
    db[model.name] = model;
    model.initiate(sequelize);          // 👈 initiate => 모델, 테이블 연결
  });

Object.keys(db).forEach(modelName => { // associate 호출
  if (db[modelName].associate) {
    db[modelName].associate(db);        // 👈 associate => 다른 테이블과 관계
  }
});

module.exports = db;