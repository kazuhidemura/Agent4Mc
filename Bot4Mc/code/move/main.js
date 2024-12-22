const Vec3 = require("vec3");
const { save, load } = require('./save.js');

function move_commands(cmd, username, bot) {
  const args = cmd.split(" ");
  const command = args[0];
  const param = args[1];
  const param_2 = args[2];
  if (command === "search") {
    bot.chat("観測");
    ScanBlocksInRange(-40, 40, -60, 60, 10, bot);
  } else if (command === "replace") {
    // 指定したブロックで置換
    if (param === null) {
      console.log(args);
      bot.chat("使用方法: replace [block_name] [{T/F}空気を含むか含まないか]");
    } else {
      replaceTaggedBlocks(param, param_2, bot); // 実際のブロックを置換
      bot.chat(`TaggedBlockList 内のブロックをすべて '${param}' に置き換えました。`);
    }
  }
  else if (command === "debug") {
    listTaggedBlockList();
  } else if (command == "test") {
    bot.chat('/setblock ~ ~ ~ stone');
  } else if (command == "move") {
    bot.setControlState('forward', true);
  } else if (command == "stop") {
    bot.setControlState('forward', false);
  }else if (command == "save") {
    if (param === null) {
      console.log(args);
      bot.chat("使用方法: save [file name]");
    } else {
      save(TaggedBlockList, param)
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
      TaggedBlockList = loadedBlockData;
      bot.chat(`ブロックデータを '${param}' からロードし、上書きしました。`);
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
    } else if (param_2 === "-a"){
      bot.chat("使用方法: load [file name] [-r/-u/-a/-help]");
      bot.chat("-r : 上書き");
      bot.chat("-u : 更新");
      bot.chat("-r : 追加");
    } else {
      bot.chat("使用方法: load [file name] [-r/-u/-a/-help]");
    }
  }else if(command == "tpme"){
    // bot.chat(`/tp '${bot.username}' '${username}'`);
    bot.chat(`/tp ${bot.username} ${username}`)
  }else {
    return true;
  }
}


function ScanBlocksInRange(yawOffsetStart, yawOffsetEnd, pitchOffsetStart, pitchOffsetEnd, maxDistance, bot) {
  const yawStep = 5; // 水平のスキャン間隔
  const pitchStep = 5; // 垂直のスキャン間隔

  const baseYaw = bot.entity.yaw * (180 / Math.PI); // 現在の視線の水平角度（度）
  const basePitch = bot.entity.pitch * (180 / Math.PI); // 現在の視線の垂直角度（度）

  for (let yawOffset = yawOffsetStart; yawOffset <= yawOffsetEnd; yawOffset += yawStep) {
    for (let pitchOffset = pitchOffsetStart; pitchOffset <= pitchOffsetEnd; pitchOffset += pitchStep) {
      const direction = CalculateDirection(baseYaw + yawOffset, basePitch + pitchOffset);

      // 位置をスキャン
      for (let i = 0; i < maxDistance; i += 0.1) { // 前に進ませて計測
        const position = bot.entity.position
          .offset(0, bot.entity.height, 0) // Botの視線の起点
          .offset(direction.x * i, direction.y * i, direction.z * i);
        const block = bot.blockAt(position);

        if (block) {
          // 新しいTaggedBlockの作成
          const TaggedBlock = {
            block: block.name,
            position: block.position,
            tag: block.name === "air" ? "空気" : "通常ブロック",
          };

          // 重複チェックと更新処理
          const index = TaggedBlockList.findIndex(tagged =>
            tagged.position.x === TaggedBlock.position.x &&
            tagged.position.y === TaggedBlock.position.y &&
            tagged.position.z === TaggedBlock.position.z
          );

          if (index === -1) {
            // 重複がない場合は追加
            TaggedBlockList.push(TaggedBlock);
            console.log(`新規追加: ${block.name} @ ${block.position} (タグ: ${TaggedBlock.tag})`);
          } else {
            // 重複がある場合は更新
            TaggedBlockList[index] = TaggedBlock;
            console.log(`更新: ${block.name} @ ${block.position} (タグ: ${TaggedBlock.tag})`);
          }

          // 空気以外のブロックを見つけたら、その方向の探索を停止
          if (block.name !== "air") {
            break;
          }
        }
      }
    }
  }
}



let TaggedBlockList = [];
function CalculateDirection(yawDegrees, pitchDegrees) {
  const yaw = yawDegrees * (Math.PI / 180);
  const pitch = pitchDegrees * (Math.PI / 180);

  const dx = -Math.sin(yaw) * Math.cos(pitch);
  const dy = -Math.sin(pitch);
  const dz = -Math.cos(yaw) * Math.cos(pitch);

  return new Vec3(dx, dy, dz);
}

function listTaggedBlockList() {
  if (TaggedBlockList.length === 0) {
    console.log('データはない！');
    return;
  }

  console.log('リスト:');
  TaggedBlockList.forEach((tagged, index) => {
    console.log(`${index + 1}: ${tagged.block} @ ${tagged.position}, タグ: ${tagged.tag}`);
  });
}

async function replaceTaggedBlocks(newBlockName ,AirTrigger ,bot) { //AirTrigger  T空気含む/F含まない
  for (const taggedBlock of TaggedBlockList) {
    const position = taggedBlock.position;

    // チャットではなく、直接パケットでコマンドを送信
    if (taggedBlock.block !== "air" || AirTrigger)
    {
      const command = `/setblock ${position.x} ${position.y} ${position.z} ${newBlockName}`;
      bot.chat(command);
      console.log(`送信したコマンド: ${command}`);
    }

    // コマンド送信間隔を調整（スパム防止のため）
    // await new Promise(resolve => setTimeout(resolve, 500)); // 0.5秒待機
  }
}
module.exports = { move_commands };