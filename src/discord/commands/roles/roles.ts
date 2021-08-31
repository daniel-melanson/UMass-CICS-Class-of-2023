import { formatEmbed } from "../../formatting";
import {
  isAssignable,
  isConcentration,
  isCSClass,
  isGraduationStatus,
  isHobby,
  isInterdisciplinary,
  isMathClass,
  isMisc,
  isPronoun,
  isResidential,
} from "../../roles";
import { SlashCommandBuilder } from "../../builders/SlashCommandBuilder";
import { oneLine } from "../../../shared/stringUtil";

export default new SlashCommandBuilder()
  .setName("roles")
  .setDescription("Lists out roles assignable with /role command.")
  .setCallback(interaction => {
    const guild = interaction.guild!;
    const guildRoleManager = guild.roles;
    const assignableNames = guildRoleManager.cache.map(role => role.name).filter(name => isAssignable(name));

    const list = (fn: (str: string) => boolean) => {
      return assignableNames
        .filter(name => fn(name))
        .sort()
        .join(", ");
    };

    return interaction.reply({
      embeds: [
        formatEmbed({
          title: "Obtain and Remove Roles",
          description:
            oneLine(`We have a [website](https://discord.ltseng.me) where you can obtain and remove roles to access different features on this server. 
      You will need to sign in with your Discord account. If you want to quickly manage you roles you may use \`/role\` slash command:
      \`/role (add|remove|try) role:<role-name>\` command. Example: \`/role get role: @CS 121\`
      `),
          fields: [
            {
              name: "Pronouns",
              value: list(isPronoun),
            },
            {
              name: "Concentration",
              value: list(isConcentration),
            },
            {
              name: "Graduating Class or Graduation Status",
              value: list(isGraduationStatus),
            },
            {
              name: "Residential Areas",
              value: list(isResidential),
            },
            {
              name: "Computer Science Courses",
              value: list(isCSClass),
            },
            {
              name: "Math Courses",
              value: list(isMathClass),
            },
            {
              name: "Interdisciplinary",
              value: list(isInterdisciplinary),
            },
            {
              name: "Hobbies",
              value: list(isHobby),
            },
            {
              name: "Miscellaneous",
              value: list(isMisc),
            },
          ],
        }),
      ],
    });
  });