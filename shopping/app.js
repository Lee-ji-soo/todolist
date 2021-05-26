const express = require("express");
const mongoose = require("mongoose");
const User = require("./models/user");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const Goods = require("./models/goods");
const Cart = require("./models/cart");
const authMiddleware = require("./middlewares/auth-middleware");

mongoose.connect("mongodb://localhost/shopping-demo", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));

const app = express();
const router = express.Router();

const joiJoinSchema = Joi.object({
  nickname: Joi.string().alphanum().min(3).max(20).required(),
  email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ["com", "net"]}}),
  password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required(),
  confirmPassword: Joi.ref("password")
})

// 회원가입 및 로그인 
router.post("/users", async(req, res) => {
  const { nickname, email, password, confirmPassword } = req.body;

  if(password !== confirmPassword ){
    res.status(400).send({
      errorMessage: "패스워드가 패스워드 확인란과 동일하지 않습니다."
    });
    return; // 코드 종료 예외를 줄여나가는 것의 좋습니다.
  }

  const existUsers = await User.find({
    $or: [{ email }, { nickname }],
  });

  if(existUsers.length){
    res.status(400).send({
      errorMessage: "이미 가입된 이메일 또는 닉네임이 있습니다."
    });
    return;
  }

  try{
    const value = await joiJoinSchema.validateAsync({ email, nickname, password, confirmPassword })  
    const user = new User(value);
    await user.save();
  }catch(err){
    console.log(err)
    res.status(400).send({
      errorMessage: "회원가입을 성공하지 못했습니다."
    })
    return;
  }

  res.status(201).send({ // send는 기본적으로 200을 보냅니다. //created 를 의미하는 201을 보내는 것이 더 적합합니다.
  });
});

const joiAuthSchema = Joi.object({
  email: Joi.string().email().required(),
  password : Joi.string().required()
})

router.post("/auth", async(req, res) => {
  const { email, password } = req.body;
  let value;
  try{
    value = await joiAuthSchema.validateAsync({ email, password })  
  }catch(err){console.log(err)}

  const user = await User.findOne(value).exec();
  
  if(!user){
    res.status(401).send({ // 401 인증 실패라는 의미를 가집니다.
      errorMessage: "아이디 혹은 패스워드가 일치하지 않습니다."
    })
    return;
  }

  const token = jwt.sign({ userId: user.userId }, "my-secret-key");
  res.send({ token })

})

router.get("/users/me", authMiddleware, async(req, res) => { //미들웨어를 추가해주어야 auth 과정을 거치게 됩니다.
  const { user } = res.locals;
  console.log(user);
  res.send({ user });
})


// 상품 


/* 내가 가진 장바구니 목록을 전부 불러온다. */
 router.get("/goods/cart", authMiddleware, async (req, res) => {
  const { userId } = res.locals.user;

  const cart = await Cart.find({
    userId,
  }).exec();

  const goodsIds = cart.map((c) => c.goodsId);

  // 루프 줄이기 위해 Mapping 가능한 객체로 만든것
  const goodsKeyById = await Goods.find({
    _id: { $in: goodsIds },
  })
    .exec()
    .then((goods) =>
      goods.reduce(
        (prev, g) => ({
          ...prev,
          [g.goodsId]: g,
        }),
        {}
      )
    );

  res.send({
    cart: cart.map((c) => ({
      quantity: c.quantity,
      goods: goodsKeyById[c.goodsId],
    })),
  });
});

/* 장바구니에 상품 담기. */
router.put("/goods/:goodsId/cart", authMiddleware, async (req, res) => {
  const { userId } = res.locals.user;
  const { goodsId } = req.params;
  const { quantity } = req.body;

  const existsCart = await Cart.findOne({
    userId,
    goodsId,
  }).exec();

  if (existsCart) {
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

  // NOTE: 성공했을때 응답 값을 클라이언트가 사용하지 않는다.
  res.send({});
});

/* 장바구니 항목 삭제 */
router.delete("/goods/:goodsId/cart", authMiddleware, async (req, res) => {
  const { userId } = res.locals.user;
  const { goodsId } = req.params;

  const existsCart = await Cart.findOne({
    userId,
    goodsId,
  }).exec();

  // 있든 말든 신경 안쓴다. 그냥 있으면 지운다.
  if (existsCart) {
    existsCart.delete();
  }

  // NOTE: 성공했을때 딱히 정해진 응답 값이 없다.
  res.send({});
});

/* 모든 상품 가져오기 */
router.get("/goods", authMiddleware, async (req, res) => {
  const { category } = req.query;
  const goods = await Goods.find(category ? { category } : undefined )
    .sort("-date")
    .exec();

  res.send({ goods });
});

/* 상품 하나만 가져오기 */
router.get("/goods/:goodsId", authMiddleware, async (req, res) => {
  const { goodsId } = req.params;
  const goods = await Goods.findById(goodsId).exec();

  if (!goods) {
    res.status(404).send({});
  } else {
    res.send({ goods });
  }
});

app.use("/api", express.urlencoded({ extended: false }), router);
app.use(express.static("assets"));

app.listen(8080, () => {
  console.log("서버가 요청을 받을 준비가 됐어요");
});