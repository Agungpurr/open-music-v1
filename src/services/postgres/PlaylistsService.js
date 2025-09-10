const { Pool } = require("pg");
const { nanoid } = require("nanoid");
const InvariantError = require("../../exceptions/InvariantError");
const NotFoundError = require("../../exceptions/NotFoundError");
const AuthorizationError = require("../../exceptions/AuthorizationError");

class PlaylistService {
  constructor(collaborationsService) {
    this._pool = new Pool();
    this._collaborationsService = collaborationsService;
  }

  async addPlaylist({ name, owner }) {
    const id = `playlist-${nanoid(16)}`;

    const query = {
      text: "INSERT INTO playlists (id, name, owner) VALUES($1, $2, $3) RETURNING id",
      values: [id, name, owner],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError("Playlist gagal ditambahkan");
    }
    return result.rows[0].id;
  }

  async getPlaylists(owner) {
    const query = {
      text: `SELECT p.id, p.name, u.username 
             FROM playlists p
             LEFT JOIN users u ON u.id = p.owner
             LEFT JOIN collaborations c ON c.playlist_id = p.id
             WHERE p.owner = $1 OR c.user_id = $1
             GROUP BY p.id, u.username`,
      values: [owner],
    };

    const result = await this._pool.query(query);
    return result.rows;
  }

  async deletePlaylistById(id) {
    const query = {
      text: "DELETE FROM playlists WHERE id = $1 RETURNING id",
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError("Playlist gagal dihapus. Id tidak ditemukan");
    }
  }

  async addSongToPlaylist(playlistId, songId) {
    // cek apakah songId ada di tabel songs
    const songCheck = await this._pool.query({
      text: "SELECT id FROM songs WHERE id = $1",
      values: [songId],
    });

    if (!songCheck.rows.length) {
      throw new NotFoundError("Lagu tidak ditemukan");
    }

    const id = `ps-${nanoid(16)}`;
    const query = {
      text: "INSERT INTO playlist_songs (id, playlist_id, songs_id) VALUES($1, $2, $3) RETURNING id",
      values: [id, playlistId, songId],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError("Lagu gagal ditambahkan ke playlist");
    }
  }

  async getSongFromPlaylist(playlistId) {
    const playlistQuery = {
      text: `SELECT p.id, p.name, u.username 
             FROM playlists p
             LEFT JOIN users u ON u.id = p.owner
             WHERE p.id = $1`,
      values: [playlistId],
    };

    const songsQuery = {
      text: `SELECT s.id, s.title, s.performer 
             FROM songs s
             LEFT JOIN playlist_songs ps ON ps.songs_id = s.id
             WHERE ps.playlist_id = $1`,
      values: [playlistId],
    };

    const playlistResult = await this._pool.query(playlistQuery);
    const songsResult = await this._pool.query(songsQuery);

    if (!playlistResult.rows.length) {
      throw new NotFoundError("Playlist tidak ditemukan");
    }

    const playlist = playlistResult.rows[0];
    playlist.songs = songsResult.rows;

    return playlist;
  }

  async deleteSongFromPlaylist(playlistId, songId) {
    const query = {
      text: "DELETE FROM playlist_songs WHERE playlist_id = $1 AND songs_id = $2 RETURNING id",
      values: [playlistId, songId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError("Lagu gagal dihapus dari playlist");
    }
  }

  async verifyPlaylistOwner(id, owner) {
    const query = {
      text: "SELECT * FROM playlists WHERE id = $1",
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError("Playlist tidak ditemukan");
    }
    const playlist = result.rows[0];

    if (playlist.owner !== owner) {
      throw new AuthorizationError("Anda tidak berhak mengakses resource ini");
    }
  }

  async verifyPlaylistAccess(playlistId, userId) {
    try {
      // coba cek apakah user adalah owner
      await this.verifyPlaylistOwner(playlistId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        // kalau playlist tidak ada → tetap lempar error itu
        throw error;
      }
      try {
        // kalau bukan owner, cek apakah collaborator
        await this._collaborationsService.verifyCollaborator(
          playlistId,
          userId
        );
      } catch {
        // kalau gagal juga, berarti bukan owner & bukan collaborator → forbidden
        throw new AuthorizationError(
          "Anda tidak berhak mengakses resource ini"
        );
      }
    }
  }

  async addActivity(playlistId, songId, userId, action) {
    const id = `activity-${nanoid(16)}`;
    const time = new Date().toISOString();

    const query = {
      text: `INSERT INTO playlist_song_activities 
             (id, playlist_id, songs_id, user_id, action, time) 
             VALUES($1, $2, $3, $4, $5, $6) RETURNING id`,
      values: [id, playlistId, songId, userId, action, time],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError("Aktivitas gagal ditambahkan");
    }
  }

  async getActivities(playlistId) {
    const query = {
      text: `SELECT u.username, s.title, psa.action, psa.time
             FROM playlist_song_activities psa
             LEFT JOIN users u ON u.id = psa.user_id
             LEFT JOIN songs s ON s.id = psa.songs_id
             WHERE psa.playlist_id = $1
             ORDER BY psa.time ASC`,
      values: [playlistId],
    };
    const result = await this._pool.query(query);
    return result.rows;
  }
}

module.exports = PlaylistService;
