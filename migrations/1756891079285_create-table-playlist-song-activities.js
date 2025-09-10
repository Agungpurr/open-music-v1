/* eslint-disable camelcase */

exports.up = (pgm) => {
  pgm.createTable("playlist_song_activities", {
    id: {
      type: "VARCHAR(50)",
      primaryKey: true,
    },
    playlist_id: {
      type: "VARCHAR(50)",
      notNull: true,
      references: "playlists", // ✅ hanya nama tabel
      onDelete: "CASCADE",
    },
    song_id: {
      type: "VARCHAR(50)",
      notNull: true,
      references: "songs", // ✅ hanya nama tabel
      onDelete: "CASCADE",
    },
    user_id: {
      type: "VARCHAR(50)",
      notNull: true,
      references: "users", // ✅ hanya nama tabel
      onDelete: "CASCADE",
    },
    action: {
      type: "TEXT",
      notNull: true,
    },
    time: {
      type: "TEXT",
      notNull: true,
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable("playlist_song_activities");
};
