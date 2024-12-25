function lookingUp(bot, state) {
    this.isLookingUp = state;
    const lookUpLoop = () => {
        if (this.isLookingUp) {
            bot.look(bot.entity.yaw, -Math.PI / 8, true); // 上を向く
            setTimeout(lookUpLoop, 50); // ループを50ms間隔で実行
        }
    };
    if (state) {
        lookUpLoop();
        console.log("上を向き続けています。");
    } else {
        console.log("上を向くのを停止しました。");
    }
}

function lookingDown(bot, state) {
    this.isLookingDown = state;
    const lookDownLoop = () => {
        if (this.isLookingDown) {
            bot.look(bot.entity.yaw, Math.PI / 8, true); // 下を向く
            setTimeout(lookDownLoop, 50); // ループを50ms間隔で実行
        }
    };
    if (state) {
        lookDownLoop();
        console.log("下を向き続けています。");
    } else {
        console.log("下を向くのを停止しました。");
    }
}

function lookingRight(bot, state) {
    this.isLookingRight = state;
    const lookRightLoop = () => {
        if (this.isLookingRight) {
            bot.look(bot.entity.yaw + Math.PI / 8, bot.entity.pitch, true); // 右を向く
            setTimeout(lookRightLoop, 50); // ループを50ms間隔で実行
        }
    };
    if (state) {
        lookRightLoop();
        console.log("右を向き続けています。");
    } else {
        console.log("右を向くのを停止しました。");
    }
}

function lookingLeft(bot, state) {
    this.isLookingLeft = state;
    const lookLeftLoop = () => {
        if (this.isLookingLeft) {
            bot.look(bot.entity.yaw - Math.PI / 8, bot.entity.pitch, true); // 左を向く
            setTimeout(lookLeftLoop, 50); // ループを50ms間隔で実行
        }
    };
    if (state) {
        lookLeftLoop();
        console.log("左を向き続けています。");
    } else {
        console.log("左を向くのを停止しました。");
    }
}

module.exports = {lookingUp, lookingDown, lookingRight, lookingLeft};