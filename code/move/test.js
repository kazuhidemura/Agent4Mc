// const Vec3 = require("vec3");
// const { save, load } = require('./save.js');
// const { lookingUp, lookingDown, lookingRight, lookingLeft } = require('./move.js');
// let { TaggedBlockList } = require('./sharedData.js');
// const { ScanBlocksInRange, listTaggedBlockList, replaceTaggedBlocks ,CalculateDirection} = require('./search.js');


// class AdvancedRLBot {
//   constructor(bot) {
//     this.bot = bot;
//     this.qTable = {}; // 状態-行動の価値を格納するQテーブル
//     this.learningRate = 0.1; // 学習率
//     this.discountFactor = 0.9; // 割引率
//     this.targetPosition = null;
//     this.startPosition = null;
//     this.previousTaggedBlockCount = 0; // 前回のTaggedBlockListの長さ
//     this.timeout = 10000; // タイムアウト時間（ms）
//     this.actionCounter = 0;
//   }

//   setStartPosition(position) {
//     this.startPosition = position;
//     console.log(`スタート地点を設定: ${position}`);
//   }

//   setTargetPosition(position) {
//     this.targetPosition = position;
//     console.log(`目的地を設定: ${position}`);
//   }

//   getState() {
//     const position = this.bot.entity.position;
//     return `${Math.floor(position.x)}_${Math.floor(position.y)}_${Math.floor(position.z)}`;
//   }

//   getReward(state) {
//     const targetState = this.getTargetState();
  
//     // ゴールに到達した場合の報酬
//     if (state === targetState) {
//       return 1000; // ゴール到達の報酬
//     }
  
//     // 現在位置とゴールの距離を計算
//     const currentPosition = this.bot.entity.position;
//     const targetPosition = this.targetPosition;
//     const distanceToTarget = currentPosition.distanceTo(targetPosition);
  
//     // 最大距離を基準にスケーリングして報酬を計算
//     const maxDistance = 50; // 最大距離（例: 50ブロック）
//     const distanceReward = Math.max(0, (maxDistance - distanceToTarget) / maxDistance * 100);
  
//     // 探索報酬（縮小）
//     const currentTaggedBlockCount = TaggedBlockList.length;
//     let explorationReward = 0;
  
//     if (currentTaggedBlockCount > this.previousTaggedBlockCount) {
//       explorationReward = 2 * (currentTaggedBlockCount - this.previousTaggedBlockCount); // 探索報酬
//       this.previousTaggedBlockCount = currentTaggedBlockCount;
//     }
  
//     // 合計報酬
//     return distanceReward + explorationReward - 1; // 距離報酬 + 探索報酬 - 通常の移動コスト
//   }  
//   getTargetState() {
//     // ゴール位置を整数座標に変換して状態として返す
//     return `${Math.floor(this.targetPosition.x)}_${Math.floor(this.targetPosition.y)}_${Math.floor(this.targetPosition.z)}`;
//   }  

//   updateQTable(state, action, reward, nextState) {
//     const currentQ = this.qTable[state]?.[action] || 0;
//     const nextMaxQ = Math.max(...Object.values(this.qTable[nextState] || {}));

//     const updatedQ = currentQ + this.learningRate * (reward + this.discountFactor * nextMaxQ - currentQ);

//     if (!this.qTable[state]) this.qTable[state] = {};
//     this.qTable[state][action] = updatedQ;
//   }

//   chooseAction(state) {
//     if (!this.qTable[state]) {
//       this.qTable[state] = { forward: 0, up: 0, down: 0, right: 0, left: 0, jump: 0};
//     }

//     const actions = Object.keys(this.qTable[state]);
//     return actions.reduce((bestAction, action) =>
//       this.qTable[state][action] > (this.qTable[state][bestAction] || 0) ? action : bestAction,
//     actions[0]);
//   }

//   async executeAction(action) {
//     this.actionCounter++;

//     if (action === 'forward') {
//       this.bot.setControlState('forward', true);
//       await this.delay(100);
//       this.bot.setControlState('forward', false);
//     } else if (action === 'up') {
//       lookingUp(this.bot, true);
//       await this.delay(200);
//       lookingUp(this.bot, false);
//     } else if (action === 'down') {
//       lookingDown(this.bot, true);
//       await this.delay(200);
//       lookingDown(this.bot, false);
//     } else if (action === 'right') {
//       lookingRight(this.bot, true);
//       await this.delay(200);
//       lookingRight(this.bot, false);
//     } else if (action === 'left') {
//       lookingLeft(this.bot, true);
//       await this.delay(200);
//       lookingLeft(this.bot, false);
//     } else if (action === 'jump') {
//       this.bot.setControlState('jump', true);
//       await this.delay(200);
//       this.bot.setControlState('jump', false);
//     }

//     // 10回に1回スキャンを実行
//     if (this.actionCounter % 10 === 0) {
//       console.log("スキャンを実行中...");
//       ScanBlocksInRange(-40, 40, -60, 60, 10, this.bot);
//       this.actionCounter = 0;
//     }
//   }

//   async step() {
//     const state = this.getState();
//     const action = this.chooseAction(state);

//     await this.executeAction(action);

//     const nextState = this.getState();
//     const reward = this.getReward(nextState);

//     this.updateQTable(state, action, reward, nextState);

//     if (nextState === this.getTargetState()) {
//       console.log("ゴールに到達しました！");
//       return true;
//     }
//     return false;
//   }

//   async train() {
//     while (true) {
//       const startTime = Date.now();

//       while (Date.now() - startTime < this.timeout) {
//         const reached = await this.step();
//         if (reached) break;
//       }

//       if (Date.now() - startTime >= this.timeout) {
//         console.log("タイムアウト！ スタート地点に戻ります。");
//         this.bot.entity.position = this.startPosition;
//         TaggedBlockList = [];
//       }
//     }
//   }

//   saveQTable(filename) {
//     save(this.qTable, filename);
//     console.log(`Qテーブルを保存しました: ${filename}`);
//   }

//   loadQTable(filename) {
//     const loadedQTable = load(filename, this.bot);
//     if (loadedQTable) {
//       this.qTable = loadedQTable;
//       console.log(`Qテーブルをロードしました: ${filename}`);
//     }
//   }

//   delay(ms) {
//     return new Promise(resolve => setTimeout(resolve, ms));
//   }
// }

// module.exports = AdvancedRLBot;
