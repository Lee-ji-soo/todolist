const Joi = require("joi");

module.exports.joi = Joi.object({
  nickname : Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required(),

  password: Joi.string()
    .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')),

  confirmPassword: Joi.ref("password"),

  email: Joi.string()
    .email({ minDomainSegments: 2, tlds: { allow: ["com", "net"]}})
})
  .with("nickname", "password")
  .with("password", "confirmPassword");