const express = require("express");
const logger = require("morgan");
const bodyParser = require("body-parser");
const cors = require("cors");
// set up our express application
const app = express();
const autoExpire = require("./src/scripts/auto_expire");
const noLocationHandler = require("./src/scripts/notify_no_location");
app.use(cors()); // TODO: Remove in production
app.use(express.static("./src/static"));
app.use(logger("dev")); // log every request to the console
app.use(bodyParser.json()); // get information from requests
app.use(bodyParser.urlencoded({ extended: false }));
// Require our routes into the application.
require("./src/routes")(app);
autoExpire.ScheduleAutoExpire();
// noLocationHandler.ScheduleNoLocationNotify();
module.exports = app;
//
