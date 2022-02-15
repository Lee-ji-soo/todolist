const socketIo = require("socket.io");
const http = require('./app');

const io = socketIo(http);

const socketIdMap = {};

const emitSamePageViewerCount = () => {
  const countByUrl = Object.values(socketIdMap).reduce((value, url) => {
    return {
      ...value,
      [url]: value[url] ? value[url] + 1 : 1,
    };
  }, {});

  for (const [socketId, url] of Object.entries(socketIdMap)) {
    const count = countByUrl[url];
    io.to(socketId).emit("SAME_PAGE_VIEWER_COUNT", count);
  }
};

const initSocket = (socket) => {
  const watchEvent = (event, func) => {
    socket.on(event, func);
  };

  const notifyEveryone = (event, data) => {
    io.emit(event, data);
  };

  return {
    watchBuying: () => {
      watchEvent("BUY", (data) => {
        const emitData = {
          ...data,
          date: new Date().toISOString(),
        };
        notifyEveryone("BUY_GOODS", emitData);
      });
    },

    watchDisconnect: () => {
      watchEvent("disconnect", () => {
        console.log(socket.id, "연결이 끊어졌어요!");
      });
    },

    watchChangedPage: () => {
      watchEvent("CHANGED_PAGE", (data) => {
        socketIdMap[socket.id] = data;
        emitSamePageViewerCount();
      });
    },
  };
};

io.on("connection", (socket) => {
  socketIdMap[socket.id] = null;

  const { watchBuying, watchDisconnect } = initSocket(socket);

  watchBuying();
  watchDisconnect();

  socket.on("CHANGED_PAGE", (data) => {
    socketIdMap[socket.id] = data;
    emitSamePageViewerCount();
  });
});