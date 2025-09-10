const autoBind = require("auto-bind");

class PlaylistsHandler {
  constructor(playlistService, activitiesService, validator) {
    this._playlistService = playlistService;
    this._activitiesService = activitiesService;
    this._validator = validator;

    autoBind(this);
  }

  async postPlaylistHandler(request, h) {
    this._validator.validatePayload(request.payload);
    const { name } = request.payload;
    const { id: credentialId } = request.auth.credentials;

    const playlistId = await this._playlistService.addPlaylist({
      name,
      owner: credentialId,
    });

    const response = h.response({
      status: "success",
      message: "Playlist berhasil ditambahkan",
      data: { playlistId },
    });
    response.code(201);
    return response;
  }

  async postSongToPlaylistHandler(request, h) {
    this._validator.validatePlaylistSongPayload(request.payload);
    const { id: credentialId } = request.auth.credentials;
    const { id: playlistId } = request.params;
    const { songId } = request.payload;

    await this._playlistService.verifyPlaylistAccess(playlistId, credentialId);
    await this._playlistService.addSongToPlaylist(playlistId, songId);
    await this._activitiesService.addActivity({
      playlistId,
      songId,
      userId: credentialId,
      action: "add",
    });

    const response = h.response({
      status: "success",
      message: "Lagu berhasil ditambahkan ke playlist",
    });
    response.code(201);
    return response;
  }

  async getPlaylistsHandler(request, h) {
    const { id: credentialId } = request.auth.credentials;
    const playlists = await this._playlistService.getPlaylists(credentialId);

    return h.response({
      status: "success",
      data: { playlists },
    });
  }

  async getSongsFromPlaylistHandler(request, h) {
    const { id: credentialId } = request.auth.credentials;
    const { id: playlistId } = request.params;

    await this._playlistService.verifyPlaylistAccess(playlistId, credentialId);
    const playlist = await this._playlistService.getSongFromPlaylist(
      playlistId
    );

    return h.response({
      status: "success",
      data: { playlist },
    });
  }

  async deletePlaylistByIdHandler(request, h) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._playlistService.verifyPlaylistOwner(id, credentialId);
    await this._playlistService.deletePlaylistById(id);

    return h.response({
      status: "success",
      message: "Playlist berhasil dihapus",
    });
  }

  async deleteSongFromPlaylistHandler(request, h) {
    this._validator.validatePlaylistSongPayload(request.payload);
    const { id: playlistId } = request.params;
    const { id: credentialId } = request.auth.credentials;
    const { songId } = request.payload;

    await this._playlistService.verifyPlaylistAccess(playlistId, credentialId);
    await this._playlistService.deleteSongFromPlaylist(playlistId, songId);
    await this._activitiesService.addActivity({
      playlistId,
      songId,
      userId: credentialId,
      action: "delete",
    });

    return h.response({
      status: "success",
      message: "Lagu berhasil dihapus dari playlist",
    });
  }

  async getPlaylistActivitiesHandler(request, h) {
    const { id: playlistId } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._playlistService.verifyPlaylistAccess(playlistId, credentialId);
    const activities = await this._activitiesService.getActivities(playlistId);

    return h.response({
      status: "success",
      data: {
        playlistId,
        activities,
      },
    });
  }
}

module.exports = PlaylistsHandler;
