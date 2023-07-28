const { createLogger, format, transports } = require('winston'); 

// 👇 looger 객체
const logger = createLogger({ // logger 설정
    level: 'info',                                                      // info 이상이면, 기록
    format: format.json(),
    transports: [
        new transports.File({ filename: 'combined.log' }),               // info 이상 파일에 기록
        new transports.File({ filename: 'error.log', level: 'error' }),  // error 이상 파일에 기록
    ]
});

// 배포 환경 아니면, 콘솔에도 출력
if (process.env.NODE_ENV !== 'production') {
    logger.add(new transports.Console({ format: format.simple() }));
}

module.exports = logger;