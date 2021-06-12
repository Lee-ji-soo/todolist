const app = require('./app') // 실제 서버를 키진 않고 테스트
const supertest = require('supertest')

// supertest(app).get("./index.html")

test('/index.html 경로에 요청했을 때 status code가 200이어야 한다.', async() => {
  const res = await supertest(app).get('/index.html');
  expect(res.status).toEqual(200);
})

test('/test.html 경로에 요청했을 때 status code가 404이어야 한다.', async() => {
  const res = await supertest(app).get('/test.html');
  expect(res.status).toEqual(404);
})

