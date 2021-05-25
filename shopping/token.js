const jwt = require("jsonwebtoken");

const token = jwt.sign({ test: true }, 'my-secret-key');

const decoded = jwt.decode("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZXN0Ijp0cnVlLCJpYXQiOjE2MjE5NDQ4ODZ9.I4UqM2NyGxiWBVjhQf9WRt5-B6rC1A-RfnlbR0cAT2weeaa");

console.log(decoded)