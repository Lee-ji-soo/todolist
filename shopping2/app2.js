const express = require("express");
const Http = require("http");
const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { User, Goods, Cart } = require("./models");
const authMiddleware = require("./middlewares/auth-middleware");
const app = express();
const http = Http.createServer(app);

const io = socketIo(http);
const socketIdMap = {};

const emitPageViewCount =( ) => {
  const urlCounts = Object.values(socketIdMap).reduce((acc, url)=>{
    return {
      ...acc,
      [url]: acc[url] ? acc[url] + 1 : 1,
    };
  },{});
 
  for (const [socketId, url] of Object.entries(socketIdMap)){
    const count = urlCounts[url]
    io.to(socketId).emit('SAME_PAGE_VIEWER_COUNT', count);
  }
};

io.on("connection", (socket) => {
  socketIdMap[socket.id] = null;
  socket.on("BUY", (data) => {
    console.log("BUY", data);
    const emitData = {
      ...data,
      date: new Date().toISOString(),
    };
    io.emit("BUY_GOODS", emitData);
  });

  socket.on("CHANGED_PAGE", (data) => {
    socketIdMap[socket.id] = data;
    emitPageViewCount();
  });
});
const router = express.Router();

router.post("/users", async (req, res) => {
  const { email, nickname, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    res.status(400).send({
      errorMessage: "패스워드가, 패스워드 확인란과 다릅니다!",
    });
    return;
  }

  const existsUsers = await User.findAll({
    where: {
      [Op.or]: [{ email }, { nickname }],
    },
  });
  if (existsUsers.length) {
    res.status(400).send({
      errorMessage: "이메일 또는 닉네임이 이미 사용중입니다.",
    });
    return;
  }
  await User.create({ email, nickname, password });
  await res.status(200).send({});
});

router.post("/auth", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({
    where: { email },
  });

  if (!user || password !== user.password) {
    res.status(400).send({
      errorMessage: "아이디 혹은 비밀번호가 일치하지 않씁니다.",
    });
    return;
  }
  res.send({ token: jwt.sign({ userId: user.userId }, "custom-secret-key") });
});

router.get("/users/me", authMiddleware, async (req, res) => {
  res.send({ user: res.locals.user });
});

router.get("/goods/cart", authMiddleware, async (req, res) => {
  const { userId } = res.locals.user;

  const cart = await Cart.findAll({
    where: {
      userId,
    },
  });
  const goodsIds = cart.map((c) => c.goodsId);
  const goodsByIds = await Goods.findAll({
    where: { goodsId: goodsIds },
  });
  const goodsKeyById = goodsByIds.reduce((prev, g) => {
    return { ...prev, [g.goodsId]: g };
  }, {});

  const modifiedCart = cart.map((c) => {
    return {
      quantity: c.quantity,
      goods: goodsKeyById[c.goodsId],
    };
  });

  res.send({
    cart: modifiedCart,
  });
});

router.put("/goods/:goodsId/cart", authMiddleware, async (req, res) => {
  const { userId } = res.locals.user;
  const { goodsId } = req.params;
  const { quantity } = req.body;

  const existsCart = await Cart.findOne({
    where: { userId, goodsId },
  });

  if (existsCart) {
    existsCart.quantity = quantity;
    await existsCart.save();
  } else {
    await Cart.create({
      userId,
      goodsId,
      quantity,
    });
  }
  res.send({});
});

router.delete("/goods/:goodsId/cart", authMiddleware, async (req, res) => {
  const { userId } = res.locals.user;
  const { goodsId } = req.params;

  const existsCart = await Cart.findOne({
    where: {
      userId,
      goodsId,
    },
  });

  if (existsCart) {
    existsCart.destroy();
  }

  res.send({});
});

router.get("/goods", authMiddleware, async (req, res) => {
  const { category } = req.query;
  const goods = await Goods.findAll({
    where: category
      ? {
          category,
        }
      : undefined,
  });
  res.send({ goods });
});

router.get("/goods/:goodsId", authMiddleware, async (req, res) => {
  const { goodsId } = req.params;
  const goods = await Goods.findByPk(goodsId);
  if (!goods) {
    res.status(404).send({
      sendMessage: "존재하지 않느 상품입니다.",
    });
  } else {
    res.status(200).send({
      goods,
    });
  }
});

app.use("/api", express.urlencoded({ extended: false }), router);
app.use(express.static("assets"));

http.listen(8080, () => {
  console.log("💚 shoppingmall 서버가 켜졌어요");
});
