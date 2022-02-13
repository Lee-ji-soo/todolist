const express = require("express");
const app = express();
const { createServer } = require("http");
const server = createServer(app);

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

io.on("connection", (socket) => {
  console.log("back - connection, 새로운 소켓이 연결되었어요!");
  socket.send("back, Hello!");

  socket.on("message", (data) => {
    console.log("back- message, data" + "<" + data + ">");
  });

  socket.on("CHAT_SUBMIT", (data) => {
    console.log("CHAT_SUBMIT", data);
    io.emit('CHAT_SUBMIT', data);
  });
});

server.listen(3000, () => {
  console.log("listening on *:3000");
});
