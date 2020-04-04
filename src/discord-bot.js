/**
 * @author Daniel Melanson
 * @date 4/4/2020
 * @desc Source file for the singleton DiscordBot class
 */

// Modules
const Discord = require('discord.js');
const Commando = require('discord.js-commando');
const path = require('path');
const util = require('./util.js');

// Constants for embed generation
const EMBED_CONSTANTS = {
    NAME: 'University of Massachusetts Amherst College of Information and Computer Science',
    COLOR:  [131, 35, 38]
};

/**
 * Singleton class that manages command registry + execution, message filtering, and memes.
 */
class DiscordBot extends Commando.Client {
    /**
     * Creates a new DiscordBot.
     * @param config An object with fields:
     *  config.owner The user ID of the bot's owner.
     *  config.commandPrefix The prefix to all commands, optional.
     *  config.token The bot token used to communicate with the discord api
     */
    constructor(config) {
        super({
            owner: config.owner,
            commandPrefix: config.commandPrefix || '!',
            nonCommandEditable: false
        });

        // Register new groups to categorize the commands with
        this.registry.registerGroups([
            ['admin', 'Administrative'],
            ['roles', 'Roles'],
            ['classes', 'classes'],
            ['misc', 'Miscellaneous']
        ])
            .registerDefaults() // Register default types and commands
            .registerCommandsIn(path.join(__dirname, 'commands')); // Register new commands

        // Set up binds to emitted events from super class
        this.on('ready', this.ready.bind(this));
        this.on('roleUpdate', this.roleUpdate.bind(this));

        this.login(config.token);
    }

    /**
     * Generates a new embed object
     * @param options
     * @returns {object}
     */
    generateEmbed(options) {
        let embed = new Discord.MessageEmbed({
            createdAt: options.createdAt,
            description: options.description,
            fields: options.fields,
            image: options.image,
            title: options.title,
            timestamp: new Date()
        });

        if (options.author)
            embed.setAuthor(options.author.name, options.author.iconURL, options.author.url);
        else
            embed.setAuthor(this.user.username, this.user.avatarURL());

        embed.setColor(options.hexColor || EMBED_CONSTANTS.COLOR);

        return {embed: embed};
    }

    /**
     * Called when a role in the discord server is updated
     * @param {Role} oldRole
     * @param {Role} newRole
     */
    async roleUpdate(oldRole, newRole) {
        if (util.hasExploitable(newRole.permissions) && util.isAssignable(newRole.name)) {
            let success = await util.resetPermissions(newRole);

            let channel = newRole.guild.channels.find(c => c.name === "admin" && c.type === "text");
            if (channel)
                await channel.send(`@everyone The ${newRole.name} has been updated and it ${success ? 'had' : 'has'} an exploitable feature.`);
        }
    }

    /**
     * Called when the bot first establishes a connection with the discord api and is ready to work.
     * @returns {Promise<void>}
     */
    async ready() {
        console.log(`Logged in as ${this.user.tag}`);
    }

    /**
     * Logs out, terminates the connection to Discord, and destroys the client.
     */
    destroy() {
        console.log(`Logging out of ${this.user.tag}`);
        return super.destroy();
    }
}

module.exports = DiscordBot;
