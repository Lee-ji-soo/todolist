const jwt = require("jsonwebtoken");
const { User } = require("../models");

module.exports = async (req, res, next) => {
  const { authorization } = req.headers;
  const [tokenType, tokenValue] = (authorization || "").split(" ");
  if (!tokenValue || tokenType !== "Bearer") {
    res.status(400).send({
      errorMessage: "로그인 후 이용하세요",
    });
  }

  try {
    const { userId } = jwt.verify(tokenValue, "custom-secret-key");
    User.findByPk(userId).then((user)=>{
      res.locals.user = user;
      next();
    })
  } catch (err) {
    res.status(400).send({
      errorMessage: "로그인 후 이용하세요",
    });
  }
};
