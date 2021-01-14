import { Client, Message } from "discord.js";

import { Command } from "Discord/commands/types";

export default {
	identifier: "pit",
	group: "Administrative",
	description: "Temporarily caches and removes the roles of a list of users.",
	examples: ["!pit @John @Jane @Jordan"],
	guildOnly: true,
	clientPermissions: ["MANAGE_ROLES"],
	func: async (client: Client, message: Message) => {
		throw new Error("not implemented");
	},
} as Command;