const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require("discord.js");

const config = require("./config");
const { APPLICATIONS } = require("./applications");
const db = require("./database");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

const commands = [
  require("./commands/applications"),
  require("./commands/application")
];

client.commands = new Collection(commands.map(command => [command.data.name, command]));

const sessions = new Map();

function appId(id) {
  return `#${String(id).padStart(4, "0")}`;
}

function buildQuestionEmbed(app, session) {
  const q = app.questions[session.index];
  const embed = new EmbedBuilder()
    .setTitle(`Project Skylar — ${app.name} Application`)
    .setDescription(
      `**Question ${session.index + 1}/${app.questions.length}**\n\n${q.question}\n\n` +
      `Type \`cancel\` at any time to cancel your application.`
    )
    .setColor(0x5865F2)
    .setFooter({ text: `Project Skylar • ${q.type}` });

  if (q.type === "yesno") {
    embed.addFields({ name: "Accepted answers", value: "`yes` or `no`" });
  } else if (q.type === "number") {
    embed.addFields({ name: "Accepted answer", value: "Numbers only" });
  } else if (q.type === "multiple") {
    embed.addFields({ name: "Choices", value: q.choices.map(x => `• ${x}`).join("\n").slice(0, 1024) });
  }

  return embed;
}

function validateAnswer(question, raw) {
  const value = raw.trim();
  if (!value) return { ok: false, reason: "Please provide an answer." };

  if (question.type === "number") {
    const number = Number(value);
    if (!Number.isFinite(number)) return { ok: false, reason: "Please enter a valid number." };
    return { ok: true, value: String(number) };
  }

  if (question.type === "yesno") {
    const normalized = value.toLowerCase();
    if (!["yes", "no", "y", "n", "jah", "ei"].includes(normalized)) {
      return { ok: false, reason: "Please answer with **yes** or **no**." };
    }
    return { ok: true, value: ["yes", "y", "jah"].includes(normalized) ? "Yes" : "No" };
  }

  if (question.type === "multiple") {
    const match = question.choices.find(
      choice => choice.toLowerCase() === value.toLowerCase()
    );
    if (!match) {
      return {
        ok: false,
        reason: `Please choose one of: ${question.choices.map(x => `\`${x}\``).join(", ")}`
      };
    }
    return { ok: true, value: match };
  }

  return { ok: true, value };
}

async function sendNextQuestion(user, session) {
  const app = APPLICATIONS[session.applicationType];
  await user.send({ embeds: [buildQuestionEmbed(app, session)] });
}

async function startApplication(interaction, applicationType) {
  const app = APPLICATIONS[applicationType];
  if (!app) return interaction.reply({ content: "❌ Invalid application type.", ephemeral: true });

  const existing = db.getActiveApplications(interaction.guildId, interaction.user.id);
  if (existing.length > 0) {
    return interaction.reply({
      content: `⚠️ You already have an application in progress (${appId(existing[0].id)}).`,
      ephemeral: true
    });
  }

  const configRow = db.getConfig(interaction.guildId);
  if (!configRow?.review_channel_id) {
    return interaction.reply({
      content: "❌ Applications are not configured by this server yet.",
      ephemeral: true
    });
  }

  try {
    await interaction.user.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("Project Skylar Applications")
          .setDescription(
            `You are applying for **${app.name}**.\n\n` +
            "Your application will be completed privately in this DM.\n" +
            "Answer one question at a time. Type `cancel` to stop."
          )
          .setColor(0x5865F2)
      ]
    });
  } catch (error) {
    return interaction.reply({
      content: "❌ I could not DM you. Please enable **Direct Messages from server members** and try again.",
      ephemeral: true
    });
  }

  sessions.set(interaction.user.id, {
    guildId: interaction.guildId,
    applicationType,
    index: 0,
    answers: {}
  });

  await interaction.reply({
    content: "✅ Check your DMs to continue your application.",
    ephemeral: true
  });

  try {
    await sendNextQuestion(interaction.user, sessions.get(interaction.user.id));
  } catch (error) {
    console.error("Failed to send first application question:", error);
    sessions.delete(interaction.user.id);
  }
}

async function finishApplication(user, session) {
  const application = db.createApplication(
    session.guildId,
    user.id,
    session.applicationType,
    session.answers
  );

  const app = APPLICATIONS[session.applicationType];
  const configRow = db.getConfig(session.guildId);

  let reviewChannel;
  try {
    reviewChannel = await client.channels.fetch(configRow.review_channel_id);
  } catch (error) {
    console.error("Review channel fetch failed:", error);
  }

  if (!reviewChannel?.isTextBased()) {
    await user.send("⚠️ Your application was saved, but the review channel is currently unavailable. Staff can still access it from the database.");
    sessions.delete(user.id);
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`New ${app.name} Application`)
    .setDescription(
      `**Applicant:** <@${user.id}>\n` +
      `**Application ID:** \`${appId(application.id)}\`\n` +
      `**Status:** 🟡 Pending`
    )
    .setColor(0xFEE75C)
    .setTimestamp(new Date(application.created_at));

  for (const q of app.questions) {
    embed.addFields({
      name: q.question.slice(0, 256),
      value: String(session.answers[q.id] ?? "—").slice(0, 1024) || "—"
    });
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`review:accept:${application.id}`)
      .setLabel("Accept Application")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`review:deny:${application.id}`)
      .setLabel("Deny Application")
      .setStyle(ButtonStyle.Danger)
  );

  try {
    const message = await reviewChannel.send({ embeds: [embed], components: [row] });
    db.setReviewMessage(session.guildId, application.id, message.id, reviewChannel.id);
  } catch (error) {
    console.error("Failed to send review application:", error);
  }

  await user.send({
    embeds: [
      new EmbedBuilder()
        .setTitle("Application Submitted")
        .setDescription(
          `Your **${app.name}** application has been successfully submitted.\n\n` +
          `Application ID: \`${appId(application.id)}\`\n\n` +
          "The Project Skylar team will review your application."
        )
        .setColor(0x57F287)
    ]
  });

  sessions.delete(user.id);
}

