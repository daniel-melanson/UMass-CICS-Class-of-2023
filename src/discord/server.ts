import {
  ApplicationCommand,
  ApplicationCommandData,
  ApplicationCommandPermissions,
  Client,
  Guild,
  GuildMember,
  Intents,
  Interaction,
  Message,
  MessageEmbed,
  MessageOptions,
  TextChannel,
} from "discord.js";

import { error, log, warn } from "#shared/logger";
import { oneLine } from "#shared/stringUtil";

import { importCommands } from "./commands/index";
import { createRoleEmbed } from "./commands/roles/roles";

import { CONTACT_MESSAGE } from "./constants";
import { isAssignable } from "./roles";

import { CommandPermissionLevel } from "./classes/SlashCommandBuilder";
import { MessageEmbedBuilder } from "./classes/MessageEmbedBuilder";

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

const DISCORD_TOKEN = process.env["DISCORD_TOKEN"]!;
const DISCORD_GUILD_ID = process.env["DISCORD_GUILD_ID"]!;
const DISCORD_OWNER_ID = process.env["DISCORD_GUILD_ID"]!;

if (!DISCORD_TOKEN) {
  error("MAIN", "Environment variable 'DISCORD_TOKEN' was not defined.");
}

if (!DISCORD_GUILD_ID) {
  error("MAIN", "Environment variable 'DISCORD_GUILD_ID' was not defined.");
}

if (!DISCORD_OWNER_ID) {
  error("MAIN", "Environment variable 'DISCORD_OWNER_ID' was not defined.");
}


const guildCommands = new Map<string, BuiltCommand>();
async function interactionCreate(interaction: Interaction) {
  if (!interaction.isCommand()) return;

  const command = guildCommands.get(interaction.commandId);
  if (!command) {
    interaction.reply("Unexpected error occurred. No command found." + CONTACT_MESSAGE);
  } else {
    try {
      await command.fn(interaction);
    } catch (e) {
      if (e instanceof CommandError) {
        interaction.reply(e.message);
      } else {
        warn("COMMAND", "Uncaught error.", e);
      }
    }
  }
}

function findChannel(guild: Guild, name: string) {
  const nameRegExp = new RegExp(`^\\W{0,2}${name}\\W{0,2}$`);
  return guild.channels.cache.find(
    x => x.type.startsWith("GUILD") && !!x.name.match(nameRegExp),
  ) as BaseGuildTextChannel;
}

async function guildMemberAdd(member: GuildMember) {
  if (member.guild.id !== DISCORD_GUILD_ID) return;

  const id = member.id;

  await member.setNickname("~ real name please");
  await announce(
    "bot-log",
    new MessageEmbedBuilder({
      description: oneLine(`<@${member.user.id}> has joined.
						Their account was created on ${member.user.createdAt.toLocaleDateString()}`),
    }).setUser(member.user),
  );

  setTimeout(async () => {
    let updated;
    try {
      updated = await member.guild.members.fetch({ user: id, force: true });
    } catch (e) {
      return;
    }

    if (updated.nickname !== "real name please" && updated.roles.cache.size > 1) return;

    const get = (name: string) => {
      const channel = findChannel(member.guild, `how-to-${name}`);
      if (!channel) return "";

      return `<#${channel.id}>`;
    };

    await announce("bot-commands", {
      content: `Hey there, <@${member.id}>! It seems like you don't have any roles. Make sure to update your nickname if you have not already.`,
      embeds: [
        new MessageEmbedBuilder({
          title: `Welcome to the Server!`,
          fields: [
            {
              name: "Getting Familiar With The Server",
              value: oneLine(`If you are unfamiliar with the server,
										make sure to read the how-to channels (${get("roles")}, ${get("notifications")})`),
            },
          ],
        }),
      ],
    });
    announce("bot-commands", createRoleEmbed(updated.guild));
  }, 1000 * 60);

  setTimeout(async () => {
    let updated;
    try {
      updated = await member.guild.members.fetch({ user: id, force: true });
    } catch (e) {
      return;
    }

    if (updated.nickname === "~ real name please") {
      announce(
        "bot-commands",
        oneLine(`<@${member.id}> you still have not updated your nickname.
						Here are some steps if you are lost: 
						(**Desktop**) Click on \`UMass CICS Community\`
						in bold in the top left of your screen.
						Press \`Change Nickname\`, enter your identifier, and \`Save\`.`) +
          `\n\n` +
          oneLine(`(**Mobile**) Swipe to the right to display your sever list.
						Press the three vertically aligned dots next to \`UMass CICS Community\`.
						Press \`Change Nickname\`, enter your identifier, and \`Save\`.`),
      );
    }
  }, 1000 * 60 * 5);
}

