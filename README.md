# Project Skylar Applications

A production-ready Discord application bot for Project Skylar.

It uses:

- Node.js 20+
- discord.js v14
- better-sqlite3
- dotenv
- Slash commands
- Buttons
- Modals
- Embeds
- Persistent SQLite storage
- Multi-server configuration
- DM-based applications

## 1. Install Node.js

Install Node.js 20 or newer from the official Node.js website.

Check the installation:

```bash
node --version
npm --version
```

## 2. Install the project

Extract the ZIP and open a terminal inside the project folder:

```bash
npm install
```

## 3. Create the Discord application

Go to the Discord Developer Portal and create a new application.

Create a bot user and copy:

- Bot Token
- Application / Client ID

Never publish your bot token.

### Required bot intents

Enable:

- Server Members Intent
- Message Content Intent

Direct Messages are also required for the application flow.

### Recommended permissions

Invite the bot with:

- View Channels
- Send Messages
- Embed Links
- Read Message History
- Use Slash Commands

The bot also needs access to the review channel.

## 4. Configure .env

Copy `.env.example` to `.env`:

```env
TOKEN=your_bot_token
CLIENT_ID=your_client_id
GUILD_ID=your_test_server_id
```

`GUILD_ID` is optional.

If it is set, `/applications` and `/application` are deployed to that server and update quickly.

If it is empty, commands are deployed globally and can take time to propagate.

## 5. Deploy commands

Run:

```bash
npm run deploy
```

Then start the bot:

```bash
npm start
```

You should see:

```text
Logged in as YourBot#0000
Project Skylar Applications is ready.
```

## 6. Configure the review system

In your server, run:

```text
/application setup
```

Choose:

- Review channel
- Reviewer role

The reviewer role is allowed to accept or deny applications.

Administrators and members with Manage Server can also review applications.

Normal members cannot review applications.

## 7. Post the application panel

Run:

```text
/applications
```

Optionally select a channel.

The bot posts:

**Project Skylar Applications**

with buttons for every application configured in `src/applications.js`.

## 8. EXACTLY where to edit questions

Open:

```text
src/applications.js
```

At the top you will see:

```js
const APPLICATIONS = {
```

This is the main customization area.

For example:

```js
helper: {
  name: "Helper",
  buttonLabel: "Apply For Helper",
  emoji: "🛡️",
  description: "Apply to join the Project Skylar Helper team.",
  questions: [
    { id: "age", question: "What is your age?", type: "number" },
    { id: "timezone", question: "What timezone are you in?", type: "text" }
  ]
}
```

Change the question text directly:

```js
{ id: "age", question: "How old are you?", type: "number" }
```

The `id` should be unique inside that application.

## 9. Question types

### Text

```js
{
  id: "timezone",
  question: "What timezone are you in?",
  type: "text"
}
```

Any non-empty response is accepted.

### Number

```js
{
  id: "age",
  question: "What is your age?",
  type: "number"
}
```

Only valid numbers are accepted.

### Yes / No

```js
{
  id: "experience",
  question: "Have you had staff experience before?",
  type: "yesno"
}
```

The applicant can answer yes/no.

### Multiple choice

```js
{
  id: "activity",
  question: "How active are you?",
  type: "multiple",
  choices: [
    "Very active",
    "Active",
    "Occasionally active"
  ]
}
```

The applicant must type one of the listed choices.

## 10. Add another question

Add another object inside `questions`:

```js
{
  id: "favorite_game",
  question: "What is your favorite game?",
  type: "text"
}
```

Save the file and restart the bot.

## 11. Add another application type

Inside `APPLICATIONS`, add another entry:

```js
moderator: {
  name: "Moderator",
  buttonLabel: "Apply For Moderator",
  emoji: "🔨",
  description: "Apply to join the moderation team.",
  questions: [
    {
      id: "age",
      question: "What is your age?",
      type: "number"
    },
    {
      id: "experience",
      question: "Do you have moderation experience?",
      type: "yesno"
    },
    {
      id: "reason",
      question: "Why should we choose you?",
      type: "text"
    }
  ]
}
```

