import { warn } from "../../../shared/logger";
import { SlashCommandBuilder } from "../../builders/SlashCommandBuilder";
import { isClass } from "../../roles";
import { CommandError } from "../CommandError";

export default new SlashCommandBuilder()
  .setName("reset-classes")
  .setDescription("Remove all your course related roles.")
  .setGroup("Roles")
  .setDetails("")
  .addExamples(["/reset-classes"])
  .setCallback(async interaction => {
    const guild = interaction.guild!;
    const guildMember = await guild.members.fetch(interaction.user.id);
    const userRoleManager = guildMember.roles;
    const roleCollection = userRoleManager.cache.mapValues(role => {
      return { id: role.id, name: role.name };
    });

    const courseRoleCollection = roleCollection.filter(role => isClass(role.name));

    if (courseRoleCollection.size <= 0) {
      return interaction.reply("You do not have any course related roles to remove.");
    }

    try {
      await userRoleManager.set(roleCollection.difference(courseRoleCollection).map(role => role.id));
    } catch (e) {
      warn("COMMAND", "role command unable to update permissions for " + interaction.user.id, e);
      throw new CommandError("I'm sorry, I encountered an error while trying to update your roles.");
    }

    return interaction.reply(
      `You no longer have the following ${courseRoleCollection.size > 1 ? "roles" : "role"}: ${courseRoleCollection
        .map(role => role.name)
        .join(", ")}`,
    );
  });