const fs = require('fs');
const path = require('path');
let packageJson = require('../package.json');
let {TaggedBlockList ,MobsList} = require('./sharedData.js');


function save(filename) {
  const saveDir = path.join(__dirname, 'saves'); // savesフォルダのパス
  const filePath = path.join(saveDir, filename); // ファイルのフルパス

  // savesフォルダが存在しない場合は作成
  if (!fs.existsSync(saveDir)) {
    fs.mkdirSync(saveDir); // フォルダを作成
    console.log(`フォルダ ${saveDir} を作成しました。`);
  }

  const save_data ={
    version:  packageJson.version,
    blocks: TaggedBlockList,
    mobs: MobsList
  };
  
  // データを保存
  const jsonData = JSON.stringify(save_data, null, 2);
  fs.writeFileSync(filePath, jsonData, 'utf8');
  console.log(`データを ${filePath} に保存しました。`);
}

function load(filename, bot) {
    const saveDir = path.join(__dirname, 'saves'); // savesフォルダのパス
    const filePath = path.join(saveDir, filename);
  
    // ファイルの存在確認
    if (fs.existsSync(filePath)) {
      const jsonDataString = fs.readFileSync(filePath, 'utf8'); // 文字列として読み込み
      console.log(`データを ${filePath} から読み込みました。`);
  
      // 文字列をJSONオブジェクトに変換
      try {
        const jsonData = JSON.parse(jsonDataString);
  
        // バージョンチェック
        if (jsonData.version !== packageJson.version) {
          bot.chat(`-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-`);
          bot.chat(`セーブされているデータのバージョンが違います！`);
          bot.chat(`正しい動作をしない可能性があるので気をつけてください。`);
          bot.chat(`BotVer: ${packageJson.version}, DataVer: ${jsonData.version}`);
          bot.chat(`-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-`);
        }
  
        // デバッグ表示
        for (const key in jsonData) {
          if (jsonData.hasOwnProperty(key)) {
            console.log(`${key}: ${JSON.stringify(jsonData[key])}`);
          }
        }
  
        return jsonData; // JSONオブジェクトを返す
      } catch (error) {
        console.error("JSONパースエラー:", error.message);
        return null; // パースエラーの場合はnullを返す
      }
    } else {
      console.log(`${filePath} は存在しません。新規データを作成します。`);
      return { version: packageJson.version, blocks: [], mobs: [] }; // 初期データ
    }
  }
  

module.exports = { save, load };
