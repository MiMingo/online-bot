import { Client, Intents } from "discord.js";
import "dotenv/config";
import { OnlineBot, OnlineBotCommandName } from "./online-bot";

try {
  const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES],
  });
  let bot: OnlineBot;

  client.once("ready", () => {
    console.log("🤡");
    bot = new OnlineBot();
  });

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;
    if (interaction.commandName === OnlineBotCommandName.Join) {
      await bot.join(interaction);
    } else if (interaction.commandName === OnlineBotCommandName.Leave) {
      await bot.leave(interaction);
    } else if (interaction.commandName === OnlineBotCommandName.Boom) {
      await bot.boom(interaction);
    } else if (interaction.commandName === OnlineBotCommandName.Smooch) {
      await bot.smooch(interaction);
    } else if (interaction.commandName === OnlineBotCommandName.Wenomechainsama) {
      await bot.wenomechainsama(interaction);
    } else if (interaction.commandName === OnlineBotCommandName.Wifenlooof) {
      await bot.wifenlooof(interaction);
    } else if (interaction.commandName === OnlineBotCommandName.Chikenmcnuget) {
      await bot.chikenmcnuget(interaction);
    } else if (interaction.commandName === OnlineBotCommandName.Boop) {
      await bot.boop(interaction);
    } else if (interaction.commandName === OnlineBotCommandName.Shang) {
      await bot.shang(interaction);
    } else if (interaction.commandName === OnlineBotCommandName.Celtics) {
      await bot.celtics(interaction);
    } else if (interaction.commandName === OnlineBotCommandName.TiktokTTS) {
      await bot.tts(interaction);
    } else if (interaction.commandName === OnlineBotCommandName.Play) {
      await bot.play(interaction);
    } else if (interaction.commandName === OnlineBotCommandName.Stop) {
      await bot.stop(interaction);
    }
  });

  client.login(process.env.DISCORD_TOKEN);
  process.on("exit", async () => {
    await cleanup();
  });
  process.on("SIGINT", async () => {
    await cleanup();
  });

  async function cleanup(): Promise<void> {
    await bot.clean();
    console.log("Bye now! 👋");
    process.exit();
  }
} catch (e) {
  console.error(e);
}
