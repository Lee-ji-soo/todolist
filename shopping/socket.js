const socketIo = require('socket.io')
// const http = require('./app')

const io = socketIo(http)

const socketIdMap = {}

function emitSamePageViewerCount() {
  const countByUrl = Object.values(socketIdMap).reduce((value, url) => {
    return {
      ...value,
      [url]: value[url] ? value[url] + 1 : 1,
    }
  }, {})

  for (const [socketId, url] of Object.entries(socketIdMap)) {
    const count = countByUrl[url]
    io.to(socketId).emit('SAME_PAGE_VIEWER_COUNT', count)
  }
}

function initSocket(sock) {
  console.log('새로운 소켓이 연결됐어요!')

  // 특정 이벤트가 전달됐는지 감지할 때 사용될 함수
  function watchEvent(event, func) {
    sock.on(event, func)
  }

  // 연결된 모든 클라이언트에 데이터를 보낼때 사용될 함수
  function notifyEveryone(event, data) {
    io.emit(event, data)
  }

  return {
    watchBuying: () => {
      watchEvent('BUY', (data) => {
        const emitData = {
          ...data,
          date: new Date().toISOString(),
        }
        notifyEveryone('BUY_GOODS', emitData)
      })
    },

    watchDisconnect: () => {
      watchEvent('disconnect', () => {
        console.log(sock.id, '연결이 끊어졌어요!')
      })
    },

    watchChangedPage: () => {
      watchEvent('CHANGED_PAGE', (data) => {
        socketIdMap[socket.id] = data
        emitSamePageViewerCount()
      })
    },
  }
}

io.on('connection', (socket) => {
  const { watchBuying, watchDisconnect, watchChangedPage } = initSocket(socket)
  socketIdMap[socket.id] = null

  watchChangedPage()
  watchBuying()
  watchDisconnect()

  return
  socket.on('CHANGED_PAGE', (data) => {
    socketIdMap[socket.id] = data
    console.log('page changed', data, soclet.id)
    emitSamePageViewerCount()
  })

  socket.on('BUY', (data) => {
    const payload = {
      nickname: data.nickname,
      goodsId: data.goodsId,
      goodsName: data.goodsName,
      date: new Date().toISOString(),
    }
    console.log('클라이언트가 보낸 데이터')

    //모든 애들에게 보내기
    io.emit('BUY_GOODS', payload)

    //나를 제외한 모두에게 보내기
    socket.broadcast.emit('BUY_GOODS', payload)
  })

  socket.on('disconnect', () => {
    delete socketIdMap[socket.id]
    console.log('누군가 연결을 끊었습니다.')
    emitSamePageViewerCount()
  })
})
