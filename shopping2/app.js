const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { User } = require("./models");
const Goods = require("./models/goods");
const Cart = require("./models/cart");
const authMiddleware = require("./middlewares/auth-middleware");

mongoose.connect("mongodb://localhost/shopping-demo", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "erorr occured: "));

const app = express();
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

  console.log(user);

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

  const cart = await Cart.find({
    userId,
  }).exec();

  const goodsIds = cart.map((c) => c.goodsIds);

  const goodsByIds = await Goods.find({ _id: { $in: goodsIds } }).exec();
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
    userId,
    goodsIs,
  }).exec();

  if (existCart) {
    existsCart.quantity = quantity;
    await existsCart.save();
  } else {
    const cart = new Cart({
      userId,
      goodsId,
      quantity,
    });
    await cart.save();
  }

  res.send({});
});

router.delete("/goods/:goodsId/cart", authMiddleware, async (req, res) => {
  const { userId } = res.locals.user;
  const { goodsId } = req.params;

  const existsCart = await Cart.findOne({
    userId,
    goodsId,
  }).exec();

  if (existsCart) {
    existsCart.delete();
  }

  res.send({});
});

router.get("/goods", authMiddleware, async (req, res) => {
  const { category } = req.query;
  const goods = await Goods.find(category ? { cateogry } : undefined)
    .sort("-date")
    .exec();
  res.send({ goods });
});

router.get("/goods/:goodsId", authMiddleware, async (req, res) => {
  const { goodsId } = req.params;
  const goods = await Goods.findById(goodsId).exec();

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

app.listen(8080, () => {
  console.log("💚 shoppingmall 서버가 켜졌어요");
});
