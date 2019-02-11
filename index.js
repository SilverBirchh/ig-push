const Hapi = require("hapi");
const { push } = require("./push-notification");
const { Rest } = require("./rest");
const { routes } = require("./routes");
const keys = require("./keys");
const webPush = require("web-push");

const server = Hapi.server({
  host: "0.0.0.0",
  port: process.env.PORT || 8080
});

const restService = new Rest();
server.route(routes(restService));

async function startHapi() {
  try {
    await server.start();
  } catch (err) {
    console.log(err);
    process.exit(1);
  }

  console.log("Server running at:", server.info.uri);
}

startHapi();
