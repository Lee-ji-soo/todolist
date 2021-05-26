const express = require("express");
const mongoose = require("mongoose");
const User = require("./models/user");
const jwt = require("jsonwebtoken");
const authMiddleware = require("./middlewares/auth-middleware");
const { joi } = require("./joi");

mongoose.connect("mongodb://localhost/shopping-demo", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));

const app = express();
const router = express.Router();


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
    const value = await joi.validateAsync({ email, nickname, password, confirmPassword })  
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

router.post("/auth", async(req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email, password }).exec();
  
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

app.use("/api", express.urlencoded({ extended: false }), router);
app.use(express.static("assets"));

app.listen(8080, () => {
  console.log("서버가 요청을 받을 준비가 됐어요");
});