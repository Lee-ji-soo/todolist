const http = require("./app");
require("./socket");

http.listen(3000, () => {
  console.log("server.js server on");
});