export async function announce(
  name: "general" | "university" | "bot-log" | "bot-commands" | "cics-events",
  message: string | MessageEmbed | MessageOptions,
): Promise<Message> {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const guild = await client.guilds.fetch(process.env["DISCORD_GUILD_ID"]!);
  const channel = findChannel(guild, name);

  if (channel) {
    return channel.send(message instanceof MessageEmbed ? { embeds: [message] } : message);
  } else {
    throw new Error("Unable to find channel " + name);
  }
}

export function initialize(): Promise<Client<true>> {
  return new Promise((res, rej) => {
    client
      .on("ready", async client => {
        log("MAIN", `Logged in as ${client.user.tag}.`);
        log("MAIN", "Initalizing application commands...");

        try {
          log("MAIN", "Building commands...");
          const guild = await client.guilds.fetch(DISCORD_GUILD_ID);

          if (process.env["DISCORD_CLEAR_PERMISSIONS"]) {
            const guildRoleCollection = await guild.roles.fetch();
            for (const [, role] of guildRoleCollection) {
              if (isAssignable(role.name)) {
                await role.setPermissions(0n);
              }
            }
          }

          const commandBuilderMap = await importCommands();

          const commandBuilderArray = Array.from(commandBuilderMap.values());
          const applicationCommandCollection = await guild.commands.set(
            commandBuilderArray.map(builder => builder.toJSON() as unknown as ApplicationCommandData),
          );
          log("MAIN", `Built ${applicationCommandCollection.size} commands.`);

          log("MAIN", `Setting up permissions...`);
          const applicationCommandMap = new Map<string, ApplicationCommand>();
          for (const [, appCmd] of applicationCommandCollection) {
            applicationCommandMap.set(appCmd.name, appCmd);
          }

          const ownerPermission: ApplicationCommandPermissions = {
            id: DISCORD_OWNER_ID,
            type: "USER",
            permission: true,
          };

          const roles = await guild.roles.fetch();
          const createRolePermission = (name: string) => {
            const role = roles.find(r => r.name === name);
            if (!role) throw new Error("Unable to find role " + name);

            return {
              id: role.id,
              type: "ROLE",
              permission: true,
            } as ApplicationCommandPermissions;
          };

          const adminPermission = createRolePermission(CommandPermissionLevel.Administrator);
          const moderatorPermission = createRolePermission(CommandPermissionLevel.Moderator);

          for (const [, builder] of commandBuilderMap) {
            const appCmd = applicationCommandMap.get(builder.name)!;

            if (builder.permissionLevel !== CommandPermissionLevel.Member) {
              const permissionArray = [ownerPermission];

              switch (builder.permissionLevel) {
                case CommandPermissionLevel.Moderator:
                  permissionArray.push(moderatorPermission);
                // eslint-disable-next-line no-fallthrough
                case CommandPermissionLevel.Administrator:
                  permissionArray.push(adminPermission);
              }

              await appCmd.permissions.add({
                permissions: permissionArray,
              });
            }

            guildCommands.set(appCmd.id, {
              embed: new MessageEmbedBuilder({
                title: `The ${builder.name} command`,
                description: builder.details,
                fields:
                  builder.examples.length > 0
                    ? [
                        {
                          name: "Examples",
                          value: builder.examples.map(e => "`" + e + "`").join(", "),
                        },
                      ]
                    : undefined,
              }),
              fn: builder.callback,
            });
          }
          log("MAIN", `Permissions set up.`);

          client.on("interactionCreate", interactionCreate);
          client.on("guildMemberAdd", guildMemberAdd);

          log("MAIN", "Application commands initialized. Ready for interaction.");
          res(client);
        } catch (e) {
          rej(e);
        }
      })
      .login(DISCORD_TOKEN);
  });
}
