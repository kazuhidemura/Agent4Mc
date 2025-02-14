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
        // console.log(`検索中: x=${x}, y=${y}, z=${z}`);
        const foundBlock = blocks.find(block =>
            block.position.x === x &&
            block.position.y === y &&
            block.position.z === z
        );
        // if (!foundBlock) {
        //     console.log(`座標 [${x}, ${y}, ${z}] は存在しません`);
        // }else
        // {
        //     bot.chat(`/execute as Aotumuri at Aotumuri run particle dust{color:[1.0,0.0,0.35],scale:3.01} ${x} ${y+1} ${z} 0 0 0 0 1 force`);
        // }
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
        if (current.x.toString() === goal.x && current.y.toString() === goal.y && current.z.toString() === goal.z) {
            // 経路を再構成する
            const path = [current];
            let currentKey = posToKey(current);
            while (currentKey in cameFrom) {
                current = cameFrom[currentKey];
                currentKey = posToKey(current);
                bot.chat(`/particle dust{color:[1.0,0.0,0.35],scale:3.01} ${current.x} ${current.y} ${current.z} 0 0 0 0 1 force`);
                path.push(current);
            }
            path.reverse();
            console.log(`${Date.now() - startTime}かかりました。`);
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

            // 移動可能かの判定
            const floorBlock = getBlockAt(neighbor.x, neighbor.y - 1, neighbor.z);
            // console.log(floorBlock)
            // console.log([neighbor.x, neighbor.y - 1, neighbor.z])
            if (!floorBlock || !floorBlock.isPassablePlace || floorBlock.isPassableBlockType) continue;

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
        const diagonalDirections = [
            { x: 1, z: 1 },   // 右斜め前
            { x: -1, z: 1 },  // 左斜め前
            { x: 1, z: -1 },  // 右斜め後
            { x: -1, z: -1 }  // 左斜め後
        ];

        for (const diag of diagonalDirections) {
            // 斜め移動先の座標を計算
            const neighbor = {
                x: current.x + diag.x,
                y: current.y,
                z: current.z + diag.z
            };
            const neighborKey = posToKey(neighbor);
            if (closedSet[neighborKey]) continue; // 既に検証済みならスキップ

            // 斜め移動するには、隣接する２方向（x方向とz方向）のセルが通行可能である必要がある
            const neighborX = { x: current.x + diag.x, y: current.y, z: current.z };
            const neighborZ = { x: current.x, y: current.y, z: current.z + diag.z };

            const blockX = getBlockAt(neighborX.x, neighborX.y - 1, neighborX.z);
            const blockZ = getBlockAt(neighborZ.x, neighborZ.y - 1, neighborZ.z);
            if (!blockX || !blockX.isPassablePlace) continue;
            if (!blockZ || !blockZ.isPassablePlace) continue;

            // 斜め移動先のセルもチェック
            const floorBlock = getBlockAt(neighbor.x, neighbor.y - 1, neighbor.z);
            if (!floorBlock || !floorBlock.isPassablePlace || floorBlock.isPassableBlockType) continue;

            // 斜め移動の場合は移動コストを √2（約1.414） とする（※必要に応じて調整）
            const tentativeGScore = gScore[posToKey(current)] + Math.SQRT2;
            if (gScore[neighborKey] === undefined || tentativeGScore < gScore[neighborKey]) {
                cameFrom[neighborKey] = current;
                gScore[neighborKey] = tentativeGScore;
                fScore[neighborKey] = tentativeGScore + heuristic(neighbor, goal);

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

function findPath_2(goal, start, data, blocks, timeout, bot) {
    const startTime = Date.now();

    // 座標オブジェクトをキー文字列に変換（例："90,91,-188"）
    function posToKey(pos) {
        return `${pos.x},${pos.y},${pos.z}`;
    }

    // ヒューリスティック：ここでは x, z のマンハッタン距離を採用
    function heuristic(pos, goals) {
        return Math.min(...goals.map(goal =>
            Math.abs(pos.x - goal[0]) + Math.abs(pos.z - goal[2])
        ));
    }

    // JSONのブロックデータから指定座標のブロックを取得
    // ※各ブロックは { block, position:{x,y,z}, tag, isPassableBlockType, isPassablePlace } という構造
    function getBlockAt(x, y, z) {
        // console.log(`検索中: x=${x}, y=${y}, z=${z}`);
        const foundBlock = blocks.find(block =>
            block.position.x === x &&
            block.position.y === y &&
            block.position.z === z
        );
        // if (!foundBlock) {
        //     console.log(`座標 [${x}, ${y}, ${z}] は存在しません`);
        // }else
        // {
        //     bot.chat(`/execute as Aotumuri at Aotumuri run particle dust{color:[1.0,0.0,0.35],scale:3.01} ${x} ${y+1} ${z} 0 0 0 0 1 force`);
        // }
        return foundBlock || null;
    }

    function isGoalReached(current, goals) {
        return goals.some(goal =>
            current.x.toString() === goal[0].toString() &&
            current.y.toString() === goal[1].toString() &&
            current.z.toString() === goal[2].toString()
        );
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
            return [closedSet, null];
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
        if (isGoalReached(current, goals)) {
            // 経路を再構成する
            const path = [current];
            let currentKey = posToKey(current);
            while (currentKey in cameFrom) {
                current = cameFrom[currentKey];
                currentKey = posToKey(current);
                // bot.chat(`/particle dust{color:[1.0,0.0,0.35],scale:3.01} ${current.x} ${current.y} ${current.z} 0 0 0 0 1 force`);
                path.push(current);
            }
            path.reverse();
            console.log(`${Date.now() - startTime}かかりました。`);
            return [closedSet, path];
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

            // 移動可能かの判定
            const floorBlock = getBlockAt(neighbor.x, neighbor.y - 1, neighbor.z);
            // console.log(floorBlock)
            // console.log([neighbor.x, neighbor.y - 1, neighbor.z])
            if (!floorBlock || !floorBlock.isPassablePlace || floorBlock.isPassableBlockType) continue;

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
        const diagonalDirections = [
            { x: 1, z: 1 },   // 右斜め前
            { x: -1, z: 1 },  // 左斜め前
            { x: 1, z: -1 },  // 右斜め後
            { x: -1, z: -1 }  // 左斜め後
        ];

        for (const diag of diagonalDirections) {
            // 斜め移動先の座標を計算
            const neighbor = {
                x: current.x + diag.x,
                y: current.y,
                z: current.z + diag.z
            };
            const neighborKey = posToKey(neighbor);
            if (closedSet[neighborKey]) continue; // 既に検証済みならスキップ

            // 斜め移動するには、隣接する２方向（x方向とz方向）のセルが通行可能である必要がある
            const neighborX = { x: current.x + diag.x, y: current.y, z: current.z };
            const neighborZ = { x: current.x, y: current.y, z: current.z + diag.z };

            const blockX = getBlockAt(neighborX.x, neighborX.y - 1, neighborX.z);
            const blockZ = getBlockAt(neighborZ.x, neighborZ.y - 1, neighborZ.z);
            if (!blockX || !blockX.isPassablePlace) continue;
            if (!blockZ || !blockZ.isPassablePlace) continue;

            // 斜め移動先のセルもチェック
            const floorBlock = getBlockAt(neighbor.x, neighbor.y - 1, neighbor.z);
            if (!floorBlock || !floorBlock.isPassablePlace || floorBlock.isPassableBlockType) continue;

            // 斜め移動の場合は移動コストを √2（約1.414） とする（※必要に応じて調整）
            const tentativeGScore = gScore[posToKey(current)] + Math.SQRT2;
            if (gScore[neighborKey] === undefined || tentativeGScore < gScore[neighborKey]) {
                cameFrom[neighborKey] = current;
                gScore[neighborKey] = tentativeGScore;
                fScore[neighborKey] = tentativeGScore + heuristic(neighbor, goal);

                if (!openSet.some(n => n.x === neighbor.x && n.y === neighbor.y && n.z === neighbor.z)) {
                    openSet.push(neighbor);
                }
            }
        }
    }

    // openSet が空になった場合、経路は見つからなかった
    console.log('パスが見つかりませんでした')
    return [closedSet, null];
}


function splitedLayerPathFinder(goal, data, blocks, timeout, bot) {

    // 座標オブジェクトをキー文字列に変換（例："90,91,-188"）
    function posToKey(pos) {
        return `${pos.x},${pos.y},${pos.z}`;
    }

    // ヒューリスティック：ここでは x, z のマンハッタン距離を採用
    function heuristic(pos, goals) {
        return Math.min(...goals.map(goal =>
            Math.abs(pos.x - goal[0]) + Math.abs(pos.z - goal[2])
        ));
    }

    // JSONのブロックデータから指定座標のブロックを取得
    // ※各ブロックは { block, position:{x,y,z}, tag, isPassableBlockType, isPassablePlace } という構造
    function getBlockAt(x, y, z) {
        // console.log(`検索中: x=${x}, y=${y}, z=${z}`);
        const foundBlock = blocks.find(block =>
            block.position.x === x &&
            block.position.y === y &&
            block.position.z === z
        );
        return foundBlock || null;
    }

    function findClosestBlocks(blocks, targetPos, targetY) {
        // 近いチャンクのブロックのみ取得
        let filteredMap = blocks.filter(block =>
            Math.abs(block.chunk.x - Math.floor(targetPos.x / 16)) <= 10 &&
            Math.abs(block.chunk.z - Math.floor(targetPos.z / 16)) <= 10
        );

        // 指定Y座標のブロックのみ取得し、通れるものだけを取得
        filteredMap = filteredMap.filter(block =>
            block.position.y === targetY &&
            block.isPassablePlace &&
            !block.isPassableBlockType
        );

        if (filteredMap.length === 0) return []; // 該当なし

        // 近い順にソート（マンハッタン距離）
        filteredMap.sort((a, b) => {
            const distA = Math.abs(targetPos.x - a.position.x) + Math.abs(targetPos.z - a.position.z);
            const distB = Math.abs(targetPos.x - b.position.x) + Math.abs(targetPos.z - b.position.z);
            return distA - distB;
        });

        // 上位10個を返す
        return filteredMap.slice(0, 10);
    }


    const start = {
        x: Math.floor(bot.entity.position.x),
        y: Math.floor(bot.entity.position.y),
        z: Math.floor(bot.entity.position.z)
    };

    let currentpos = {
        x: Math.floor(bot.entity.position.x),
        y: Math.floor(bot.entity.position.y),
        z: Math.floor(bot.entity.position.z)
    };

    let markedBlock;
    let goalBlockList;
    let path;
    let pathList;
    let closeList;
    let closeSet = new Set(closeList.map(node => `${node.x},${node.y},${node.z}`));

    while (true) {
        //とりあえず上を見る
        markedBlock = findClosestBlocks(blocks, currentpos, currentpos.y);
        while (true) {
            //仮ゴールの周りを見て乗れる場所を探す
            goalBlockList = [];
            const directions = [
                { x: 1, z: 0 },
                { x: -1, z: 0 },
                { x: 0, z: 1 },
                { x: 0, z: -1 }
            ];
            for (const dir of directions) {
                const targetPos = {
                    x: markedBlock[0].position.x + dir.x,
                    y: markedBlock[0].position.y,
                    z: markedBlock[0].position.z + dir.z
                };

                const targetBlock = getBlockAt(targetPos.x, targetPos.y, targetPos.z);
                const belowBlock = getBlockAt(targetPos.x, targetPos.y - 1, targetPos.z);

                if (
                    targetBlock &&
                    targetBlock.isPassablePlace &&
                    targetBlock.isPassableBlockType &&
                    belowBlock &&
                    belowBlock.isPassablePlace &&
                    !belowBlock.isPassableBlockType
                ) {
                    goalBlockList.push(targetPos);
                }
            }
            [closeNode, path] = findPath_2(goalBlockList, markedBlock[0], data, blocks, timeout, bot);
            // `closeNode` の各要素を `closeList` に追加（重複は除外）
            for (const node of closeNode) {
                const nodeKey = `${node.x},${node.y},${node.z}`;
                if (!closeSet.has(nodeKey)) {
                    closeSet.add(nodeKey);
                    closeList.push(node); // `closeList` に追加
                }
            }
            if (path === null) {
                markedBlock.shift();
                if (markedBlock.length === 0) {
                    pathList.pop();
                    if (pathList.length === 0) {
                        currentpos = start;
                    } else {
                        currentpos = pathList[pathList.length-1][0]
                    }
                }
            } else {
                pathList.push(path);
                currentpos = markedBlock[0];

                break;
            }
        }
        if (currentpos.x.toString() === goal.x && currentpos.y.toString() === goal.y && currentpos.z.toString() === goal.z) {
            pathList = pathList.flat();
            pathList.forEach(current => {
                bot.chat(`/particle dust{color:[1.0,0.0,0.35],scale:3.01} ${current.x} ${current.y} ${current.z} 0 0 0 0 1 force`);
            });
            return pathList;
        }
    }
}

module.exports = { findPath , splitedLayerPathFinder };