function buildReviewEmbed(oldEmbed, status, reviewerId, reason) {
  const embed = EmbedBuilder.from(oldEmbed);
  const statusMap = {
    accepted: "🟢 Accepted",
    denied: "🔴 Denied",
    cancelled: "⚪ Cancelled"
  };
  const fields = embed.data.fields || [];
  const withoutStatus = fields.filter(f => f.name !== "Review");
  embed.setFields([
    { name: "Review", value:
      `${statusMap[status] || status}\n` +
      `Reviewer: <@${reviewerId}>\n` +
      `Reason: ${reason || "No reason provided."}`
    },
    ...withoutStatus
  ]);
  embed.setColor(status === "accepted" ? 0x57F287 : 0xED4245);
  return embed;
}

async function handleReview(interaction, status, id) {
  const application = db.getApplication(interaction.guildId, id);
  if (!application) {
    return interaction.reply({ content: "❌ Application not found.", ephemeral: true });
  }

  const cfg = db.getConfig(interaction.guildId);
  const authorized =
    interaction.memberPermissions?.has("Administrator") ||
    interaction.memberPermissions?.has("ManageGuild") ||
    Boolean(cfg?.reviewer_role_id && interaction.member?.roles?.cache?.has(cfg.reviewer_role_id));

  if (!authorized) {
    return interaction.reply({ content: "❌ You are not authorized to review applications.", ephemeral: true });
  }

  if (application.status !== "pending") {
    return interaction.reply({ content: "⚠️ This application has already been reviewed.", ephemeral: true });
  }

  const modal = new ModalBuilder()
    .setCustomId(`reviewmodal:${status}:${id}`)
    .setTitle(status === "accepted" ? "Accept Application" : "Deny Application");

  const input = new TextInputBuilder()
    .setCustomId("reason")
    .setLabel(status === "accepted" ? "Optional reason" : "Denial reason")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(status === "denied")
    .setMaxLength(1000)
    .setPlaceholder(
      status === "accepted"
        ? "Your application was approved."
        : "Explain why the application was denied."
    );

  modal.addComponents(new ActionRowBuilder().addComponents(input));
  return interaction.showModal(modal);
}

