require("dotenv").config();
const Hapi = require("@hapi/hapi");
const Jwt = require("@hapi/jwt");

// Plugins
const albums = require("./api/albums");
const songs = require("./api/songs");
const users = require("./api/users");
const playlists = require("./api/playlists");
const authentications = require("./api/authentications");
const collaborations = require("./api/collaborations");

// Services
const AlbumsService = require("./services/postgres/AlbumsService");
const SongsService = require("./services/postgres/SongsService");
const UsersService = require("./services/postgres/UsersService");
const PlaylistsService = require("./services/postgres/PlaylistsService");
const AuthenticationsService = require("./services/postgres/AuthenticationsService");
const CollaborationsService = require("./services/postgres/CollaborationsService");
const ActivitiesService = require("./services/postgres/ActivitiesService");
// Validators
const AlbumsValidator = require("./validator/albums");
const SongsValidator = require("./validator/songs");
const UsersValidator = require("./validator/users");
const PlaylistValidator = require("./validator/playlists");
const AuthenticatorValidator = require("./validator/authentications");
const CollaborationsValidator = require("./validator/collaborations");

// Utils
const ClientError = require("./exceptions/ClientError");
const TokenManager = require("./tokenize/TokenManager");

const init = async () => {
  // Instance semua service
  const albumsService = new AlbumsService();
  const songsService = new SongsService();
  const usersService = new UsersService();
  const playlistsService = new PlaylistsService();
  const authenticationsService = new AuthenticationsService();
  const collaborationsService = new CollaborationsService();
  const activitiesService = new ActivitiesService();

  const server = Hapi.server({
    port: process.env.PORT || 5000,
    host: process.env.HOST || "localhost",
    routes: {
      cors: { origin: ["*"] },
    },
  });

  await server.register(Jwt);

  server.auth.strategy("openmusic_jwt", "jwt", {
    keys: process.env.ACCESS_TOKEN_KEY,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: process.env.ACCESS_TOKEN_AGE, // contoh: '1800'
    },
    validate: (artifacts) => ({
      isValid: true,
      credentials: {
        id: artifacts.decoded.payload.id,
      },
    }),
  });

  await server.register([
    {
      plugin: albums,
      options: { service: albumsService, validator: AlbumsValidator },
    },
    {
      plugin: songs,
      options: { service: songsService, validator: SongsValidator },
    },
    {
      plugin: users,
      options: { service: usersService, validator: UsersValidator },
    },
    {
      plugin: authentications,
      options: {
        authenticationsService,
        usersService,
        tokenManager: TokenManager,
        validator: AuthenticatorValidator,
      },
    },
    {
      plugin: playlists,
      options: {
        playlistService: playlistsService,
        activitiesService,
        validator: PlaylistValidator,
      },
    },
    {
      plugin: collaborations,
      options: {
        collaborationsService,
        playlistsService,
        usersService,
        validator: CollaborationsValidator,
      },
    },
  ]);

  // Error handling
  server.ext("onPreResponse", (request, h) => {
    const { response } = request;

    if (response instanceof Error) {
      if (response instanceof ClientError) {
        const newResponse = h.response({
          status: "fail",
          message: response.message,
        });
        newResponse.code(response.statusCode);
        return newResponse;
      }

      if (!response.isServer) return h.continue;

      console.error(response);

      const newResponse = h.response({
        status: "error",
        message: "terjadi kegagalan pada server kami",
      });
      newResponse.code(500);
      return newResponse;
    }

    return h.continue;
  });

  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
};

init()
  .then(() => {
    console.log("✅ Server berhasil start 🚀");
  })
  .catch((err) => {
    console.error("❌ Gagal start server:", err);
    process.exit(1);
  });
