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
  createPriceAlert(id, pushData, type, level, epic, instrumentName, url) {
    const lsClient = this.lsClients[id];
    try {
      const schema = type === 'sell' ? {
        displayOffer: 'BD1'
      } : {
        displayBid: 'AK1'
      }

      const string = `V2-F-${Object.values(schema).join()}|${epic}`;
      const subscription = new ls.Subscription(
        "MERGE",
        string,
        Object.keys(schema)
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
          itemUpdate.forEachChangedField((name, pos, value) => {
            if (name === Object.keys(schema)[0] && (Math.floor(parseFloat(value)) == Math.floor(parseFloat(level)))) {
              const payload = JSON.stringify({
                title: `Price alert`,
                body: `${instrumentName} has hit ${level}`,
                isAlert: true,
                url
              });
              push.sendNotification(
                pushData, payload
              );
              lsClient.unsubscribe(subscription);
            }
          })
        }
      });
      lsClient.subscribe(subscription);
    } catch (error) {
      throw new Error("ERROR", id, e);
    }
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
            
            const payload = JSON.stringify({
              title: `Position update`,
              body: `Position update on ${opu.body.epic.instrumentName}`
            });
            push.sendNotification(
              pushData, payload
            );
          } else if (opu.header.contentType === "OpenPositionDelete") {
            // console.log("delete" + ` ${id}`);
            // const payload = JSON.stringify({
            //   title: `Position removed`,
            // });
            // push.sendNotification(
            //   pushData, payload
            // );
          } else if (opu.header.contentType === "OpenPositionAdd") {
            console.log("add" + ` ${id}`);
            const payload = JSON.stringify({
              title: `Position update`,
              body: `Position created on ${opu.body.epic.instrumentName}`
            });
            push.sendNotification(
              pushData, payload
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
