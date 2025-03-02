# Agent4Mc
## ディレクトリ構造
```
.
├── README.md
└── code
    ├── command-hub.js //一個下のmainを動かすためのもの
    ├── main.js //main
    ├── move //動き系統のフォルダ
    │   ├── main.js //mian
    │   ├── move.js //移動用の関数
    │   ├── path.js //パスを繋ぐ関数
    │   ├── save.js //保存する関数
    │   ├── saves
    │   │   └── # たくさんのセーブデータ(おもにdebug用)
    │   ├── search.js //検索する関数
    │   ├── test.js //全てコメント化されてるファイル
    │   └── メモ.txt //メモ
    ├── package-lock.json
    └── package.json
```
## 使用法
このコードはmineflayerを使うので下記のコマンドを実行してダウンロード、更新してください。
```
npm install mineflayer
npm update
```
次にcode/main.jsのhostのipとportを変えてください。
```
const bot = mineflayer.createBot({
    host: 'localhost',
    host: '192.168.10.17',//好きなipにしてね！
    port: 2025,
    username: "Aqualuvia",
    version: false,
});
```
mineflayerのプロトコルが壊れているのか、botがコマンドを打てないと聞くため、サーバのserver.propertiesのonline-modeをfalseにしてください。
最後にnode main.jsで一番上のファイルを叩けば動きます。


## 追記
以下のエラーが大量に出てくるという話を聞きましたが私の制作してるところじゃないので知りません。
たとえ出てたとしてもlogがかき消されるだけで実害はないので放置してください。
```
PartialReadError: Read error for undefined : undefined
    at new ExtendableError (/Users/Aqualuvia/node_modules/protodef/src/utils.js:63:13)
    at new PartialReadError (/Users/Aqualuvia/node_modules/protodef/src/utils.js:70:5)
    at Object.reader [as f32] (/Users/Aqualuvia/node_modules/protodef/src/datatypes/numeric.js:89:48)
    at eval (eval at compile (/Users/Aqualuvia/node_modules/protodef/src/compiler.js:262:12), <anonymous>:1229:60)
    at eval (eval at compile (/Users/Aqualuvia/node_modules/protodef/src/compiler.js:262:12), <anonymous>:1232:13)
    at Object.Particle (eval at compile (/Users/Aqualuvia/node_modules/protodef/src/compiler.js:262:12), <anonymous>:1273:9)
    at Object.packet_world_particles (eval at compile (/Users/Aqualuvia/node_modules/protodef/src/compiler.js:262:12), <anonymous>:2549:67)
    at eval (eval at compile (/Users/Aqualuvia/node_modules/protodef/src/compiler.js:262:12), <anonymous>:4071:70)
    at packet (eval at compile (/Users/Aqualuvia/node_modules/protodef/src/compiler.js:262:12), <anonymous>:4162:9)
    at CompiledProtodef.read (/Users/Aqualuvia/node_modules/protodef/src/compiler.js:70:12)
```
