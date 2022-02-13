const express = require("express");
// const http = require("http");
const { Server } = require("http");
const socketIo = require("socket.io");

const app = express();
const http = Server(app);
const io = socketIo(http);
// const server = http.createServer(app);
// const { Server } = require("socket.io");
// const io = new Server(server);

// const io = require("socket.io")(http, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST"],
//   },
// });

// app.get("/", (req, res) => {
//   res.sendFile(__dirname + "/index.html");
// });

io.on("connection", (socket) => {
  console.log("back - connection, 새로운 소켓이 연결되었어요!");
  socket.send("back, Hello!");

  socket.on("message", (data) => {
    console.log("back- message, data" + "<" + data + ">");
  });

  socket.emit("customEventName", "this is custom event data");

  socket.on("disconnect", () => {
    console.log(socket.id, "연결이 끊어졌어요!");
  });
});

http.listen(8080, () => {
  console.log("listening on *:8080");
});
