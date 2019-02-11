"use strict";
const Timeout = require("await-timeout");

const { Database } = require("./db");
const { Streaming } = require("./streaming");

const RETRY_COUNT = 3;
const TIMEOUT = 1000;

class Rest {
  constructor() {
    // this.db = new Database();
    this.streaming = new Streaming();
  }

  createConnection(request, reply) {
    try {
      const payload = JSON.parse(request.payload);
      if (Database.get(payload.id)) {
        console.log(`Subscription already exists for ${payload.id}`);
      } else {
        console.log(`Creating connection for ${payload.id}`);
        Database.add(
          payload.id,
          payload.subscription,
          payload.xst,
          payload.lightstreamerEndpoint
        );
        this.streaming.createInitialStream(
          payload.id,
          payload.xst,
          payload.lightstreamerEndpoint,
          payload.subscription
        );
      }
      return reply.response().code(201);
    } catch (e) {
      console.log(e);
      return reply.response(e).code(500);
    }
  }

  async createPositionsSubscription(request, reply) {
    try {
      const { id } = JSON.parse(request.payload);
      console.log(`Looking for user ${id}`);

      let user = Database.get(id);
      let retry = 0;

      while (!user && retry < RETRY_COUNT) {
        console.log(`No user found for ${id}`);
        await Timeout.set(5000);
        console.log(`Trying againg to find ${id}`);
        user = Database.get(id);
        retry++;
      }

      if (user) {
        this.streaming.createPositionsSubscription(id, user.subscription);
        return reply.response().code(201);
      } else {
        return reply.response("User not found").code(404);
      }
    } catch (e) {
      return reply.response(e).code(500);
    }
  }

  patch(request, reply) {}

  delete(request, reply) {}

  hello() {
    return "HELLO!";
  }
}

exports.Rest = Rest;
