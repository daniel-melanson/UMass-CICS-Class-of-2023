# UMass CICS Community Bot

Simple discord bot for the UMass CICS Community server written in TypeScript.

## Notable Features
- Command to search for UMass CICS staff members.
- Various commands to query computer science related courses and filter by subject, level, prerequisites, etc.
- Daily reminders of events happening in the college, scraped directly from the website.
- Reminders for academic calender events, such as when finals start, or when there is a recess. 

## To-Do
- COVID Dashboard updates
- Image creation and manipulation?

## Contributing

### Where do I start?
1. [Fork the repository](hhttps://github.com/daniel-melanson/umass-cics-community-bot/fork)
2. Clone your fork: `git clone https://github.com/your-username/umass-cics-community-bot.git`
3. Create a branch with your edits: `git checkout -b feature-name`
4. Commit your changes: `git commit -am 'My features description'`
5. Push the changes: `git push origin feature-name`
6. Submit a pull request

### Local Testing
1. Create a new discord server (guild).
2. [Create and invite a bot to the server](https://github.com/jagrosh/MusicBot/wiki/Adding-Your-Bot-To-Your-Server).
3. Create a `.env` file in the following format: 
```
DISCORD_OWNER_ID=your-discord-id
DISCORD_GUILD_ID=your-discord-guilds-id
DISCORD_TOKEN=the-token-of-your-bot

MONGO_CONNECTION_STRING=you-will-be-given-this
```
4. Run `npm start`

Keep in mind that database related commands will fail if `MONGO_CONNECTION_STRING` is not defined in your `.env` file. If you would like to contribute you can contact me and I will give you a temporary connection string to the database.

## Credits
This bot uses [discord.js](https://github.com/discordjs/discord.js) to communicate with the discord API.
