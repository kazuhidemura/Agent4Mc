const Vec3 = require("vec3");
const {save, load } = require('./save.js');
const {lookingUp, lookingDown, lookingRight, lookingLeft} = require('./move.js');
const {ScanBlocksInRange, listTaggedBlockList, replaceTaggedBlocks ,CalculateDirection} = require('./search.js');
let {TaggedBlockList ,MobsList} = require('./sharedData.js');
const AdvancedRLBot = require('./test.js');

function move_commands(cmd, username, bot) {
  let rlBot = new AdvancedRLBot(bot);
  const args = cmd.split(" ");
  const command = args[0];
  const param = args[1];
  const param_2 = args[2];
  const param_3 = args[3];
  if (command === "search") {
    bot.chat("観測");
    ScanBlocksInRange(-40, 40, -60, 60, 10, bot);
    console.log(typeof loadedBlockData)
  } else if (command === "replace") {
    // 指定したブロックで置換
    if (param === null) {
      console.log(args);
      bot.chat("使用方法: replace [block_name] [{T/F}空気を含むか含まないか]");
    } else {
      replaceTaggedBlocks(param, (param_2 === "true" || param_2 === "false") ? param_2 : false ,(param_3 === "true" || param_3 === "false") ? param_3 : false , bot); // 実際のブロックを置換
      bot.chat(`TaggedBlockList 内のブロックをすべて '${param}' に置き換えました。`);
    }
  }else if (command === "debug") {
    listTaggedBlockList();
  } else if (command == "move") {
    bot.setControlState('forward', true);
  } else if (command == "stop") {
    bot.setControlState('forward', false);
  }else if (command == "save") {
    if (param === null) {
      console.log(args);
      bot.chat("使用方法: save [file name]");
    } else {
      save(param)
      bot.chat(`ブロックデータを'${param}'にセーブしました。 `);
    }
  }else if (command == "load") {
    if (!param) {
      bot.chat("使用方法: load [file name] [-r/-u/-a]");
      return;
    }

    const loadedData = load(param ,bot); // データをロード
    const loadedBlockData = loadedData.blocks

    if (loadedData.length === 0) {
      bot.chat(`データが空または '${param}' は存在しません。`);
      return;
    }
    if (param_2 === "-r") { // 上書き
      bot.chat(`ブロックデータを '${param}' からロードし、上書きしました。`);
      TaggedBlockList = loadedBlockData;
    } else if (param_2 === "-u") { // 更新（重複するものは上書き）
      loadedBlockData.forEach(newBlock => {
        const index = TaggedBlockList.findIndex(existingBlock =>
          existingBlock.x === newBlock.x &&
          existingBlock.y === newBlock.y &&
          existingBlock.z === newBlock.z
        );
        if (index !== -1) {
          TaggedBlockList[index] = newBlock; // 更新
        } else {
          TaggedBlockList.push(newBlock); // 新規追加
        }
      });
      bot.chat(`ブロックデータを '${param}' からロードし、更新しました。`);
    } else if (param_2 === "-a") { // 追加（重複を無視）
      loadedBlockData.forEach(newBlock => {
        const exists = TaggedBlockList.some(existingBlock =>
          existingBlock.x === newBlock.x &&
          existingBlock.y === newBlock.y &&
          existingBlock.z === newBlock.z
        );
        if (!exists) {
          TaggedBlockList.push(newBlock); // 新規追加（重複無視）
        }
      });
      bot.chat(`ブロックデータを '${param}' からロードし、追加しました（重複無視）。`);
    } else if (param_2 === "-help"){
      bot.chat("使用方法: load [file name] [-r/-u/-a/-help]");
      bot.chat("-r : 上書き");
      bot.chat("-u : 更新");
      bot.chat("-r : 追加");
    } else {
      bot.chat("使用方法: load [file name] [-r/-u/-a/-help]");
    }
  }else if (command == "tpme"){
    // bot.chat(`/tp '${bot.username}' '${username}'`);
    bot.chat(`/tp ${bot.username} ${username}`)
  }else if (command == "test"){
    rlBot.setStartPosition(bot.entity.position);
    rlBot.setTargetPosition(bot.players[username].entity.position);
    rlBot.train();
  }else if (command == "test2"){
    rlBot.saveQTable("qtable.json");
  }else if (command == "test3"){
    rlBot.loadQTable("qtable.json");
  }else {
    return true;
  }
}

module.exports = { move_commands };