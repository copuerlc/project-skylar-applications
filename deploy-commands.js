const {
  REST,
  Routes
} = require("discord.js");
const config = require("./src/config");
const commands = [
  require("./src/commands/applications"),
  require("./src/commands/application")
];

const rest = new REST({ version: "10" }).setToken(config.token);

(async () => {
  try {
    const body = commands.map(command => command.data.toJSON());

    if (config.guildId) {
      await rest.put(
        Routes.applicationGuildCommands(config.clientId, config.guildId),
        { body }
      );
      console.log(`Deployed commands to guild ${config.guildId}.`);
    } else {
      await rest.put(
        Routes.applicationCommands(config.clientId),
        { body }
      );
      console.log("Deployed global commands.");
    }
  } catch (error) {
    console.error("Command deployment failed:", error);
    process.exit(1);
  }
})();
