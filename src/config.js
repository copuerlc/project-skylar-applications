const path = require("node:path");
require("dotenv").config();

const required = ["TOKEN", "CLIENT_ID"];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

module.exports = {
  token: process.env.TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID || null,
  databasePath: path.join(__dirname, "..", "data", "skylar.sqlite"),
  brand: "Project Skylar"
};
