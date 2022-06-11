import { SlashCommandBuilder } from "@discordjs/builders";
import { REST } from "@discordjs/rest";
import {
  createAudioPlayer,
  createAudioResource,
  DiscordGatewayAdapterCreator,
  getVoiceConnection,
  joinVoiceChannel,
  NoSubscriberBehavior,
  StreamType,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import { ConnectionVisibility } from "discord-api-types/v10";
import { Routes, APIApplicationCommandOptionChoice } from "discord-api-types/v9";
import { CommandInteraction } from "discord.js";
import path from "path";
import _voices from "./voices.json";
const voices: APIApplicationCommandOptionChoice<string>[] = _voices;


import { getTTS, getStream, buildEmbeddedMessage, playSound } from "./streamHelpers";
// import ytdl from 'ytdl-core';
import play from 'play-dl';

export enum OnlineBotCommandName {
  Join = "join",
  Leave = "leave",
  Boom = "boom",
  Smooch = "smooch",
  Wenomechainsama = "wenomechainsama",
  Wifenlooof = "wifenlooof",
  Chikenmcnuget = "chikenmcnuget",
  Shang = "shang",
  Celtics = "celtics",
  Boop = "boop",
  TiktokTTS = "tts",
  Play = "play",
  Stop = "stop",
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
    
    const commands: (SlashCommandBuilder | Omit<SlashCommandBuilder, string>)[] = [
      new SlashCommandBuilder()
        .setName(OnlineBotCommandName.Join)
        .setDescription("its okay mamas here now"),
      new SlashCommandBuilder()
        .setName(OnlineBotCommandName.Leave)
        .setDescription("later baby"),
      new SlashCommandBuilder()
        .setName(OnlineBotCommandName.Boom)
        .setDescription("wah wahhh"),
      new SlashCommandBuilder()
        .setName(OnlineBotCommandName.Smooch)
        .setDescription("smooch"),
      new SlashCommandBuilder()
        .setName(OnlineBotCommandName.Wenomechainsama)
        .setDescription("wenomechainsama"),
      new SlashCommandBuilder()
        .setName(OnlineBotCommandName.Wifenlooof)
        .setDescription("wifenlooof"),
      new SlashCommandBuilder()
        .setName(OnlineBotCommandName.Chikenmcnuget)
        .setDescription("chikenmcnuget"),
      new SlashCommandBuilder()
        .setName(OnlineBotCommandName.Boop)
        .setDescription("discord boop"),
      new SlashCommandBuilder()
        .setName(OnlineBotCommandName.Shang)
        .setDescription("shang abi"),
      new SlashCommandBuilder()
        .setName(OnlineBotCommandName.Celtics)
        .setDescription("celtics are the bawls"),
      new SlashCommandBuilder()
        .setName(OnlineBotCommandName.TiktokTTS)
        .setDescription("Tiktok TTS")
        .addStringOption(option => 
          option.setName("text")
          .setDescription("The text to translate")
          .setRequired(true))
        .addStringOption(option => 
          option.setName("voice")
          .setDescription("The voice used to translate the text")
          .setChoices(
            ...voices
          )),
      new SlashCommandBuilder()
        .setName(OnlineBotCommandName.Play)
        .setDescription("playing")
        .addStringOption(option => 
          option.setName("search")
          .setDescription("Video search")
          .setRequired(true))
        .addNumberOption(option => 
            option.setName("volume")
            .setDescription("set volume of audio [0-100]")),
      new SlashCommandBuilder()
        .setName(OnlineBotCommandName.Stop)
        .setDescription("stop bot from playing audio"),
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
          connection.playOpusPacket

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

  public async stop(interaction: CommandInteraction): Promise<void> {
    await interaction.deferReply();
    this.player.stop();
    await interaction.deleteReply();
  }

  public async play(interaction: CommandInteraction): Promise<void> {
    try {
      await interaction.deferReply();
      const searchTerm = await interaction.options.getString('search');
      const volume = await interaction.options.getNumber('volume');

      if (searchTerm == null) throw new Error("searchTerm is null");
      if (volume != null && (volume > 100 || volume < 0)) {
        throw new Error(`${interaction.user.username} entered bad volume option: ${volume}`);
      }

      // search for videos
      const vdRepro = await play.search(searchTerm);
      if (!vdRepro) console.error("No videos found for search term");
      
      // get video stream and play
      var stream = await play.stream(vdRepro[0].url);
      const streamResource = await createAudioResource(stream.stream, { inputType: stream.type, inlineVolume: true });
      if (volume != null) {
        streamResource.volume?.setVolume(volume/100);
      }
      this.player.play(streamResource);
      const embed = buildEmbeddedMessage(vdRepro);
      await interaction.editReply({ embeds: [embed] });
    } catch (e) {
      console.error(e);
      playSound("broken", interaction, this.player);
    }
  }

  public async tts(interaction: CommandInteraction): Promise<void> {
    try {
      await interaction.deferReply();
      const text = await interaction.options.getString('text');
      let voice = await interaction.options.getString('voice');
      voice = voice === null ? "en_us_001" : voice;
      
      if (text == null) throw new Error("text is null");
      
      const filename = await getTTS(voice, text);
      const ttsResource = createAudioResource(filename);
      this.player.play(ttsResource);
    } catch (e) {
      console.error(e);
    } finally {
      await interaction.deleteReply();
    }
  }

  public async celtics(interaction: CommandInteraction): Promise<void> {
    await playSound("celtics", interaction, this.player);
  }

  public async shang(interaction: CommandInteraction): Promise<void> {
    await playSound("shang-abi", interaction, this.player);
  }

  public async boop(interaction: CommandInteraction): Promise<void> {
    await playSound("discord", interaction, this.player);
  }

  public async chikenmcnuget(interaction: CommandInteraction): Promise<void> {
    await playSound("chikenmcnuget", interaction, this.player);
  }
  
  public async smooch(interaction: CommandInteraction): Promise<void> {
    await playSound("smooch", interaction, this.player);
  }

  public async wenomechainsama(interaction: CommandInteraction): Promise<void> {
    await playSound("wenomechainsama", interaction, this.player);
  }

  public async wifenlooof(interaction: CommandInteraction): Promise<void> {
    await playSound("wifenlooof", interaction, this.player);
  }

  public async boom(interaction: CommandInteraction): Promise<void> {
    await playSound("vine-boom", interaction, this.player);
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