async function completeReview(interaction, status, id, reason) {
  const application = db.getApplication(interaction.guildId, id);
  if (!application || application.status !== "pending") {
    return interaction.reply({ content: "⚠️ This application is no longer pending.", ephemeral: true });
  }

  const changed = db.setReview(
    interaction.guildId, id, status, interaction.user.id, reason
  );

  if (!changed) {
    return interaction.reply({ content: "⚠️ This application was already reviewed.", ephemeral: true });
  }

  const oldEmbed = interaction.message.embeds[0];
  const updatedEmbed = buildReviewEmbed(
    oldEmbed,
    status,
    interaction.user.id,
    reason || (status === "accepted" ? "Your application was approved." : "No reason provided.")
  );

  const disabledRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`review:accept:${id}`)
      .setLabel("Accept Application")
      .setStyle(ButtonStyle.Success)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(`review:deny:${id}`)
      .setLabel("Deny Application")
      .setStyle(ButtonStyle.Danger)
      .setDisabled(true)
  );

  await interaction.update({ embeds: [updatedEmbed], components: [disabledRow] });

  const app = APPLICATIONS[application.application_type];
  try {
    const user = await client.users.fetch(application.user_id);
    await user.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("Project Skylar Application")
          .setDescription(
            status === "accepted"
              ? `Congratulations!\n\nYour **${app?.name || application.application_type}** application has been accepted.`
              : `Unfortunately, your **${app?.name || application.application_type}** application has been denied.`
          )
          .addFields(
            { name: "Reviewer", value: `<@${interaction.user.id}>`, inline: true },
            { name: "Reason", value: reason || (status === "accepted" ? "Your application was approved." : "No reason provided.") }
          )
          .setColor(status === "accepted" ? 0x57F287 : 0xED4245)
          .setTimestamp()
      ]
    });
  } catch (error) {
    console.error(`Could not DM applicant ${application.user_id}:`, error);
  }
}

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
  console.log("Project Skylar Applications is ready.");
});

client.on("interactionCreate", async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (command) await command.execute(interaction);
      return;
    }

    if (interaction.isButton()) {
      if (interaction.customId.startsWith("apply:")) {
        return startApplication(
          interaction,
          interaction.customId.slice("apply:".length)
        );
      }

      if (interaction.customId.startsWith("review:accept:")) {
        return handleReview(
          interaction, "accepted",
          Number(interaction.customId.split(":")[2])
        );
      }

      if (interaction.customId.startsWith("review:deny:")) {
        return handleReview(
          interaction, "denied",
          Number(interaction.customId.split(":")[2])
        );
      }
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith("reviewmodal:")) {
      const [, status, id] = interaction.customId.split(":");
      const reason = interaction.fields.getTextInputValue("reason").trim();
      return completeReview(interaction, status, Number(id), reason);
    }
  } catch (error) {
    console.error("Interaction error:", error);
    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "❌ Something went wrong while processing that action.",
        ephemeral: true
      }).catch(() => {});
    }
  }
});

client.on("messageCreate", async message => {
  try {
    if (message.author.bot || message.guildId) return;

    const session = sessions.get(message.author.id);
    if (!session) return;

    const raw = message.content.trim();
    if (raw.toLowerCase() === "cancel") {
      sessions.delete(message.author.id);
      await message.reply("❌ Your Project Skylar application has been cancelled.");
      return;
    }

    const app = APPLICATIONS[session.applicationType];
    const question = app.questions[session.index];
    const result = validateAnswer(question, raw);

    if (!result.ok) {
      await message.reply(`⚠️ ${result.reason}`);
      return;
    }

    session.answers[question.id] = result.value;
    session.index++;

    if (session.index >= app.questions.length) {
      await finishApplication(message.author, session);
      return;
    }

    await sendNextQuestion(message.author, session);
  } catch (error) {
    console.error("DM application error:", error);
    await message.reply("❌ Something went wrong. Your application session has been stopped.").catch(() => {});
    sessions.delete(message.author.id);
  }
});

process.on("unhandledRejection", error => {
  console.error("Unhandled promise rejection:", error);
});

process.on("uncaughtException", error => {
  console.error("Uncaught exception:", error);
});

client.login(config.token).catch(error => {
  console.error("Discord login failed:", error);
  process.exit(1);
});
