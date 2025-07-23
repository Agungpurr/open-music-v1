const autoBind = require("auto-bind");

class Songshandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    autoBind(this);
  }

  async postSongHandler(request, h) {
    this._validator.validateSongPayload(request.payload);
    const songId = await this._service.addSong(request.payload);

    const response = h.response({
      status: "success",
      data: {
        songId,
      },
    });
    response.code(201);
    return response;
  }

  async getSongsHandler(request) {
    const { title, performer } = request.query;

    // Pastikan parameter query diproses dengan benar untuk pencarian
    const queryParams = {};
    if (title) queryParams.title = title;
    if (performer) queryParams.performer = performer;

    const songs = await this._service.getSongs(queryParams);

    return {
      status: "success",
      data: {
        songs,
      },
    };
  }

  async getSongByIdHandler(request) {
    const { id } = request.params;
    const song = await this._service.getSongById(id);

    return {
      status: "success",
      data: {
        song,
      },
    };
  }

  async putSongByIdHandler(request) {
    const { id } = request.params;

    // Pastikan lagu exists terlebih dahulu sebelum validasi
    // Ini akan throw NotFoundError jika lagu tidak ada
    await this._service.getSongById(id);

    // Baru lakukan validasi payload setelah memastikan lagu ada
    this._validator.validateSongPayload(request.payload);

    await this._service.editSongById(id, request.payload);

    return {
      status: "success",
      message: "Lagu berhasil diperbarui",
    };
  }

  async deleteSongByIdHandler(request) {
    const { id } = request.params;

    // Pastikan lagu exists sebelum menghapus
    await this._service.getSongById(id);

    await this._service.deleteSongById(id);

    return {
      status: "success",
      message: "Lagu berhasil dihapus",
    };
  }
}

module.exports = Songshandler;
