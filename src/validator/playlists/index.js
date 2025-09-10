const { validate } = require("@hapi/joi/lib/base");
const InvariantError = require("../../exceptions/InvariantError");
const {
  PlaylistPayloadSchema,
  PlaylistSongPayloadSchema,
} = require("./schema");

const PlaylistValidator = {
  validatePayload: (payload) => {
    const validationResult = PlaylistPayloadSchema.validate(payload);

    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
  validatePlaylistSongPayload: (payload) => {
    const validationResult = PlaylistSongPayloadSchema.validate(payload);

    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
};

module.exports = PlaylistValidator;
