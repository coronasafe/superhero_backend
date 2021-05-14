const auth = require("./auth");
const asset = require("./asset");
const user = require("./user");
const service_request = require("./service_request");
const fdc = require("./fdc");
const meal_request = require("./meal_request");
const phc = require("./phc");

module.exports = (app) => {
  // Auth endpoints
  app.use("/auth", auth);
  app.use("/asset", asset);
  app.use("/user", user);
  app.use("/service/request", service_request);
  app.use("/fdc", fdc);
  app.use("/meal/request", meal_request);
  app.use("/phc", phc);
  // 404
  app.all("*", (req, res) =>
    res.status(200).send({
      status: 200,
      message: "You are lost",
    })
  );
};
