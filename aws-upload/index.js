const sharp = require('sharp');             // 이미지 처리 라이브러리 (리사이징, 크롭, 필터링 등)
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');

// 👇 S3 연결 객체
const s3 = new S3Client(); // Lambda가 알아서 "AWS 액세스 키" 넣어줌

// Lambda에서 실행되는 함수
exports.handler = async (event, context, callback) => {
    // 👇 1. S3 버킷(my-nodebird/original/) 객체 "생성 event" 받음 (버킷명, 파일경로, 파일명, 확장자) 
    const Bucket = event.Records[0].s3.bucket.name;
    const Key = decodeURIComponent(event.Records[0].s3.object.key);     // original/펭수.png
    const filename = Key.split('/').at(-1);                             // 펭수.png
    const ext = Key.split('.').at(-1).toLowerCase();
    const requiredFormat = ext === 'jpg' ? 'jpeg' : ext;
    console.log('name', filename, 'ext', ext);

    try {
        // 👇 2. 원본 이미지 (S3에서 가져옴)
        const getObject = await s3.send(new GetObjectCommand({ Bucket, Key })); // S3 객체
        const buffers = [];
        for await (const data of getObject.Body) {          // S3 객체의 내용을 stream(여러 chunk) 형태로 반환 => 하나의 배열에 모음
            buffers.push(data);
        }
        const imageBuffer = Buffer.concat(buffers);         // 하나의 큰 버퍼(imageBuffer)로 합침 (이미지 처리 라이브러리들이 입력으로 버퍼를 요구하기 때문)
        console.log('put', imageBuffer.length);
        
        // 👇 3. 이미지 리사이징
        const resizedImage = await sharp(imageBuffer)
            .resize(200, 200, { fit: 'inside' })            // 최대 200x200 이내  
            .toFormat(requiredFormat)
            .toBuffer();
        
        // 👇 4. S3(thumb/)에 저장
        await s3.send(new PutObjectCommand({
            Bucket,
            Key: `thumb/${filename}`,                       // thumb/펭수.png
            Body: resizedImage,
        }))
        console.log('put', resizedImage.length);
        return callback(null, `thumb/${filename}`);         // callback(에러, 응답)
    } catch (error) {
        console.error(error);
        return callback(error);
    }
}