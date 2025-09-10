const { valid } = require("joi");
const playlists = require("../playlists");
const CollaborationsHandler = require("./handler");
const routes = require("./routes");
const { server } = require("@hapi/hapi");

module.exports = {
  name: "collaborations",
  version: "1.0.0",
  register: async (
    server,
    { collaborationsService, playlistService, validator }
  ) => {
    const collaborationsHandler = new CollaborationsHandler(
      collaborationsService,
      playlistService,
      validator
    );
    server.route(routes(collaborationsHandler));
  },
};
