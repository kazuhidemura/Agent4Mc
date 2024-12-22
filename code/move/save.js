const fs = require('fs');
const path = require('path');
const packageJson = require('../package.json');

function save(data, filename) {
  const saveDir = path.join(__dirname, 'saves'); // savesフォルダのパス
  const filePath = path.join(saveDir, filename); // ファイルのフルパス

  // savesフォルダが存在しない場合は作成
  if (!fs.existsSync(saveDir)) {
    fs.mkdirSync(saveDir); // フォルダを作成
    console.log(`フォルダ ${saveDir} を作成しました。`);
  }

  const save_data ={
    version:  packageJson.version,
    blocks: [
      data
    ]
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
    const jsonData = fs.readFileSync(filePath, 'utf8');
    console.log(`データを ${filePath} から読み込みました。`);
    if(jsonData.version!=packageJson.version)
    {
      bot.chat(`-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-`);
      bot.chat(`セーブされているデータのバージョンが違います！`);
      bot.chat(`正しい動作をしない可能性があるので気をつけてください。`);
      bot.chat(`-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-`);
    }
    return JSON.parse(jsonData);
  } else {
    console.log(`${filePath} は存在しません。新規データを作成します。`);
    return [];
  }
}

module.exports = { save, load };
