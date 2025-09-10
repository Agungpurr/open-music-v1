const PlaylistHandler = require("./handler");
const routes = require("./routes");

module.exports = {
  name: "playlists",
  version: "1.0.0",
  register: async (
    server,
    { playlistService, activitiesService, validator }
  ) => {
    const playlistHandler = new PlaylistHandler(
      playlistService,
      activitiesService,
      validator
    );
    server.route(routes(playlistHandler));
  },
};
