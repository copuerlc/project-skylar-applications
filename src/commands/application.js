const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder
} = require("discord.js");
const {
  getConfig,
  setConfig,
  getApplication,
  getStats,
  closeApplication
} = require("../database");
const { APPLICATIONS } = require("../applications");

const staffPermissions = [
  PermissionFlagsBits.Administrator,
  PermissionFlagsBits.ManageGuild
];

function isStaff(interaction) {
  const config = getConfig(interaction.guildId);
  if (interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) return true;
  if (interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) return true;
  return Boolean(config?.reviewer_role_id && interaction.member?.roles?.cache?.has(config.reviewer_role_id));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("application")
    .setDescription("Manage Project Skylar applications.")
    .addSubcommand(sub =>
      sub
        .setName("setup")
        .setDescription("Configure the application review system.")
        .addChannelOption(option =>
          option.setName("review_channel")
            .setDescription("Channel where applications should be reviewed.")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
        .addRoleOption(option =>
          option.setName("reviewer_role")
            .setDescription("Role allowed to review applications.")
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName("stats").setDescription("Show application statistics.")
    )
    .addSubcommand(sub =>
      sub
        .setName("view")
        .setDescription("View an application.")
        .addIntegerOption(option =>
          option.setName("id").setDescription("Application ID.").setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName("close")
        .setDescription("Close a pending application.")
        .addIntegerOption(option =>
          option.setName("id").setDescription("Application ID.").setRequired(true)
        )
        .addStringOption(option =>
          option.setName("reason").setDescription("Optional closing reason.").setRequired(false)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "setup") {
      if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
        return interaction.reply({ content: "❌ You need **Manage Server**.", ephemeral: true });
      }

      const reviewChannel = interaction.options.getChannel("review_channel");
      const reviewerRole = interaction.options.getRole("reviewer_role");

      setConfig(interaction.guildId, {
        reviewChannelId: reviewChannel.id,
        reviewerRoleId: reviewerRole.id
      });

      return interaction.reply({
        content: `✅ Configured.\nReview channel: ${reviewChannel}\nReviewer role: ${reviewerRole}`,
        ephemeral: true
      });
    }

    if (!isStaff(interaction)) {
      return interaction.reply({
        content: "❌ You are not authorized to use this command.",
        ephemeral: true
      });
    }

    if (sub === "stats") {
      const stats = getStats(interaction.guildId);
      const embed = new EmbedBuilder()
        .setTitle("Project Skylar — Application Statistics")
        .addFields(
          { name: "🟡 Pending", value: String(stats.pending), inline: true },
          { name: "🟢 Accepted", value: String(stats.accepted), inline: true },
          { name: "🔴 Denied", value: String(stats.denied), inline: true },
          { name: "📊 Total", value: String(stats.total), inline: true }
        )
        .setColor(0x5865F2)
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const id = interaction.options.getInteger("id");
    const application = getApplication(interaction.guildId, id);

    if (!application) {
      return interaction.reply({ content: "❌ Application not found.", ephemeral: true });
    }

    if (sub === "close") {
      const reason = interaction.options.getString("reason") || "Closed manually by staff.";
      const changed = closeApplication(
        interaction.guildId, id, interaction.user.id, reason
      );

      return interaction.reply({
        content: changed
          ? `✅ Application **#${String(id).padStart(4, "0")}** was closed.`
          : "❌ This application is no longer pending.",
        ephemeral: true
      });
    }

    if (sub === "view") {
      const appConfig = APPLICATIONS[application.application_type];
      const answers = JSON.parse(application.answers);

      const embed = new EmbedBuilder()
        .setTitle(`Project Skylar — ${appConfig?.name || application.application_type} Application`)
        .setDescription(
          `Application ID: **#${String(application.id).padStart(4, "0")}**\n` +
          `Applicant: <@${application.user_id}>\n` +
          `Status: **${application.status}**`
        )
        .setColor(0x5865F2)
        .setTimestamp(new Date(application.created_at));

      for (const q of (appConfig?.questions || [])) {
        const answer = answers[q.id] ?? "—";
        embed.addFields({
          name: q.question.slice(0, 256),
          value: String(answer).slice(0, 1024) || "—"
        });
      }

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
};
