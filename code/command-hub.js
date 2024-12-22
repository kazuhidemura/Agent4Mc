const { move_commands } = require('./move/main.js');
function commands(cmd, username, bot){
    if(move_commands(cmd, username, bot) === undefined)return;




    //退出
    if(cmd === "leave")
    {
        bot.end();
        return;
    }
    //全て除外
    return true;
}

module.exports = { commands };