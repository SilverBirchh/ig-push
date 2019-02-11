const config = {
  cors: {
    origin: ["*"],
    additionalHeaders: ["cache-control", "x-requested-with"]
  }
};

const routes = restService => [
  {
    path: "/createConnection",
    method: "POST",
    handler: restService.createConnection.bind(restService),
    config
  },
  {
    path: "/positionSub",
    method: "POST",
    handler: restService.createPositionsSubscription.bind(restService),
    config
  },
  {
    path: "/updateSubscription/{id}",
    method: "PATCH",
    handler: restService.patch.bind(restService),
    config
  },
  {
    path: "/deleteSubscription/{id}",
    method: "DELETE",
    handler: restService.delete.bind(restService),
    config
  },
  {
    path: "/hello",
    method: "GET",
    handler: restService.hello,
    config
  }
];

exports.routes = routes;
