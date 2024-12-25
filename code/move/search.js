let {TaggedBlockList ,MobsList} = require('./sharedData.js');
const Vec3 = require("vec3");


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
                isPassableBlockType: block.name === "air" ? true : false,
                isPassablePlace: (() => {
                  // 上にある2つのブロックを取得
                  const upperBlocks = [
                    TaggedBlockList.find(tagged => 
                      tagged.position.x === block.position.x &&
                      tagged.position.y === block.position.y + 1 &&
                      tagged.position.z === block.position.z
                    ),
                    TaggedBlockList.find(tagged => 
                      tagged.position.x === block.position.x &&
                      tagged.position.y === block.position.y + 2 &&
                      tagged.position.z === block.position.z
                    ),
                  ];
              
                  // 上2つのブロックがすべてisPassableBlockType === trueであるかを判定
                  return upperBlocks.every(upperBlock => upperBlock && upperBlock.isPassableBlockType);
                })(),
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
  
  async function replaceTaggedBlocks(newBlockName ,AirTrigger ,isPassablePlaceTrigger ,bot) { //AirTrigger  T空気含む/F含まない //isPassablePlaceTrigger T isPassablePlaceがtrueの時/Fそうでない時
    for (const taggedBlock of TaggedBlockList) {
      const position = taggedBlock.position;
  
      // チャットではなく、直接パケットでコマンドを送信
      if (taggedBlock.block !== "air" || AirTrigger)
      {
        if(taggedBlock.isPassablePlace === true || !isPassablePlaceTrigger)
        {
            const command = `/setblock ${position.x} ${position.y} ${position.z} ${newBlockName}`;
            bot.chat(command);
            console.log(`送信したコマンド: ${command}`);
        }
      }
      // コマンド送信間隔を調整（スパム防止のため）
      // await new Promise(resolve => setTimeout(resolve, 500)); // 0.5秒待機
    }
    console.log(`.w.: ${AirTrigger}${isPassablePlaceTrigger}`);

  }
module.exports = { ScanBlocksInRange, listTaggedBlockList, replaceTaggedBlocks ,CalculateDirection};
