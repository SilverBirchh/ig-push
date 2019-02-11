class Database {
  static get(id) {
    console.log(`Searching for ${id}`);
    console.log(Object.keys(Database.cache));
    return Database.cache[id];
  }

  static add(id, subscription, xst, lightstreamerEndpoint) {
    if (Database.cache[id]) {
      console.log(`ID already added. No action taken. ${id}`);
      return;
    }
    console.log(`Adding user ${id}`);
    Database.cache[id] = {
      subscription,
      xst,
      lightstreamerEndpoint
    };
    console.log(Object.keys(Database.cache));
  }

  static remove(id) {
    if (!Database.cache[id]) {
      throw new Error("Missing ID");
    }
    delete Database.cache[id];
  }

  static update(id, subscription) {
    if (!Database.cache[id]) {
      throw new Error("Missing ID");
    }
    Database.cache[id].subscription = subscription;
  }

  static toString() {
    return Database.cache;
  }
}

Database.cache = {};

exports.Database = Database;
