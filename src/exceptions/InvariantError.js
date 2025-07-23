const ClientError = require("./ClientError");

class InvarinatError extends ClientError {
  constructor(message) {
    super(message);
    this.name = "InvariantError";
  }
}

module.exports = InvarinatError;
