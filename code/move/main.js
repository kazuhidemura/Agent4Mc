const Vec3 = require("vec3");
const {save, load } = require('./save.js');
const {findPath, splitedLayerPathFinder} = require('./path.js');
const {lookingUp, lookingDown, lookingRight, lookingLeft} = require('./move.js');
const {ScanBlocksInRange, listTaggedBlockList, replaceTaggedBlocks ,CalculateDirection, addBlocksToTaggedBlockList, setPassablePlaceForBlocks} = require('./search.js');
// const AdvancedRLBot = require('./test.js');

function move_commands(cmd, username, bot) {
  // let rlBot = new AdvancedRLBot(bot);
  const args = cmd.split(" ");
  const command = args[0];
  const param = args[1];
  const param_2 = args[2];
  const param_3 = args[3];
  const param_4 = args[4];
  const param_5 = args[5];
  const param_6 = args[6];
  if (command === "search") {
    bot.chat("観測");
    ScanBlocksInRange(-60, 60, -40, 40, 20, bot);
    console.log(typeof global.TaggedBlockList_)
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
      global.TaggedBlockList_ = loadedBlockData;
    } else if (param_2 === "-u") { // 更新（重複するものは上書き）
      loadedBlockData.forEach(newBlock => {
        const index = global.TaggedBlockList_.findIndex(existingBlock =>
          existingBlock.x === newBlock.x &&
          existingBlock.y === newBlock.y &&
          existingBlock.z === newBlock.z
        );
        if (index !== -1) {
          global.TaggedBlockList_[index] = newBlock; // 更新
        } else {
          global.TaggedBlockList_.push(newBlock); // 新規追加
        }
      });
      bot.chat(`ブロックデータを '${param}' からロードし、更新しました。`);
    } else if (param_2 === "-a") { // 追加（重複を無視）
      loadedBlockData.forEach(newBlock => {
        const exists = global.TaggedBlockList_.some(existingBlock =>
          existingBlock.x === newBlock.x &&
          existingBlock.y === newBlock.y &&
          existingBlock.z === newBlock.z
        );
        if (!exists) {
          global.TaggedBlockList_.push(newBlock); // 新規追加（重複無視）
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
  }else if (command == "get"){
    addBlocksToTaggedBlockList(param, param_2, param_3, param_4, param_5, param_6, bot)
  }else if (command == "path"){
    const goal = { x:param, y:param_2, z:param_3};
    const data = {}; // 必要に応じたデータ
    const blocks = global.TaggedBlockList_;
    const timeout = 30000; // 30秒
    const path = findPath(goal, data, blocks, timeout, bot);
    console.log(path);
  }else if (command == "path2"){
    const goal = { x:param, y:param_2, z:param_3};
    const data = {}; // 必要に応じたデータ
    const blocks = global.TaggedBlockList_;
    const timeout = 30000; // 30秒
    const path = splitedLayerPathFinder(goal, data, blocks, timeout, bot);
    console.log(path);
  }else if(command == "sPP")
  {
    global.TaggedBlockList_ = setPassablePlaceForBlocks(global.TaggedBlockList_);
  }else if (command == "test"){
    for (const key in global.TaggedBlockList_) {
      if (global.TaggedBlockList_.hasOwnProperty(key)) {
        console.log(`${key}: ${JSON.stringify(global.TaggedBlockList_[key])}`);//これはラーメンを美味しくするlog
      }
    }
    // rlBot.setStartPosition(bot.entity.position);
    // rlBot.setTargetPosition(bot.players[username].entity.position);
    // rlBot.train();
  }else if (command == "test2"){
    // rlBot.saveQTable("qtable.json");
    console.log(bot.entity.position)
  }else if (command == "test3"){
    bot.chat('/execute as Aotumuri run say !get 88 82 -194 119 90 -172');
    bot.chat('/execute as Aotumuri run say !path 108 83 -189');    
  }else if (command == "test4"){
    bot.chat('/execute as Aotumuri run say !get 48 82 -157 89 98 -116');
    bot.chat('/execute as Aotumuri run say !path 67 84 -117');    
  }else if (command == "test5"){
    bot.chat('/execute as Aotumuri run say !get 48 82 -157 89 88 -116');
    bot.chat('/execute as Aotumuri run say !path 67 84 -117');    
  }else if (command == "test6"){
    bot.chat('/execute as Aotumuri run say !get 48 82 -157 89 98 -116');
    bot.chat('/execute as Aotumuri run say !sPP')
    bot.chat('/execute as Aotumuri run say !path2 65 85 -141');    
  }else {
    return true;
  }
}

module.exports = { move_commands };