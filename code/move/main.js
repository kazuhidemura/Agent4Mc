const Vec3 = require("vec3");
function move_commands(cmd, username, bot) {
  const args = cmd.split(" ");
  const command = args[0];
  const param = args[1];
  if (command === "search") {
    bot.chat("観測");
    ScanBlocksInRange(-60, 60, -30, 30, 10, bot);
  } else if (command === "replace") {
    // 指定したブロックで置換
    if (param === null) {
      console.log(args);
      bot.chat("使用方法: replace [block_name]");
    } else {
      replaceTaggedBlocks(param, bot); // 実際のブロックを置換
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
  }
  else {
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
      const block = Ray(direction, maxDistance, bot);
      if (block && block.name !== "air") {
        console.log(`見つけたブロック: ${block.name} @ ${block.position}`);
        let TaggedBlock = {
          block: block.name,
          position: block.position,
          tag: "順位？",
        };
        TaggedBlockList.push(TaggedBlock);
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

function Ray(direction, maxDistance, bot) {
  const start = bot.entity.position.offset(0, bot.entity.height, 0);//Botの支線開始位置

  for (let i = 0; i < maxDistance; i += 0.1) { // 前に進ませて計測！
    const position = start.offset(direction.x * i, direction.y * i, direction.z * i);
    const block = bot.blockAt(position);

    if (block && block.name !== "air") {
      return block;
    }
  }

  return null;
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

async function replaceTaggedBlocks(newBlockName, bot) {
  for (const taggedBlock of TaggedBlockList) {
    const position = taggedBlock.position;

    // チャットではなく、直接パケットでコマンドを送信
    const command = `/setblock ${position.x} ${position.y} ${position.z} ${newBlockName}`;
    bot.chat(command);
    console.log(`送信したコマンド: ${command}`);

    // コマンド送信間隔を調整（スパム防止のため）
    // await new Promise(resolve => setTimeout(resolve, 500)); // 0.5秒待機
  }
}
module.exports = { move_commands };