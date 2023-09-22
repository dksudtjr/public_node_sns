require('dotenv').config();                   // 👈 .env 파일을 process.env에 로드

module.exports = {
  development: {
    username: 'root',
    // password : '123'
    password: process.env.SEQUELIZE_PASSWORD, 
    database: 'nodebird',
    host: '127.0.0.1',
    dialect: 'mysql',
  },
  test: {
    username: "root",
    password: process.env.SEQUELIZE_PASSWORD,
    database: "nodebird_test",
    host: "127.0.0.1",
    dialect: "mysql"
  },
  production: {
    username: 'root',
    password: process.env.SEQUELIZE_PASSWORD, // 👈 DB 비번 숨김 (.env)
    database: 'nodebird',
    host: '127.0.0.1',
    dialect: 'mysql',
    logging: false,                           // 👈 (콘솔) SQL문 숨김
  },
};