const mineflayer = require("mineflayer");
const Vec3 = require("vec3");
// import mineflayer from 'mineflayer';
// import vec3 from 'vec3';

//他のファイルへの！
// import { commands } from './command-hub.mjs';
const { commands } = require('./command-hub.js');

// Botの設定
const bot = mineflayer.createBot({
    host: 'localhost',
    // host: '192.168.10.11',
    port: 2025,
    username: "Top_of_the_noob",
    version: false,
});

bot.on("login", () => {
    console.log("Bot joined");
});

bot.on("chat", (username, message) => {
    if (message.startsWith('!')) {
        const cmd = message.slice(1);
        if(commands(cmd, username, bot) === undefined){
            console.log(`Not found the command: ${cmd}`);
            bot.chat(`残念なことに以下のコマンドは見つからないね: ${cmd}`);
        }
    }
});

bot.on("error", (err) => {
    console.log(`ERROR: ${err.message}`);
});

bot.on("end", () => {
    console.log("Bot left the game");
});

bot.on("kicked", (reason) => {
    console.log(`Bot was kicked. Reason: ${JSON.stringify(reason, null, 2)}`);
});