The bot automatically creates a new button when `/applications` is posted again.

## 12. Change the application name

Change:

```js
name: "Helper"
```

to:

```js
name: "Community Helper"
```

## 13. Change the button

Change:

```js
buttonLabel: "Apply For Helper"
```

to:

```js
buttonLabel: "Apply Now"
```

## 14. Change the emoji

Change:

```js
emoji: "🛡️"
```

to:

```js
emoji: "⭐"
```

## 15. Change the review channel / reviewer role

Do not edit the source code for this.

Run:

```text
/application setup
```

Select the new review channel and reviewer role.

The settings are stored in SQLite per server.

## 16. Staff commands

### Statistics

```text
/application stats
```

Shows pending, accepted, denied, and total applications.

### View an application

```text
/application view <id>
```

Only authorized staff can use it.

### Close an application

```text
/application close <id>
```

Optionally provide a reason.

## 17. Application flow

1. User clicks an application button.
2. The bot checks for an active application.
3. The bot attempts to DM the user.
4. Questions are sent one at a time.
5. Answers are saved in memory during the session.
6. `cancel` cancels the application.
7. When complete, the application is saved to SQLite.
8. The application is sent to the configured review channel.
9. Staff accepts or denies it.
10. The review is saved permanently.
11. The applicant receives a DM.

## 18. Database

SQLite is automatically created at:

```text
data/skylar.sqlite
```

The database stores:

- Application ID
- Guild ID
- User ID
- Application type
- Answers
- Status
- Reviewer
- Review reason
- Review message
- Review channel
- Creation time
- Review time

Statuses:

- pending
- accepted
- denied
- cancelled

Do not commit the database to Git. `.gitignore` already excludes it.

## 19. Railway hosting

Create a new Railway project and deploy this project.

Set these environment variables in Railway:

```env
TOKEN=your_bot_token
CLIENT_ID=your_client_id
```

You can optionally set:

```env
GUILD_ID=your_test_server_id
```

Railway starts the bot using:

```bash
npm start
```

### Important SQLite persistence note

SQLite is stored in:

```text
data/skylar.sqlite
```

For persistent production storage on Railway, use a persistent Railway volume mounted so that the project's `data` directory survives redeploys/restarts.

If you deploy without persistent storage, the database can be lost when the service filesystem is replaced.

## 20. Security

The bot:

- Does not hardcode the token.
- Separates applications by guild.
- Prevents multiple pending applications for a user.
- Restricts review actions to authorized staff.
- Supports Administrator and Manage Server permissions.
- Supports a configurable reviewer role.
- Validates number, yes/no, and multiple-choice answers.
- Handles disabled DMs.
- Handles Discord API errors without crashing the whole process.
- Stores review information permanently.

## 21. Project structure

```text
Project-Skylar-Applications/
├── src/
│   ├── commands/
│   │   ├── applications.js
│   │   └── application.js
│   ├── applications.js
│   ├── database.js
│   ├── config.js
│   └── index.js
├── data/
│   └── .gitkeep
├── .env.example
├── .gitignore
├── package.json
├── deploy-commands.js
└── README.md
```

## 22. Production notes

The application questions are source-code configurable, while server review configuration is stored in SQLite.

Application sessions are intentionally kept in memory while the user is answering questions. Completed applications are persistent.

If the bot itself restarts while somebody is halfway through a DM application, that in-progress session is lost. The user can simply start a new application after the restart.

Completed applications and all reviews survive restarts.

## 23. Troubleshooting

### Bot cannot DM users

Ask the applicant to enable:

**Server Settings → Privacy Settings → Direct Messages**

They can then click the application button again.

### Buttons do not work

Make sure the bot is online and that the panel was posted by the current bot instance.

### Commands are missing

Run:

```bash
npm run deploy
```

If `GUILD_ID` is set, commands should appear in that server quickly.

### Review buttons do not work

Check:

1. `/application setup` was completed.
2. The reviewer has the configured reviewer role, Administrator, or Manage Server.
3. The bot can access the review channel.

### SQLite error

Make sure the process can write to the `data` directory.

## License

Private/custom Project Skylar bot project.
