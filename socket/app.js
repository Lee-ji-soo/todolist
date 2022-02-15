const Http = require("http");
const express = require("express"); //http가 express의 확장 모델 
const socketIo = require("socket.io");

const app = express();
const http = Http.createServer(app); 

const io = socketIo(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.static('assets'))

http.listen(3000, () => {
  console.log("서버가 켜졌습니다. http")
})

io.on("connection", socket => {
  console.log("연결이 되었습니다.");

  socket.send("너 연결 잘 됬어@") // send : message ("message", "너 연결 잘됬어")

  socket.on('customEventName', (data) => {
    socket.emit("customEventName", `${data} : msg from fe`)
  })
})