import * as fs from 'fs-extra';
import axios from 'axios';
// import ytdl from 'ytdl-core';
import play, { YouTubeVideo } from 'play-dl';
import { AudioPlayer, createAudioResource } from '@discordjs/voice';
import { CommandInteraction, MessageEmbed, MessageEmbedOptions } from 'discord.js';
import path from "path";

export async function getTTS(voice: string, text: string): Promise<string> {
  try {
    console.log(`voice: ${voice}, text: ${text}`);

    //sanitize text message
    text = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    text = text.replace(/\+/gi, "plus");
    text = text.replace(/\s+/gi, "+")
    text = text.replace(/&/gi, "and")

    const url = encodeURI(`https://api16-normal-useast5.us.tiktokv.com/media/api/text/speech/invoke/?text_speaker=${voice}&req_text=${text}&speaker_map_type=0`);
    const resp = await axios.post(url)
    let sc = resp.data?.status_code;
    if (sc == null || sc == 1) throw new Error((resp.data?.status_msg??"An unknown error has occured"));
    const buf = Buffer.from(resp.data.data.v_str, "base64");

    fs.emptyDirSync("./assets/temp");
    const filename = text.length > 15 ? `${text.substring(0, 15)}` : `${text}`;
    fs.writeFileSync(`./assets/temp/${filename}.mp3`, buf);
    return `assets/temp/${filename}.mp3`;
  } catch(e) {
    console.error(e);
    return "assets/table_broken.mp3";
  }
}


export async function getStream(searchTerm: string, interaction: CommandInteraction, player: AudioPlayer): Promise<YouTubeVideo[]> {
  const vdRepro = await play.search(searchTerm);
  if (!vdRepro) console.error("No videos found for search term");
  return vdRepro
}

export function buildEmbeddedMessage(vdRepro: YouTubeVideo[]): MessageEmbedOptions {
  return {
    author: {
      name: "Online Guys Music",
      icon_url:
        "https://i.imgur.com/YLVan9O.png",
    },
    thumbnail: {
      url: "https://i.imgur.com/YLVan9O.png"
    },
    title: vdRepro[0].title,
    description: `${vdRepro[0].description}\n[LINK](${vdRepro[0].url})`,
    color: 0x0099ff,
    image: { url: vdRepro[0].thumbnails[0].url },
  }
}

export async function playSound(sound: string, interaction: CommandInteraction, player: AudioPlayer): Promise<void> {
  await interaction.deferReply();
  const audioResource = createAudioResource(
    path.join(__dirname,`assets/${sound}.mp3`)
  );
  player.play(audioResource);
  await interaction.deleteReply();
}

