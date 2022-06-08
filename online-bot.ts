import { SlashCommandBuilder } from "@discordjs/builders";
import { REST } from "@discordjs/rest";
import {
  createAudioPlayer,
  createAudioResource,
  DiscordGatewayAdapterCreator,
  getVoiceConnection,
  joinVoiceChannel,
  NoSubscriberBehavior,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import { Routes } from "discord-api-types/v9";
import { CommandInteraction } from "discord.js";
import path from "path";

export enum OnlineBotCommandName {
  Join = "join",
  Leave = "leave",
  Boom = "boom",
}

export class OnlineBot {
  public env: { guildId: string; applicationId: string; publicKey: string };
  public rest: REST;
  public player = createAudioPlayer({
    behaviors: { noSubscriber: NoSubscriberBehavior.Play },
  });

  constructor() {
    const { DISCORD_TOKEN, APP_ID, PUBLIC_KEY, GUILD_ID } = process.env;
    if (!DISCORD_TOKEN || !APP_ID || !PUBLIC_KEY || !GUILD_ID) {
      throw new Error("failed to load variables from .env");
    }
    this.env = {
      guildId: GUILD_ID,
      applicationId: APP_ID,
      publicKey: PUBLIC_KEY,
    };
    this.rest = new REST().setToken(DISCORD_TOKEN);

    this.initCommands();
  }

  public async initCommands(): Promise<void> {
    const commands: SlashCommandBuilder[] = [
      new SlashCommandBuilder()
        .setName(OnlineBotCommandName.Join)
        .setDescription("its okay mamas here now"),
      new SlashCommandBuilder()
        .setName(OnlineBotCommandName.Leave)
        .setDescription("later baby"),
      new SlashCommandBuilder()
        .setName(OnlineBotCommandName.Boom)
        .setDescription("wah wahhh"),
    ];
    await this.rest.put(
      Routes.applicationGuildCommands(this.env.applicationId, this.env.guildId),
      { body: commands }
    );
  }

  public async join(interaction: CommandInteraction): Promise<void> {
    try {
      if (interaction.guild) {
        await interaction.deferReply();
        const member = interaction.guild.members.cache.get(interaction.user.id);
        const voiceChannelId = member?.voice?.channel?.id;

        if (voiceChannelId) {
          const connection = joinVoiceChannel({
            channelId: voiceChannelId,
            guildId: interaction.guild.id,
            adapterCreator: interaction.guild
              .voiceAdapterCreator as DiscordGatewayAdapterCreator,
          });
          connection.on("stateChange", (state) => {
            console.log("state change", state);
          });

          connection.on(VoiceConnectionStatus.Ready, () => {
            const subscription = connection.subscribe(this.player);
            const vineBoomResource = createAudioResource(
              path.join(__dirname, "assets/vine-boom.mp3")
            );
            const jokerResource = createAudioResource(
              path.join(__dirname, "assets/joker-pennywise.mp3")
            );
            this.player.play(jokerResource);
            setTimeout(() => this.player.play(vineBoomResource), 5000);
          });

          await interaction.editReply("time to see how i got these scars 🤡");
        } else {
          await interaction.editReply(
            "you gotta be connected to a voice channel"
          );
        }
      }
    } catch {
      await interaction.editReply("could not establish voice connection");
      console.error("could not establish voice connection");
    }
  }

  public async boom(interaction: CommandInteraction): Promise<void> {
    await interaction.deferReply();
    const vineBoomResource = createAudioResource(
      path.join(__dirname, "assets/vine-boom.mp3")
    );
    this.player.play(vineBoomResource);
    await interaction.editReply("wah wah wehhh");
  }

  public async leave(interaction: CommandInteraction): Promise<void> {
    await interaction.deferReply();
    if (!interaction.guild) {
      await interaction.reply("no guild in the interaction");
      console.error("no guild in the interaction");
      return;
    }

    const connection = getVoiceConnection(interaction.guild.id);
    connection?.destroy();
    await interaction.editReply("later baby");
  }

  public async clean(): Promise<void> {
    const connection = getVoiceConnection(this.env.guildId);
    connection?.destroy();
  }
}
