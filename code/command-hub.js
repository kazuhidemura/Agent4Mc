const { move_commands } = require('./move/main.js');
function commands(cmd, username, bot){
    if(move_commands(cmd, username, bot) !== undefined)return;

    //全て除外
    return true;
}

module.exports = { commands };