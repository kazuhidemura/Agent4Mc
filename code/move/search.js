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
                    global.TaggedBlockList_.find(tagged => 
                      tagged.position.x === block.position.x &&
                      tagged.position.y === block.position.y + 1 &&
                      tagged.position.z === block.position.z
                    ),
                    global.TaggedBlockList_.find(tagged => 
                      tagged.position.x === block.position.x &&
                      tagged.position.y === block.position.y + 2 &&
                      tagged.position.z === block.position.z
                    ),
                  ];
                  // 上2つのブロックがすべてisPassableBlockType === trueであるかを判定
                  return upperBlocks.every(upperBlock => upperBlock && upperBlock.isPassableBlockType);
                })(),
                chunk: {
                  x: Math.floor(block.position.x / 16),
                  z: Math.floor(block.position.z / 16)
                }
              };            
  
            // 重複チェックと更新処理
            const index = global.TaggedBlockList_.findIndex(tagged =>
              tagged.position.x === TaggedBlock.position.x &&
              tagged.position.y === TaggedBlock.position.y &&
              tagged.position.z === TaggedBlock.position.z
            );
  
            if (index === -1) {
              // 重複がない場合は追加
              global.TaggedBlockList_.push(TaggedBlock);
              console.log(`新規追加: ${block.name} @ ${block.position} (タグ: ${TaggedBlock.tag})`);
            } else {
              // 重複がある場合は更新
              global.TaggedBlockList_[index] = TaggedBlock;
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
    if (global.TaggedBlockList_.length === 0) {
      console.log('データはない！');
      return;
    }
  
    console.log('リスト:');
    global.TaggedBlockList_.forEach((tagged, index) => {
      console.log(`${index + 1}: ${tagged.block} @ ${tagged.position}, タグ: ${tagged.tag}`);
    });
  }
  
  async function replaceTaggedBlocks(newBlockName ,AirTrigger ,isPassablePlaceTrigger ,bot) { //AirTrigger  T空気含む/F含まない //isPassablePlaceTrigger T isPassablePlaceがtrueの時/Fそうでない時
    for (const taggedBlock of global.TaggedBlockList_) {
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

  function addBlocksToTaggedBlockList(x1, y1, z1, x2, y2, z2, bot) {
    console.log("ブロックの取得開始");
    if (!global.TaggedBlockList_) {
        global.TaggedBlockList_ = [];
    }

    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    const minZ = Math.min(z1, z2);
    const maxZ = Math.max(z1, z2);

    for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
            for (let z = minZ; z <= maxZ; z++) {
                const position = new Vec3(x, y, z);
                const block = bot.blockAt(position);

                if (block) {
                    const TaggedBlock = {
                        block: block.name,
                        position: position,
                        tag: block.name === "air" ? "空気" : "通常ブロック",
                        isPassableBlockType: block.name === "air",
                        isPassablePlace: (() => {
                            const upperBlocks = [
                                global.TaggedBlockList_.find(tagged =>
                                    tagged.position.x === x &&
                                    tagged.position.y === y + 1 &&
                                    tagged.position.z === z
                                ),
                                global.TaggedBlockList_.find(tagged =>
                                    tagged.position.x === x &&
                                    tagged.position.y === y + 2 &&
                                    tagged.position.z === z
                                ),
                            ];
                            return upperBlocks.every(upperBlock => upperBlock && upperBlock.isPassableBlockType);
                        })(),
                        chunk: {
                            x: Math.floor(x / 16),
                            z: Math.floor(z / 16)
                        }
                    };

                    // 重複チェックと更新
                    const index = global.TaggedBlockList_.findIndex(tagged =>
                        tagged.position.x === x &&
                        tagged.position.y === y &&
                        tagged.position.z === z
                    );

                    if (index === -1) {
                        global.TaggedBlockList_.push(TaggedBlock);
                        // console.log(`新規追加: ${block.name} @ ${position} (タグ: ${TaggedBlock.tag})`);
                    } else {
                        global.TaggedBlockList_[index] = TaggedBlock;
                        // console.log(`更新: ${block.name} @ ${position} (タグ: ${TaggedBlock.tag})`);
                    }
                }
            }
        }
    }
    console.log("ブロックの取得終了");
}
function setPassablePlaceForBlocks(blockList) {
  console.log("ブロックの再チェック開始");
  return blockList.map(block => {
      // (x, y+1, z) または (x, y+2, z) に `isPassableBlockType: true` のブロックがあるかチェック
      const blockAbove1 = global.TaggedBlockList_.find(tagged =>
          tagged.position.x === block.position.x &&
          tagged.position.y === block.position.y + 1 &&
          tagged.position.z === block.position.z
      );

      const blockAbove2 = global.TaggedBlockList_.find(tagged =>
          tagged.position.x === block.position.x &&
          tagged.position.y === block.position.y + 2 &&
          tagged.position.z === block.position.z
      );

      const isPassable = (blockAbove1?.isPassableBlockType || blockAbove2?.isPassableBlockType) === true;
      // `isPassablePlace` を設定した新しいオブジェクトを返す
      return {
          ...block, // 元のブロック情報をコピー
          isPassablePlace: isPassable
      };
  });
}

module.exports = { ScanBlocksInRange, listTaggedBlockList, replaceTaggedBlocks ,CalculateDirection, addBlocksToTaggedBlockList, setPassablePlaceForBlocks};
