"use strict";
const ls = require("lightstreamer-client");
const { push } = require("./push-notification");

class Streaming {
  constructor() {
    this.lsClients = {};
  }

  extractMessageAsJson(itemUpdate, field, prefix) {
    const value = itemUpdate.getValue(field);
    if (!value || value === "INV" || !value.startsWith(prefix)) {
      return;
    }
    return JSON.parse(value.replace(prefix, "").trim());
  }

  createInitialStream(id, xst, lsEndpoint, pushData) {
    console.log(`Creating initial connection for ${id}`);
    const lsClient = new ls.LightstreamerClient(lsEndpoint, "InVisionProvider");
    lsClient.connectionDetails.setUser(id);
    lsClient.connectionDetails.setPassword(`XST-${xst}`);

    lsClient.addListener({
      onListenStart: () => {
        console.log("Attempting connection to Lightstreamer");
      },
      onStatusChange: status => {
        console.log("Lightstreamer connection status: " + status);
      },
      onServerError: (errorCode, errorMessage) => {
        console.log(
          "Lightstreamer error: " + errorCode + " message: " + errorMessage
        );
      }
    });
    lsClient.connect();
    this.lsClients[id] = lsClient;
  }

  createPositionsSubscription(id, pushData) {
    const lsClient = this.lsClients[id];
    try {
      const subscription = new ls.Subscription(
        "RAW",
        `V2-M-MESSAGE_EVENT_HANDLER|${id}-OP-JSON`,
        ["json"]
      );

      subscription.addListener({
        onSubscription: function() {
          console.log("Subscribed to: " + items + ` ${id}`);
        },

        onUnsubscription: function() {
          console.log("Unsubscribed" + ` ${id}`);
        },

        onSubscriptionError: (code, message) => {
          console.log(
            "Subscription failure: " + code + " message: " + message + ` ${id}`
          );
        },

        onItemUpdate: itemUpdate => {
          const opu = this.extractMessageAsJson(itemUpdate, "json", "OPU");
          if (!opu || !opu.header) {
            return;
          }
          if (opu.header.contentType === "OpenPositionUpdate") {
            console.log("update" + ` ${id}`);

            push.sendNotification(
              pushData,
              `Position update on ${opu.body.epic.instrumentName}`
            );
          } else if (opu.header.contentType === "OpenPositionDelete") {
            console.log("delete" + ` ${id}`);
            push.sendNotification(pushData, `Position removed`);
          } else if (opu.header.contentType === "OpenPositionAdd") {
            console.log("add" + ` ${id}`);
            push.sendNotification(
              pushData,
              `Position created on ${opu.body.epic.instrumentName}`
            );
          }
        }
      });
      lsClient.subscribe(subscription);
    } catch (e) {
      throw new Error("ERROR", id, e);
    }
  }
}

exports.Streaming = Streaming;
