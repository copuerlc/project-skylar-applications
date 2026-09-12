const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");
const { databasePath } = require("./config");

fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const db = new Database(databasePath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS guild_config (
  guild_id TEXT PRIMARY KEY,
  review_channel_id TEXT,
  reviewer_role_id TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  application_type TEXT NOT NULL,
  answers TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewer_id TEXT,
  review_reason TEXT,
  review_message_id TEXT,
  review_channel_id TEXT,
  created_at TEXT NOT NULL,
  reviewed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_applications_guild_user_status
ON applications(guild_id, user_id, status);

CREATE INDEX IF NOT EXISTS idx_applications_guild_status
ON applications(guild_id, status);
`);

function now() {
  return new Date().toISOString();
}

const statements = {
  getConfig: db.prepare("SELECT * FROM guild_config WHERE guild_id = ?"),
  upsertConfig: db.prepare(`
    INSERT INTO guild_config (guild_id, review_channel_id, reviewer_role_id, updated_at)
    VALUES (@guild_id, @review_channel_id, @reviewer_role_id, @updated_at)
    ON CONFLICT(guild_id) DO UPDATE SET
      review_channel_id = COALESCE(excluded.review_channel_id, guild_config.review_channel_id),
      reviewer_role_id = COALESCE(excluded.reviewer_role_id, guild_config.reviewer_role_id),
      updated_at = excluded.updated_at
  `),
  activeForUser: db.prepare(`
    SELECT * FROM applications
    WHERE guild_id = ? AND user_id = ?
      AND status = 'pending'
    ORDER BY id DESC
  `),
  createApplication: db.prepare(`
    INSERT INTO applications
      (guild_id, user_id, application_type, answers, status, created_at)
    VALUES (?, ?, ?, ?, 'pending', ?)
  `),
  getById: db.prepare("SELECT * FROM applications WHERE id = ? AND guild_id = ?"),
  updateReview: db.prepare(`
    UPDATE applications
    SET status = ?, reviewer_id = ?, review_reason = ?, reviewed_at = ?
    WHERE id = ? AND guild_id = ? AND status = 'pending'
  `),
  updateMessage: db.prepare(`
    UPDATE applications
    SET review_message_id = ?, review_channel_id = ?
    WHERE id = ? AND guild_id = ?
  `),
  stats: db.prepare(`
    SELECT
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) AS accepted,
      SUM(CASE WHEN status = 'denied' THEN 1 ELSE 0 END) AS denied,
      COUNT(*) AS total
    FROM applications WHERE guild_id = ?
  `),
  close: db.prepare(`
    UPDATE applications
    SET status = 'cancelled', reviewer_id = ?, review_reason = ?, reviewed_at = ?
    WHERE id = ? AND guild_id = ? AND status = 'pending'
  `)
};

function getConfig(guildId) {
  return statements.getConfig.get(guildId);
}

function setConfig(guildId, { reviewChannelId, reviewerRoleId }) {
  statements.upsertConfig.run({
    guild_id: guildId,
    review_channel_id: reviewChannelId ?? null,
    reviewer_role_id: reviewerRoleId ?? null,
    updated_at: now()
  });
  return getConfig(guildId);
}

function getActiveApplications(guildId, userId) {
  return statements.activeForUser.all(guildId, userId);
}

function createApplication(guildId, userId, type, answers) {
  const result = statements.createApplication.run(
    guildId, userId, type, JSON.stringify(answers), now()
  );
  return statements.getById.get(result.lastInsertRowid, guildId);
}

function getApplication(guildId, id) {
  return statements.getById.get(id, guildId);
}

function setReview(guildId, id, status, reviewerId, reason) {
  const result = statements.updateReview.run(
    status, reviewerId, reason || null, now(), id, guildId
  );
  return result.changes > 0;
}

function setReviewMessage(guildId, id, messageId, channelId) {
  statements.updateMessage.run(messageId, channelId, id, guildId);
}

function getStats(guildId) {
  const row = statements.stats.get(guildId);
  return {
    pending: Number(row.pending || 0),
    accepted: Number(row.accepted || 0),
    denied: Number(row.denied || 0),
    total: Number(row.total || 0)
  };
}

function closeApplication(guildId, id, reviewerId, reason) {
  return statements.close.run(
    reviewerId, reason || "Closed manually by staff.", now(), id, guildId
  ).changes > 0;
}

module.exports = {
  db,
  getConfig,
  setConfig,
  getActiveApplications,
  createApplication,
  getApplication,
  setReview,
  setReviewMessage,
  getStats,
  closeApplication
};
