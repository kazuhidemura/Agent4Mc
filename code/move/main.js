const Vec3 = require("vec3");
const {save, load } = require('./save.js');
const {findPath, splitedLayerPathFinder, findPath_3} = require('./path.js');
const {lookingUp, lookingDown, lookingRight, lookingLeft} = require('./move.js');
const {ScanBlocksInRange, listTaggedBlockList, replaceTaggedBlocks ,CalculateDirection, addBlocksToTaggedBlockList, setPassablePlaceForBlocks, countSurfaceArea, countComplexity} = require('./search.js');
// const AdvancedRLBot = require('./test.js');

let durationTimeList = [];
let Complexity;
let stepC;

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
  }else if (command == "VEcount"){
    const goal = { x:param, y:param_2, z:param_3};
    const data = {}; // 必要に応じたデータ
    const blocks = global.TaggedBlockList_;
    const timeout = 30000; // 30秒
    const path = findPath_3(goal, data, blocks, timeout, bot);
    console.log(path);
  }else if (command == "path"){
    const goal = { x:param, y:param_2, z:param_3};
    const data = {}; // 必要に応じたデータ
    const blocks = global.TaggedBlockList_;
    const timeout = 30000; // 30秒
    const path = findPath(goal, data, blocks, timeout, bot);
    console.log(path);
  }else if (command == "path_"){
    process.stdout.write('\u001Bc\u001B[3J');
    if(durationTimeList.length >= 150)
    {
      bot.chat("durationTimeListがあるため、リセットを推奨します。");
      console.log(JSON.stringify(durationTimeList));
    }else{
      const goal = { x:param, y:param_2, z:param_3};
      const data = {}; // 必要に応じたデータ
      const blocks = global.TaggedBlockList_;
      const timeout = 30000; // 30秒
      const startTime_ = Date.now();
      const path = findPath(goal, data, blocks, timeout, bot);
      const durationTime = Date.now() - startTime_;
      durationTimeList.push(durationTime);
      console.log(durationTimeList);
      if(durationTimeList.length === 150){
        console.log("-------DONE-------");
        console.log(durationTimeList);
      }else{
        bot.chat(`/execute as Aotumuri run say !${cmd}`);
      }
      console.log(path);
    }
  }else if (command == "path2"){
    const blocks = global.TaggedBlockList_;
    Complexity = countComplexity(blocks);
    // console.log("Complexity:",Complexity*Complexity*Complexity);
    stepC = Math.round(Complexity*Complexity*Complexity);
    if(stepC <= 0)
    {
        stepC = 1;
    }
    const goal = { x:param, y:param_2, z:param_3};
    const data = {}; // 必要に応じたデータ
    const timeout = 30000; // 30秒
    const result = splitedLayerPathFinder(goal, data, blocks, timeout, stepC, bot);
    const path = result[0];
    const durationTime = result[1];
    console.log(path);
  }else if (command == "path2_"){
    process.stdout.write('\u001Bc\u001B[3J');
    if(durationTimeList.length >= 150)
    {
      bot.chat("durationTimeListがあるため、リセットを推奨します。");
      console.log(JSON.stringify(durationTimeList));
    }else{
      const goal = { x:param, y:param_2, z:param_3};
      const data = {}; // 必要に応じたデータ
      const blocks = global.TaggedBlockList_;
      const timeout = 30000; // 30秒
      const startTime_ = Date.now();
      const result = splitedLayerPathFinder(goal, data, blocks, timeout, stepC, bot);
      const durationTime = Date.now() - startTime_;
      const path = result[0];
      // const durationTime = result[1];
      durationTimeList.push(durationTime);
      console.log(durationTimeList);
      if(durationTimeList.length === 150){
        console.log("-------DONE-------");
        console.log(durationTimeList);
      }else{
        bot.chat(`/execute as Aotumuri run say !${cmd}`);
      }
    }
  }else if(command == "sPP"){
    global.TaggedBlockList_ = setPassablePlaceForBlocks(global.TaggedBlockList_);
  }else if(command == "cSA"){
    countSurfaceArea(global.TaggedBlockList_);
  }else if(command == "cc"){
    countComplexity(global.TaggedBlockList_);
  }else if(command == "cmdPack"){
    bot.chat("実験用のワールドでのみ正常に機能します。")
    console.log(param);
    if(param === '0'){
      bot.chat("cmdPack: 0 :: フラット")
      if(param_2 === '0'){
        bot.chat("/tp -30 103 1");
        bot.chat('/execute as Aotumuri run say !get -49 102 1 -11 117 39');
        bot.chat('/execute as Aotumuri run say !sPP');
        bot.chat('/execute as Aotumuri run say !cc');
      }else if(param_2 === '1'){
        bot.chat("/tp Aotumuri -30 150 19 0 90");
      }else if(param_2 === '2'){
        bot.chat('/execute as Aotumuri run say !path -30 103 39');
      }else if(param_2 === '3'){
        bot.chat('/execute as Aotumuri run say !path2 -30 103 39');
      }else if(param_2 === '2_'){
        bot.chat('/execute as Aotumuri run say !path_ -30 103 39');
      }else if(param_2 === '3_'){
        bot.chat('/execute as Aotumuri run say !path2_ -30 103 39');
      }else{
        bot.chat('その番号は存在しません');
      }
    }else if(param === '1'){
      bot.chat("cmdPack: 1 :: ちょっとした高低差")
      if(param_2 === '0'){
        bot.chat("/tp 20 103 1");
        bot.chat('/execute as Aotumuri run say !get 1 102 1 39 117 39');
        bot.chat('/execute as Aotumuri run say !sPP');
        bot.chat('/execute as Aotumuri run say !cc');
      }else if(param_2 === '1'){
        bot.chat("/tp Aotumuri 20 150 19 0 90");
      }else if(param_2 === '2'){
        bot.chat('/execute as Aotumuri run say !path 20 103 39');
      }else if(param_2 === '3'){
        bot.chat('/execute as Aotumuri run say !path2 20 103 39');
      }else if(param_2 === '2_'){
        bot.chat('/execute as Aotumuri run say !path_ 20 103 39');
      }else if(param_2 === '3_'){
        bot.chat('/execute as Aotumuri run say !path2_ 20 103 39');
      }else{
        bot.chat('その番号は存在しません');
      }
    }else if(param === '2'){
      bot.chat("cmdPack: 2 :: すこしの高低差")
      if(param_2 === '0'){
        bot.chat("/tp 70 103 1");
        bot.chat('/execute as Aotumuri run say !get 51 102 1 89 117 39');
        bot.chat('/execute as Aotumuri run say !sPP');
        bot.chat('/execute as Aotumuri run say !cc');
      }else if(param_2 === '1'){
        bot.chat("/tp Aotumuri 70 150 19 0 90");
      }else if(param_2 === '2'){
        bot.chat('/execute as Aotumuri run say !path 70 103 39');
      }else if(param_2 === '3'){
        bot.chat('/execute as Aotumuri run say !path2 70 103 39');
      }else if(param_2 === '2_'){
        bot.chat('/execute as Aotumuri run say !path_ 70 103 39');
      }else if(param_2 === '3_'){
        bot.chat('/execute as Aotumuri run say !path2_ 70 103 39');
      }else{
        bot.chat('その番号は存在しません');
      }
    }else if(param === '3'){
      bot.chat("cmdPack: 3 :: すこしの高低差")
      if(param_2 === '0'){
        bot.chat("/tp 101 103 1");
        bot.chat('/execute as Aotumuri run say !get 101 102 1 139 117 39');
        bot.chat('/execute as Aotumuri run say !sPP');
        bot.chat('/execute as Aotumuri run say !cc');
      }else if(param_2 === '1'){
        bot.chat("/tp Aotumuri 120 150 19 0 90");
      }else if(param_2 === '2'){
        bot.chat('/execute as Aotumuri run say !path 139 110 39');
      }else if(param_2 === '3'){
        bot.chat('/execute as Aotumuri run say !path2 139 110 39');
      }else if(param_2 === '2_'){
        bot.chat('/execute as Aotumuri run say !path_ 139 110 39');
      }else if(param_2 === '3_'){
        bot.chat('/execute as Aotumuri run say !path2_ 139 110 39');
      }else{
        bot.chat('その番号は存在しません');
      }
    }else if(param === '4'){
      bot.chat("cmdPack: 4 :: ノイズ")
      if(param_2 === '0'){
        bot.chat("/tp 101 106 51");
        bot.chat('/execute as Aotumuri run say !get 101 102 51 139 117 89');
        bot.chat('/execute as Aotumuri run say !sPP');
        bot.chat('/execute as Aotumuri run say !cc');
      }else if(param_2 === '1'){
        bot.chat("/tp Aotumuri 120 150 69 0 90");
      }else if(param_2 === '2'){
        bot.chat('/execute as Aotumuri run say !path 139 107 89');
      }else if(param_2 === '3'){
        bot.chat('/execute as Aotumuri run say !path2 139 107 89');
      }else if(param_2 === '2_'){
        bot.chat('/execute as Aotumuri run say !path_ 139 107 89');
      }else if(param_2 === '3_'){
        bot.chat('/execute as Aotumuri run say !path2_ 139 107 89');
      }else{
        bot.chat('その番号は存在しません');
      }
    }else if(param === '5'){
      bot.chat("cmdPack: 5 :: ノイズ")
      if(param_2 === '0'){
        bot.chat("/tp 51 103 51");
        bot.chat('/execute as Aotumuri run say !get 51 102 51 89 117 89');
        bot.chat('/execute as Aotumuri run say !sPP');
        bot.chat('/execute as Aotumuri run say !cc');
      }else if(param_2 === '1'){
        bot.chat("/tp Aotumuri 70 150 69 0 90");
      }else if(param_2 === '2'){
        bot.chat('/execute as Aotumuri run say !path 89 103 89');
      }else if(param_2 === '3'){
        bot.chat('/execute as Aotumuri run say !path2 89 103 89');
      }else if(param_2 === '2_'){
        bot.chat('/execute as Aotumuri run say !path_ 89 103 89');
      }else if(param_2 === '3_'){
        bot.chat('/execute as Aotumuri run say !path2_ 89 103 89');
      }else{
        bot.chat('その番号は存在しません');
      }
    }else if(param === '6'){
      bot.chat("cmdPack: 6 :: ノイズ")
      if(param_2 === '0'){
        bot.chat("/tp 1 104 51");
        bot.chat('/execute as Aotumuri run say !get 1 102 51 39 117 89');
        bot.chat('/execute as Aotumuri run say !sPP');
        bot.chat('/execute as Aotumuri run say !cc');
      }else if(param_2 === '1'){
        bot.chat("/tp Aotumuri 20 150 69 0 90");
      }else if(param_2 === '2'){
        bot.chat('/execute as Aotumuri run say !path 39 103 89');
      }else if(param_2 === '3'){
        bot.chat('/execute as Aotumuri run say !path2 39 103 89');
      }else if(param_2 === '2_'){
        bot.chat('/execute as Aotumuri run say !path_ 39 103 89');
      }else if(param_2 === '3_'){
        bot.chat('/execute as Aotumuri run say !path2_ 39 103 89');
      }else{
        bot.chat('その番号は存在しません');
      }
    }else if(param === '7'){
      bot.chat("cmdPack: 7 :: ノイズ")
      if(param_2 === '0'){
        bot.chat("/tp 1 104 101");
        bot.chat('/execute as Aotumuri run say !get 1 102 101 39 117 139');
        bot.chat('/execute as Aotumuri run say !sPP');
        bot.chat('/execute as Aotumuri run say !cc');
      }else if(param_2 === '1'){
        bot.chat("/tp Aotumuri 20 150 119 0 90");
      }else if(param_2 === '2'){
        bot.chat('/execute as Aotumuri run say !path 39 104 139');
      }else if(param_2 === '3'){
        bot.chat('/execute as Aotumuri run say !path2 39 104 139');
      }else if(param_2 === '2_'){
        bot.chat('/execute as Aotumuri run say !path_ 39 104 139');
      }else if(param_2 === '3_'){
        bot.chat('/execute as Aotumuri run say !path2_ 39 104 139');
      }else{
        bot.chat('その番号は存在しません');
      }
    }else if(param === '8'){
      bot.chat("cmdPack: 8 :: 階層")
      if(param_2 === '0'){
        bot.chat("/tp 70 104 101");
        bot.chat('/execute as Aotumuri run say !get 51 102 101 89 117 139');
        bot.chat('/execute as Aotumuri run say !sPP');
        bot.chat('/execute as Aotumuri run say !cc');
      }else if(param_2 === '1'){
        bot.chat("/tp Aotumuri 70 150 119 0 90");
      }else if(param_2 === '2'){
        bot.chat('/execute as Aotumuri run say !path 70 112 101');
      }else if(param_2 === '3'){
        bot.chat('/execute as Aotumuri run say !path2 70 112 101');
      }else if(param_2 === '2_'){
        bot.chat('/execute as Aotumuri run say !path_ 70 112 101');
      }else if(param_2 === '3_'){
        bot.chat('/execute as Aotumuri run say !path2_ 70 112 101');
      }else{
        bot.chat('その番号は存在しません');
      }
    }else if(param === '9'){
      bot.chat("cmdPack: 9 :: 塔")
      if(param_2 === '0'){
        bot.chat("/tp 108 103 102");
        bot.chat('/execute as Aotumuri run say !get 101 102 101 139 117 139');
        bot.chat('/execute as Aotumuri run say !sPP');
        bot.chat('/execute as Aotumuri run say !cc');
      }else if(param_2 === '1'){
        bot.chat("/tp Aotumuri 120 150 119 0 90");
      }else if(param_2 === '2'){
        bot.chat('/execute as Aotumuri run say !path 115 104 115');
      }else if(param_2 === '3'){
        bot.chat('/execute as Aotumuri run say !path2 115 104 115');
      }else if(param_2 === '2_'){
        bot.chat('/execute as Aotumuri run say !path_ 115 104 115');
      }else if(param_2 === '3_'){
        bot.chat('/execute as Aotumuri run say !path2_ 115 104 115');
      }else{
        bot.chat('その番号は存在しません');
      }
    }else if(param === '10'){
      bot.chat("cmdPack: 10 :: 3D迷路")
      if(param_2 === '0'){
        bot.chat("/tp 120 103 151");
        bot.chat('/execute as Aotumuri run say !get 101 102 151 139 117 189');
        bot.chat('/execute as Aotumuri run say !sPP');
        bot.chat('/execute as Aotumuri run say !cc');
      }else if(param_2 === '1'){
        bot.chat("/tp Aotumuri 120 150 169 0 90");
      }else if(param_2 === '2'){
        bot.chat('/execute as Aotumuri run say !path 120 114 189');
      }else if(param_2 === '3'){
        bot.chat('/execute as Aotumuri run say !path2 120 114 189');
      }else if(param_2 === '2_'){
        bot.chat('/execute as Aotumuri run say !path_ 120 114 189');
      }else if(param_2 === '3_'){
        bot.chat('/execute as Aotumuri run say !path2_ 120 114 189');
      }else{
        bot.chat('その番号は存在しません');
      }
    }else if(param === '11'){
      bot.chat("cmdPack: 11 :: 3D迷路")
      if(param_2 === '0'){
        bot.chat("/tp 70 103 151");
        bot.chat('/execute as Aotumuri run say !get 51 102 151 89 117 189');
        bot.chat('/execute as Aotumuri run say !sPP');
        bot.chat('/execute as Aotumuri run say !cc');
      }else if(param_2 === '1'){
        bot.chat("/tp Aotumuri 70 150 169 0 90");
      }else if(param_2 === '2'){
        bot.chat('/execute as Aotumuri run say !path 70 114 189');
      }else if(param_2 === '3'){
        bot.chat('/execute as Aotumuri run say !path2 70 114 189');
      }else if(param_2 === '2_'){
        bot.chat('/execute as Aotumuri run say !path_ 70 114 189');
      }else if(param_2 === '3_'){
        bot.chat('/execute as Aotumuri run say !path2_ 70 114 189');
      }else{
        bot.chat('その番号は存在しません');
      }
    }else if(param === '12'){
      bot.chat("cmdPack: 12 :: 3D迷路")
      if(param_2 === '0'){
        bot.chat("/tp 20 103 151");
        bot.chat('/execute as Aotumuri run say !get 1 102 151 39 117 189');
        bot.chat('/execute as Aotumuri run say !sPP');
        bot.chat('/execute as Aotumuri run say !cc');
      }else if(param_2 === '1'){
        bot.chat("/tp Aotumuri 20 150 169 0 90");
      }else if(param_2 === '2'){
        bot.chat('/execute as Aotumuri run say !path 20 114 189');
      }else if(param_2 === '3'){
        bot.chat('/execute as Aotumuri run say !path2 20 114 189');
      }else if(param_2 === '2_'){
        bot.chat('/execute as Aotumuri run say !path_ 20 114 189');
      }else if(param_2 === '3_'){
        bot.chat('/execute as Aotumuri run say !path2_ 20 114 189');
      }else{
        bot.chat('その番号は存在しません');
      }
    }else if(param === '13'){
      bot.chat("cmdPack: 13 :: ノイズ")
      let pathgoal = "-11 103 89"
      if(param_2 === '0'){
        bot.chat("/tp -49 103 51");
        bot.chat('/execute as Aotumuri run say !get -49 102 51 -11 117 89');
        bot.chat('/execute as Aotumuri run say !sPP');
        bot.chat('/execute as Aotumuri run say !cc');
      }else if(param_2 === '1'){
        bot.chat("/tp Aotumuri -30 150 69 0 90");
      }else if(param_2 === '2'){
        bot.chat(`/execute as Aotumuri run say !path ${pathgoal}`);
      }else if(param_2 === '3'){
        bot.chat(`/execute as Aotumuri run say !path2 ${pathgoal}`);
      }else if(param_2 === '2_'){
        bot.chat(`/execute as Aotumuri run say !path_ ${pathgoal}`);
      }else if(param_2 === '3_'){
        bot.chat(`/execute as Aotumuri run say !path2_ ${pathgoal}`);
      }else{
        bot.chat('その番号は存在しません');
      }
    }else if(param === '14'){
      bot.chat("cmdPack: 14 :: ノイズ")
      let pathgoal = "-61 103 89"
      if(param_2 === '0'){
        bot.chat("/tp -99 103 51");
        bot.chat('/execute as Aotumuri run say !get -99 102 51 -61 117 89');
        bot.chat('/execute as Aotumuri run say !sPP');
        bot.chat('/execute as Aotumuri run say !cc');
      }else if(param_2 === '1'){
        bot.chat("/tp Aotumuri -80 150 69 0 90");
      }else if(param_2 === '2'){
        bot.chat(`/execute as Aotumuri run say !path ${pathgoal}`);
      }else if(param_2 === '3'){
        bot.chat(`/execute as Aotumuri run say !path2 ${pathgoal}`);
      }else if(param_2 === '2_'){
        bot.chat(`/execute as Aotumuri run say !path_ ${pathgoal}`);
      }else if(param_2 === '3_'){
        bot.chat(`/execute as Aotumuri run say !path2_ ${pathgoal}`);
      }else{
        bot.chat('その番号は存在しません');
      }
    }else if(param === '15'){
      bot.chat("cmdPack: 15 :: ノイズ")
      let pathgoal = "-111 103 89"
      if(param_2 === '0'){
        bot.chat("/tp -149 103 51");
        bot.chat('/execute as Aotumuri run say !get -149 102 51 -111 117 89');
        bot.chat('/execute as Aotumuri run say !sPP');
        bot.chat('/execute as Aotumuri run say !cc');
      }else if(param_2 === '1'){
        bot.chat("/tp Aotumuri -130 150 69 0 90");
      }else if(param_2 === '2'){
        bot.chat(`/execute as Aotumuri run say !path ${pathgoal}`);
      }else if(param_2 === '3'){
        bot.chat(`/execute as Aotumuri run say !path2 ${pathgoal}`);
      }else if(param_2 === '2_'){
        bot.chat(`/execute as Aotumuri run say !path_ ${pathgoal}`);
      }else if(param_2 === '3_'){
        bot.chat(`/execute as Aotumuri run say !path2_ ${pathgoal}`);
      }else{
        bot.chat('その番号は存在しません');
      }
    }else if(param === '16'){
      bot.chat("cmdPack: 16 :: ノイズ")
      let pathgoal = "-161 103 89"
      if(param_2 === '0'){
        bot.chat("/tp -199 103 51");
        bot.chat('/execute as Aotumuri run say !get -199 102 51 -161 117 89');
        bot.chat('/execute as Aotumuri run say !sPP');
        bot.chat('/execute as Aotumuri run say !cc');
      }else if(param_2 === '1'){
        bot.chat("/tp Aotumuri -180 150 69 0 90");
      }else if(param_2 === '2'){
        bot.chat(`/execute as Aotumuri run say !path ${pathgoal}`);
      }else if(param_2 === '3'){
        bot.chat(`/execute as Aotumuri run say !path2 ${pathgoal}`);
      }else if(param_2 === '2_'){
        bot.chat(`/execute as Aotumuri run say !path_ ${pathgoal}`);
      }else if(param_2 === '3_'){
        bot.chat(`/execute as Aotumuri run say !path2_ ${pathgoal}`);
      }else{
        bot.chat('その番号は存在しません');
      }
    }else if(param === '17'){
      bot.chat("cmdPack: 17 :: ノイズ")
      let pathgoal = "-211 103 89"
      if(param_2 === '0'){
        bot.chat("/tp -249 103 51");
        bot.chat('/execute as Aotumuri run say !get -249 102 51 -211 117 89');
        bot.chat('/execute as Aotumuri run say !sPP');
        bot.chat('/execute as Aotumuri run say !cc');
      }else if(param_2 === '1'){
        bot.chat("/tp Aotumuri -230 150 69 0 90");
      }else if(param_2 === '2'){
        bot.chat(`/execute as Aotumuri run say !path ${pathgoal}`);
      }else if(param_2 === '3'){
        bot.chat(`/execute as Aotumuri run say !path2 ${pathgoal}`);
      }else if(param_2 === '2_'){
        bot.chat(`/execute as Aotumuri run say !path_ ${pathgoal}`);
      }else if(param_2 === '3_'){
        bot.chat(`/execute as Aotumuri run say !path2_ ${pathgoal}`);
      }else{
        bot.chat('その番号は存在しません');
      }
    }else if(param === '18'){
      bot.chat("cmdPack: 18 :: ノイズ")
      let pathgoal = "-261 103 89"
      if(param_2 === '0'){
        bot.chat("/tp -299 103 51");
        bot.chat('/execute as Aotumuri run say !get -299 102 51 -261 117 89');
        bot.chat('/execute as Aotumuri run say !sPP');
        bot.chat('/execute as Aotumuri run say !cc');
      }else if(param_2 === '1'){
        bot.chat("/tp Aotumuri -280 150 69 0 90");
      }else if(param_2 === '2'){
        bot.chat(`/execute as Aotumuri run say !path ${pathgoal}`);
      }else if(param_2 === '3'){
        bot.chat(`/execute as Aotumuri run say !path2 ${pathgoal}`);
      }else if(param_2 === '2_'){
        bot.chat(`/execute as Aotumuri run say !path_ ${pathgoal}`);
      }else if(param_2 === '3_'){
        bot.chat(`/execute as Aotumuri run say !path2_ ${pathgoal}`);
      }else{
        bot.chat('その番号は存在しません');
      }
    }else if(param === '19'){
      bot.chat("cmdPack: 19 :: ノイズ")
      let pathgoal = "-11 103 139"
      if(param_2 === '0'){
        bot.chat("/tp -49 103 101");
        bot.chat('/execute as Aotumuri run say !get -49 102 101 -11 117 139');
        bot.chat('/execute as Aotumuri run say !sPP');
        bot.chat('/execute as Aotumuri run say !cc');
      }else if(param_2 === '1'){
        bot.chat("/tp Aotumuri -30 150 109 0 90");
      }else if(param_2 === '2'){
        bot.chat(`/execute as Aotumuri run say !path ${pathgoal}`);
      }else if(param_2 === '3'){
        bot.chat(`/execute as Aotumuri run say !path2 ${pathgoal}`);
      }else if(param_2 === '2_'){
        bot.chat(`/execute as Aotumuri run say !path_ ${pathgoal}`);
      }else if(param_2 === '3_'){
        bot.chat(`/execute as Aotumuri run say !path2_ ${pathgoal}`);
      }else{
        bot.chat('その番号は存在しません');
      }
    }else{
      bot.chat('その番号は存在しません');
    }
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
    bot.chat('/execute as Aotumuri run say !get 48 83 -154 86 98 -116');
    bot.chat('/execute as Aotumuri run say !sPP');
    bot.chat('/execute as Aotumuri run say !path2 65 85 -141');    
  }else if (command == "test6_2"){
    bot.chat('/execute as Aotumuri run say !get 48 83 -154 86 98 -116');
    bot.chat('/execute as Aotumuri run say !sPP');
    bot.chat('/execute as Aotumuri run say !path 65 85 -141');    
  }else {
    return true;
  }
}

module.exports = { move_commands };