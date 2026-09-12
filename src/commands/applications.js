const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require("discord.js");

const { APPLICATIONS } = require("../applications");
const { getConfig } = require("../database");

/*
============================================================
PROJECT SKYLAR APPLICATION PANEL
============================================================

Change these values to customize the application embed.
*/

const PANEL_CONFIG = {
  // Main embed title
  title: "Project Skylar | Applications",

  // Main embed description
  description:
    "Interested in joining the **Project Skylar** team?\n\n" +
    "Choose an application below to get started. " +
    "Your application will be completed privately through **DMs**.\n\n" +
    "Please answer every question honestly and provide accurate information.",

  // Embed color
  color: 0x5865F2,

  // Footer text
  footer: "Project Skylar • Applications",

  /*
  ----------------------------------------------------------
  BANNER IMAGE
  ----------------------------------------------------------

  Put a direct image URL between the quotation marks.

  Example:
  imageUrl: "https://example.com/skylar-banner.png"

  Leave it empty if you don't want an image.
  */
  imageUrl: "https://cdn.discordapp.com/attachments/1548310759224901783/1548310836488179802/Project_Skylar.png?ex=6aa69855&is=6aa546d5&hm=521525db239a0a068483c91cc70d21fd9a576cb0387429fe30768cec6b2fe6f4&",

  /*
  ----------------------------------------------------------
  THUMBNAIL
  ----------------------------------------------------------

  Optional small image in the top-right of the embed.

  Leave empty if you don't want one.
  */
  thumbnailUrl: "https://cdn.discordapp.com/attachments/1548310759224901783/1548310975743008879/Untitled_design_5-removebg-preview.png?ex=6aa69876&is=6aa546f6&hm=de14ec2168d10868b49da7b56839b472195dc7a84b541fdd7a460967dcfa210a&"
};


/*
============================================================
BUILD APPLICATION PANEL
============================================================
*/

function buildPanel() {
  const embed = new EmbedBuilder()
    .setTitle(PANEL_CONFIG.title)
    .setDescription(PANEL_CONFIG.description)
    .setColor(PANEL_CONFIG.color)
    .setFooter({
      text: PANEL_CONFIG.footer
    })
    .setTimestamp();


  /*
  ----------------------------------------------------------
  BANNER IMAGE
  ----------------------------------------------------------
  */

  if (PANEL_CONFIG.imageUrl) {
    embed.setImage(PANEL_CONFIG.imageUrl);
  }


  /*
  ----------------------------------------------------------
  THUMBNAIL
  ----------------------------------------------------------
  */

  if (PANEL_CONFIG.thumbnailUrl) {
    embed.setThumbnail(PANEL_CONFIG.thumbnailUrl);
  }


  /*
  ----------------------------------------------------------
  APPLICATION INFORMATION
  ----------------------------------------------------------

  Automatically displays every application configured
  inside src/applications.js.
  */

  const applicationFields = Object.entries(APPLICATIONS).map(
    ([key, app]) => ({
      name: `${app.emoji} ${app.name}`,
      value: app.description || "No description provided.",
      inline: true
    })
  );

  if (applicationFields.length > 0) {
    embed.addFields(applicationFields);
  }


  /*
  ----------------------------------------------------------
  APPLICATION BUTTONS
  ----------------------------------------------------------
  */

  const buttons = Object.entries(APPLICATIONS).map(
    ([key, app]) =>
      new ButtonBuilder()
        .setCustomId(`apply:${key}`)
        .setLabel(app.buttonLabel)
        .setEmoji(app.emoji)
        .setStyle(ButtonStyle.Primary)
  );


  /*
  ----------------------------------------------------------
  DISCORD ONLY ALLOWS 5 BUTTONS PER ROW
  ----------------------------------------------------------
  */

  const rows = [];

  for (let i = 0; i < buttons.length; i += 5) {
    rows.push(
      new ActionRowBuilder().addComponents(
        buttons.slice(i, i + 5)
      )
    );
  }


  return {
    embeds: [embed],
    components: rows
  };
}


/*
============================================================
SLASH COMMAND
============================================================
*/

module.exports = {
  data: new SlashCommandBuilder()
    .setName("applications")
    .setDescription("Post the Project Skylar application panel.")
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageGuild
    )
    .addChannelOption(option =>
      option
        .setName("channel")
        .setDescription(
          "Channel where the application panel should be posted."
        )
        .setRequired(false)
    ),


  /*
  ==========================================================
  EXECUTE
  ==========================================================
  */

  async execute(interaction) {
    const channel =
      interaction.options.getChannel("channel") ||
      interaction.channel;

    /*
    ----------------------------------------------------------
    CHECK CONFIGURATION
    ----------------------------------------------------------
    */

    const config = getConfig(interaction.guildId);

    if (!config?.review_channel_id) {
      return interaction.reply({
        content:
          "⚠️ Applications are not configured yet. Use `/application setup` first.",
        ephemeral: true
      });
    }


    /*
    ----------------------------------------------------------
    POST PANEL
    ----------------------------------------------------------
    */

    try {
      await channel.send(buildPanel());

      await interaction.reply({
        content:
          `✅ Application panel posted successfully in ${channel}.`,
        ephemeral: true
      });

    } catch (error) {
      console.error(
        "Failed to post application panel:",
        error
      );

      await interaction.reply({
        content:
          "❌ I could not post the application panel. Please check my permissions in that channel.",
        ephemeral: true
      });
    }
  }
};