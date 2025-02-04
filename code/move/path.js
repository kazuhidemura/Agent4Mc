function findPath(goal, data, blocks, timeout, bot) {
    const startTime = Date.now();

    // bot.entity.position は { x, y, z } の形式と仮定
    const start = {
        x: Math.floor(bot.entity.position.x),
        y: Math.floor(bot.entity.position.y),
        z: Math.floor(bot.entity.position.z)
    };
    // 座標オブジェクトをキー文字列に変換（例："90,91,-188"）
    function posToKey(pos) {
        return `${pos.x},${pos.y},${pos.z}`;
    }

    // ヒューリスティック：ここでは x, z のマンハッタン距離を採用
    function heuristic(pos, goal) {
        return Math.abs(pos.x - goal.x) + Math.abs(pos.z - goal.z);
    }

    // JSONのブロックデータから指定座標のブロックを取得
    // ※各ブロックは { block, position:{x,y,z}, tag, isPassableBlockType, isPassablePlace } という構造
    function getBlockAt(x, y, z) {
        console.log(`検索中: x=${x}, y=${y}, z=${z}`);
        const foundBlock = blocks.find(block => 
            block.position.x === x && 
            block.position.y === y && 
            block.position.z === z
        );
        if (!foundBlock) {
            console.log(`座標 [${x}, ${y}, ${z}] は存在しません`);
        }else
        {
            // bot.chat(`/execute as Aotumuri at Aotumuri run particle dust{color:[1.0,0.0,0.35],scale:3.01} ${x} ${y+1} ${z} 0 0 0 0 1 force`);
        }
        return foundBlock || null;
    }
    


    // A* のための各種テーブルを初期化
    const openSet = [start];   // 探索対象ノードリスト
    const closedSet = {};      // 探索済みノードのキーの集合

    const cameFrom = {};       // 経路復元用マップ： { 子ノードのキー: 親ノード }

    // スタートから各ノードへの実コスト
    const gScore = {};
    gScore[posToKey(start)] = 0;

    // 推定総コスト = 実コスト + ヒューリスティック
    const fScore = {};
    fScore[posToKey(start)] = heuristic(start, goal);

    // 探索ループ
    while (openSet.length > 0) {
        // タイムアウトチェック
        if (Date.now() - startTime > timeout) {
            console.log("タイムアウトしました");
            return null;
        }

        // openSet から fScore が最小のノードを選ぶ
        let currentIndex = 0;
        let current = openSet[0];
        for (let i = 1; i < openSet.length; i++) {
            if (fScore[posToKey(openSet[i])] < fScore[posToKey(current)]) {
                current = openSet[i];
                currentIndex = i;
            }
        }

        // ゴール到達の判定（座標が一致するかどうか）
        console.log([current.x, current.y, current.z])
        console.log([goal.x, goal.y, goal.z])
        if (current.x.toString() === goal.x && current.y.toString() === goal.y && current.z.toString() === goal.z) {
            // 経路を再構成する
            const path = [current];
            let currentKey = posToKey(current);
            while (currentKey in cameFrom) {
                current = cameFrom[currentKey];
                currentKey = posToKey(current);
                bot.chat(`/execute as Aotumuri at Aotumuri run particle dust{color:[1.0,0.0,0.35],scale:3.01} ${current.x} ${current.y} ${current.z} 0 0 0 0 1 force`);
                path.push(current);
            }
            path.reverse();
            return path;
        }

        // 現在のノードを openSet から削除し、closedSet に追加
        openSet.splice(currentIndex, 1);
        closedSet[posToKey(current)] = true;

        // 現在のノードの隣接（東西南北）の座標をチェック
        const directions = [
            { x: 1, y: 0, z: 0 },
            { x: -1, y: 0, z: 0 },
            { x: 0, y: 0, z: 1 },
            { x: 0, y: 0, z: -1 }
        ];

        for (const dir of directions) {
            // 隣接ノード（横方向移動） ※y は変えず
            const neighbor = {
                x: current.x + dir.x,
                y: current.y,
                z: current.z + dir.z
            };

            const neighborKey = posToKey(neighbor);
            if (closedSet[neighborKey]) continue; // すでに検証済みならスキップ

            // 移動可能かの判定：候補座標の一個下のブロックが isPassablePlace === true であること
            const floorBlock = getBlockAt(neighbor.x, neighbor.y - 1, neighbor.z);
            // console.log(floorBlock)
            // console.log([neighbor.x, neighbor.y - 1, neighbor.z])
            if (!floorBlock || !floorBlock.isPassablePlace) continue;

            // 移動コストを 1 と仮定
            const tentativeGScore = gScore[posToKey(current)] + 1;

            if (gScore[neighborKey] === undefined || tentativeGScore < gScore[neighborKey]) {
                cameFrom[neighborKey] = current;
                gScore[neighborKey] = tentativeGScore;
                fScore[neighborKey] = tentativeGScore + heuristic(neighbor, goal);

                // openSet に neighbor が含まれていなければ追加
                if (!openSet.some(n => n.x === neighbor.x && n.y === neighbor.y && n.z === neighbor.z)) {
                    openSet.push(neighbor);
                }
            }
        }
    }

    // openSet が空になった場合、経路は見つからなかった
    console.log('パスが見つかりませんでした')
    return null;
}

module.exports = { findPath };
