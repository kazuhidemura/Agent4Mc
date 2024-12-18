const fs = require('fs');
const path = require('path');

function save(data, filename) {
  const saveDir = path.join(__dirname, 'saves'); // savesフォルダのパス
  const filePath = path.join(saveDir, filename); // ファイルのフルパス

  // savesフォルダが存在しない場合は作成
  if (!fs.existsSync(saveDir)) {
    fs.mkdirSync(saveDir); // フォルダを作成
    console.log(`フォルダ ${saveDir} を作成しました。`);
  }

  // データを保存
  const jsonData = JSON.stringify(data, null, 2);
  fs.writeFileSync(filePath, jsonData, 'utf8');
  console.log(`データを ${filePath} に保存しました。`);
}

function load(filename) {
  const saveDir = path.join(__dirname, 'saves'); // savesフォルダのパス
  const filePath = path.join(saveDir, filename);

  // ファイルの存在確認
  if (fs.existsSync(filePath)) {
    const jsonData = fs.readFileSync(filePath, 'utf8');
    console.log(`データを ${filePath} から読み込みました。`);
    return JSON.parse(jsonData);
  } else {
    console.log(`${filePath} は存在しません。新規データを作成します。`);
    return [];
  }
}

module.exports = { save, load };