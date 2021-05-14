const admin = require("firebase-admin");
const Notification = require("../models").notification;
const serviceAccount = require("../keys/corona-care-kerala-state-firebase-adminsdk-bwijz-7819f4f9e0.json");
// const serviceAccount = require("../keys/surakshasuperhero-firebase-adminsdk-40jee-d09717213e.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://corona-care-kerala-state.firebaseio.com/"
  // databaseURL: "https://surakshasuperhero.firebaseio.com"
});

module.exports = {
  async sendToDevice(deviceToken, payload, options) {
    if (!payload)
      payload = {
        notification: {
          title: "This is a test notification",
          body: "Notification body"
        },
        data: {
          sender: "Owner(No Payload)",
          somedata: ""
        }
      };
    if (!options)
      options = {
        priority: "high"
      };
    console.log(typeof deviceToken);
    let tokenList = [];
    if (typeof deviceToken == "string") {
      tokenList.push(deviceToken);
    } else {
      tokenList = deviceToken;
    }
    console.log(tokenList);

    return await admin
      .messaging()
      .sendToDevice(deviceToken, payload, options)
      .catch(error => {
        console.log(error);
      });
  },
  async subscribeToTopic(deviceToken, topic) {
    return await admin.messaging().subscribeToTopic(deviceToken, topic);
  },
  async sendToTopic(topic, payload) {
    if (!payload)
      payload = {
        notification: {
          title: "This is a test notification",
          body: "Notification body"
        },
        data: {
          owner: "Generic",
          cost: "0"
        }
      };
    return await admin
      .messaging()
      .sendToTopic(topic, payload)
      .catch(error => {
        console.error(error);
        return error;
      });
  }
};
