const webPush = require("web-push");
const keys = require("./keys");

const push = {
  sendNotification: function(subscription, payload) {
    try {
      const vapidPublicKey = keys.publicKey;
      const vapidPrivateKey = keys.privateKey;

      const pushSubscription = subscription;

      console.log(subscription, vapidPublicKey, vapidPrivateKey);

      const options = {
        vapidDetails: {
          subject: "mailto: bradley.birch@ig.com",
          publicKey: vapidPublicKey,
          privateKey: vapidPrivateKey
        }
      };

      webPush
        .sendNotification(pushSubscription, payload, options)
        .then(() => console.log("Notification sent"))
        .catch(e => console.log("ERROR", e));
    } catch (e) {
      console.log("ERROR", e);
    }
  }
};

module.exports.push = push;
