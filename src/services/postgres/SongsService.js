const { nanoid } = require("nanoid");
const { Pool } = require("pg");
const { mapDBToSongs } = require("../../utils");
const NotFoundError = require("../../exceptions/NotFoundError");

class SongsService {
  constructor() {
    this._pool = new Pool();
  }

  async addSong({ title, year, genre, performer, duration, albumId }) {
    const id = nanoid(16);

    const query = {
      text: "INSERT INTO songs VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
      values: [id, title, year, genre, performer, duration, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new Error("Lagu Gagal ditambahkan");
    }

    return result.rows[0].id;
  }

  async getSongs({ title, performer }) {
    const query = {
      text: "SELECT id, title, performer FROM songs",
      values: [],
    };
    const conditions = [];
    let index = 1;

    if (title) {
      conditions.push(`LOWER(title) LIKE LOWER($${index})`);
      query.values.push(`%${title}%`);
      index++;
    }

    if (performer) {
      conditions.push(`LOWER(performer) LIKE LOWER($${index})`);
      query.values.push(`%${performer}%`);
      index++;
    }

    if (conditions.length > 0) {
      query.text += ` WHERE ${conditions.join(" AND ")}`;
    }

    const result = await this._pool.query(query);
    return result.rows.map(mapDBToSongs);
  }

  async getSongById(id) {
    const query = {
      text: "SELECT * FROM songs WHERE id = $1",
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError("Lagu tidak ditemukan");
    }

    return mapDBToSongs(result.rows[0]);
  }

  async editSongById(id, { title, year, genre, performer, duration, albumId }) {
    const query = {
      text: "UPDATE songs SET title = $1, year = $2, genre = $3, performer = $4, duration = $5, album_id = $6 WHERE id = $7 RETURNING id",
      values: [title, year, genre, performer, duration, albumId, id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError("Gagal Memperbarui Lagu. Id tidak ditemukan");
    }
  }

  async deleteSongById(id) {
    const query = {
      text: "DELETE FROM songs WHERE id = $1 RETURNING id",
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError("Lagu gagal dihapus. Id tidak ditemukan");
    }
  }
}

module.exports = SongsService;
