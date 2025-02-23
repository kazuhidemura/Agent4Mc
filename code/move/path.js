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
        bot.chat(`/particle dust{color:[0.0,1.0,0.35],scale:3.01} ${current.x} ${current.y} ${current.z} 0 0 0 0 1 force`);
        console.log(".w.",openSet);

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
            bot.chat(`${Date.now() - startTime}かかりました。`);
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
        const directions_y = [
            { x: 1, y: 1, z: 0 },
            { x: -1, y: 1, z: 0 },
            { x: 0, y: 1, z: 1 },
            { x: 0, y: 1, z: -1 },
            { x: 1, y: -1, z: 0 },
            { x: -1, y: -1, z: 0 },
            { x: 0, y: -1, z: 1 },
            { x: 0, y: -1, z: -1 }
        ];

        for (const dir of directions_y) {
            // 隣接ノード（横方向移動）
            const neighbor = {
                x: current.x + dir.x,
                y: current.y + dir.y,
                z: current.z + dir.z
            };

            const neighborKey = posToKey(neighbor);
            if (closedSet[neighborKey]) continue; // すでに検証済みならスキップ

            // 移動可能かの判定
            const floorBlock = getBlockAt(neighbor.x, neighbor.y - 1, neighbor.z);
            if (!floorBlock || !floorBlock.isPassablePlace || floorBlock.isPassableBlockType) continue;
            if(dir.y===1)
            {
                const nearBlock = getBlockAt(current.x, current.y + 2, current.z);
                if (!nearBlock || !nearBlock.isPassableBlockType) continue;
            }else
            {
                const nearBlock = getBlockAt(neighbor.x, neighbor.y + 2, neighbor.z);
                if (!nearBlock || !nearBlock.isPassableBlockType) continue;
            }

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



function findPath_2(goal, start, data, blocks, timeout, finalgoal , stepTrigger, closeList, bot) {
    console.log("findPath_2開始!引数はこちらです。",goal, start, data, timeout, finalgoal , stepTrigger, closeList,);
    if(goal.length === 0)
    {
        return null;
    }

    const startTime = Date.now();
    // goal.push(finalgoal);//つっこめ！
    console.log('goal:',goal)

    // 座標オブジェクトをキー文字列に変換（例："90,91,-188"）
    function posToKey(pos) {
        const posKey = `${pos.x},${pos.y},${pos.z}`;
        return posKey;
    }

    // ヒューリスティック：ここでは x, z のマンハッタン距離を採用
    function heuristic(pos, goals) {
        return Math.min(...goals.map(goal => {
            return ((Math.abs(pos.x - goal.x) + Math.abs(pos.z - goal.z))*2+Math.abs(pos.x - finalgoal.x) + Math.abs(pos.z - finalgoal.z));
        }));
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
        if (!goals || goals.length === 0) {
            console.error("Error: goals is undefined or empty!");
            return false;
        }
        let checkGoal = goals;
        checkGoal.push(finalgoal);
        return goals.some(goal => {
            if (!checkGoal || goal.x === undefined || goal.y === undefined || goal.z === undefined) {
                console.error("Error: Invalid goal format!", goal);
                return false;
            }
    
            return (
                Number(current.x) === Number(goal.x) &&
                Number(current.y) === Number(goal.y) &&
                Number(current.z) === Number(goal.z)
            );
        });
    }

    // A* のための各種テーブルを初期化
    const openSet = [start];   // 探索対象ノードリスト
    const closedSet = {};      // 探索済みノードのキーの集合
    const closedNodesList = [];// 探索済みノードのリストを追加
    let stepGoalList = [];     // 途中で発見したゴールリスト

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
            return [closedNodesList, null, null];
        }

        // openSet から fScore が最小のノードを選ぶ
        let currentIndex = 0;
        let current = openSet[0];
        // console.log("openSet.length: ",openSet.length)
        // console.log("fScore: ",fScore)
        for (let i = 1; i < openSet.length; i++) {
            // console.log("check(",openSet[i],"): ",fScore[posToKey(openSet[i])],"::: now -> ", fScore[posToKey(current)]);
            if (fScore[posToKey(openSet[i])] < fScore[posToKey(current)]) {
                current = openSet[i];
                currentIndex = i;
            }
        }
        // console.log("openSet: : ",openSet);
        bot.chat(`/particle dust{color:[0.0,1.0,0.35],scale:3.01} ${current.x} ${current.y} ${current.z} 0 0 0 0 1 force`);

        // 段差ゴールの処理
        if (stepGoalList.length >= 10)
        {
            stepGoalList.sort((a, b) => {
                const posA = a[0]; // 左側のオブジェクト
                const posB = b[0]; // 左側のオブジェクト
                const distA = Math.hypot(posA.x - finalgoal.x, posA.y - finalgoal.y, posA.z - finalgoal.z);
                const distB = Math.hypot(posB.x - finalgoal.x, posB.y - finalgoal.y, posB.z - finalgoal.z);
                return distA - distB;
            });       
            console.log("stepGoalList.length: ", stepGoalList.length);
            console.log("stepGoalList: ", stepGoalList);
            let stepGoal__ = stepGoalList[0]
            if (closedNodesList.includes(stepGoal__)) {
                closedNodesList.push(stepGoal__);
            }

            current = stepGoal__[1];
            let currentGoal = {x: stepGoal__[0].x, y: stepGoal__[0].y + 1, z: stepGoal__[0].z};
            // console.log("currentstepGoal:", currentGoal);
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
            return [closedNodesList, path, currentGoal];
        }

        // ゴール到達の判定（座標が一致するかどうか）
        if (isGoalReached(current, goal)) {
            // closedNodesList.push(current);
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
            return [closedNodesList, path, null];
        }

        // 現在のノードを openSet から削除し、closedSet に追加
        openSet.splice(currentIndex, 1);
        closedSet[posToKey(current)] = true;
        // console.log(".w.:",closedNodesList)
        // console.log("current:",current)
        closedNodesList.push(current);
        closeList.push(current);

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

            if(stepTrigger) {
                const neighborBlock = getBlockAt(neighbor.x, neighbor.y, neighbor.z);
                if(neighborBlock !== null && neighborBlock.isPassablePlace && !neighborBlock.isPassableBlockType){
                    // console.log("neighbor__: ",neighbor);
                    // console.log("closeList: ",closeList);
                    // console.log(".w. : ",closeList.some(item => item.x === neighbor.x && item.y === neighbor.y && item.z === neighbor.z))
                    if(!closeList.some(item => item.x === neighbor.x && item.y === neighbor.y && item.z === neighbor.z)&&!closeList.some(item => item.x === neighbor.x && item.y === neighbor.y+1 && item.z === neighbor.z)){
                        const stepGoal_ = [neighbor, current];
                        stepGoalList.push(stepGoal_);
                    }
                }
            }

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

        if(stepTrigger)
        {
            console.log('stepTrigger:.w.');
            const directions = [
                { x: 1, y: -1, z: 0 },
                { x: -1, y: -1, z: 0 },
                { x: 0, y: -1, z: 1 },
                { x: 0, y: -1, z: -1 }
            ];
    
            for (const dir of directions) {
                // 隣接ノード（横方向移動） ※y は変えず
                const neighbor = {
                    x: current.x + dir.x,
                    y: current.y + dir.y,
                    z: current.z + dir.z
                };
                const neighborKey = posToKey(neighbor);
                // console.log('stepTrigger:',neighbor);
                if (closedSet[neighborKey]) continue; // すでに検証済みならスキップ
                const floorBlock = getBlockAt(neighbor.x, neighbor.y - 1, neighbor.z);
                // console.log('stepTrigger2:',neighbor);
                if (!floorBlock || !floorBlock.isPassablePlace || floorBlock.isPassableBlockType) continue;
                const nearBlock = getBlockAt(neighbor.x, neighbor.y + 2, neighbor.z);
                // console.log('stepTrigger3:',neighbor);
                if (!nearBlock || !nearBlock.isPassableBlockType) continue;
                const neighbor_2 = {x:neighbor.x, y:neighbor.y - 1, z:neighbor.z};

                // const neighborBlock = getBlockAt(neighbor.x, neighbor.y, neighbor.z);
                // console.log('stepTrigger4:',neighbor);
                // console.log("neighbor__: ",neighbor);
                // console.log("closeList: ",closeList);
                // console.log(".w. : ",closeList.some(item => item.x === neighbor.x && item.y === neighbor.y && item.z === neighbor.z))
                if(!closeList.some(item => item.x === neighbor.x && item.y === neighbor.y && item.z === neighbor.z)&&!closeList.some(item => item.x === neighbor.x && item.y === neighbor.y-1 && item.z === neighbor.z)){
                    const stepGoal_ = [neighbor_2, current];
                    stepGoalList.push(stepGoal_);
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


    if (stepGoalList.length >= 1)
    {
        stepGoalList.sort((a, b) => {
            const posA = a[0]; // 左側のオブジェクト
            const posB = b[0]; // 左側のオブジェクト
            const distA = Math.hypot(posA.x - finalgoal.x, posA.y - finalgoal.y, posA.z - finalgoal.z);
            const distB = Math.hypot(posB.x - finalgoal.x, posB.y - finalgoal.y, posB.z - finalgoal.z);
            return distA - distB;
        });     
        console.log("stepGoalList.length: ", stepGoalList.length);
        console.log("stepGoalList: ", stepGoalList);
        let stepGoal__ = stepGoalList[0]
        if (closedNodesList.includes(stepGoal__)) {
            closedNodesList.push(stepGoal__);
        }

        current = stepGoal__[1];
        let currentGoal = {x: stepGoal__[0].x, y: stepGoal__[0].y + 1, z: stepGoal__[0].z};
        // console.log("currentstepGoal:", currentGoal);
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
        return [closedNodesList, path, currentGoal];
    }
    // openSet が空になった場合、経路は見つからなかった
    console.log('パスが見つかりませんでした')
    return [closedNodesList, null, null];
}


function splitedLayerPathFinder(goal, data, blocks, timeout, bot) {
    const startTime_ = Date.now();
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

    function spawnParticlesAtPath(path, bot) {
        if (!path || !Array.isArray(path) || path.length === 0) {
            console.error("Error: Invalid path!", path);
            return;
        }
        for (const pos of path) {
            if (!pos || typeof pos.x === "undefined" || typeof pos.y === "undefined" || typeof pos.z === "undefined") {
                console.error("Skipping invalid position:", pos);
                continue;
            }
            bot.chat(`/particle dust{color:[1.0,0.0,0.35],scale:3.01} ${pos.x} ${pos.y} ${pos.z} 0 0 0 0 1 force`);
        }
    }
    
    function findClosestBlocks(blocks, targetPos, targetY, closeList) {
        console.log("Received blocks:", blocks.length); // 受け取ったブロックの数を確認
    
        // 近いチャンクのブロックのみ取得
        let filteredMap = blocks.filter(block =>
            Math.abs(block.chunk.x - Math.floor(targetPos.x / 16)) <= 10 &&
            Math.abs(block.chunk.z - Math.floor(targetPos.z / 16)) <= 10
        );
        console.log("After chunk filter:", filteredMap.length);
        console.log("y =", targetY);
    
        // `closeList` の座標を `Set` に変換（高速検索のため）
        const closeSet = new Set(closeList.map(node => `${node.x},${node.y},${node.z}`));
    
        // 指定Y座標のブロックのみ取得し、通れるものだけを取得
        filteredMap = filteredMap.filter(block =>
            block.position.y === targetY &&
            block.isPassablePlace &&
            !block.isPassableBlockType &&
            !closeSet.has(`${block.position.x},${block.position.y},${block.position.z}`)&& // `closeList` にある座標を除外
            !closeSet.has(`${block.position.x},${block.position.y+1},${block.position.z}`) // `closeList` にある座標を除外_2

        );
        console.log("After closeList filter:", filteredMap.length);
    
        if (filteredMap.length === 0) {
            console.log("No valid blocks found!");
            return []; // 該当なし
        }
    
        // 近い順にソート（マンハッタン距離）
        filteredMap.sort((a, b) => {
            const distA = Math.abs(targetPos.x - a.position.x) + Math.abs(targetPos.z - a.position.z);
            const distB = Math.abs(targetPos.x - b.position.x) + Math.abs(targetPos.z - b.position.z);
            return distA - distB;
        });
    
        console.log("Final sorted blocks:", filteredMap.slice(0, 10));
    
        // 上位10個を返す
        return filteredMap.slice(0, 10);
    }    

    function sleep(waitMsec) {
        var startMsec = new Date();
      
        // 指定ミリ秒間だけループさせる（CPUは常にビジー状態）
        while (new Date() - startMsec < waitMsec);
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

    let markedBlock = [];
    let goalBlockList = [];
    let path;
    let pathList = [];
    let closeList = [];
    let closeSet = new Set(closeList.map(node => `${node.x},${node.y},${node.z}`));
    let closeNode;
    let currentGoal;
    let nullTrigger = false;
    while (true) {
        //とりあえず上を見る
        markedBlock = findClosestBlocks(blocks, currentpos, currentpos.y, closeList);
        // if(markedBlock.length === 0)
        // {
        //     console.log("仮ゴールが見つかりませんでした。本当のゴールを検索します");
        //     const result = findPath_2(goalBlockList, currentpos, data, blocks, timeout, goal, true, closeList, bot);

        //     if (!result || !Array.isArray(result) || result.length !== 3) {
        //         console.error("Error: findPath_2 returned an invalid result!", result);
        //         return null; // エラー回避のため処理を終了
        //     }

        //     const [closeNode, path, currentGoal] = result;
        //     console.log("closeNode:", closeNode);
        //     console.log("path:", path);
        //     spawnParticlesAtPath(path, bot); //綺麗にルートを表示する。
        //     console.log(goal);
        //     if (path !== null) {
        //         pathList.push(path);
        //         pathList = pathList.flat();
        //         pathList.forEach(current => {
        //             bot.chat(`/particle dust{color:[1.0,0.0,0.35],scale:3.01} ${current.x} ${current.y} ${current.z} 0 0 0 0 1 force`);
        //         });
        //         return pathList;
        //     }
        //     console.log("なんも見つからなかったので諦めます");
        //     console.log("pathList: ",pathList);
        //     break;
        // }
        if(markedBlock.length === 0)
        {
            goalBlockList.push(goal);
            pathList.pop();
            if(pathList.length === 0)
            {
                console.log("仮ゴールが見つかりませんでした。本当のゴールを検索します");
                const result = findPath_2(goalBlockList, currentpos, data, blocks, timeout, goal, true, closeList, bot);

                if (!result || !Array.isArray(result) || result.length !== 3) {
                    console.error("Error: findPath_2 returned an invalid result!", result);
                    return null; // エラー回避のため処理を終了
                }

                const [closeNode, path, currentGoal] = result;
                console.log("closeNode:", closeNode);
                console.log("path:", path);
                spawnParticlesAtPath(path, bot); //綺麗にルートを表示する。
                console.log(goal);
                if (path !== null) {
                    pathList.push(path);
                    pathList = pathList.flat();
                    pathList.forEach(current => {
                        bot.chat(`/particle dust{color:[1.0,0.0,0.35],scale:3.01} ${current.x} ${current.y} ${current.z} 0 0 0 0 1 force`);
                    });
                    console.log(`${Date.now() - startTime_}かかりました。`);
                    bot.chat(`${Date.now() - startTime_}かかりました。`);
                    return pathList;
                }
                console.log("なんも見つからなかったので諦めます");
                console.log("pathList: ",pathList);
                break;
            }else{
                markedBlock.shift();
                currentpos = pathList[pathList.length-1][0];
                continue;
            }
        }
        while (true) {
            //TODO : sleepを消す
            // sleep(1000);
            //仮ゴールの周りを見て乗れる場所を探す
            goalBlockList = [];
            const directions = [
                { x: 1, z: 0 },
                { x: -1, z: 0 },
                { x: 0, z: 1 },
                { x: 0, z: -1 }
            ];
            while(true)
            {
                if(markedBlock.length === 0 )
                {
                    goalBlockList.push(goal);
                    break;
                }
                for (const dir of directions) {
                    const targetPos = {
                        x: markedBlock[0].position.x + dir.x,
                        y: markedBlock[0].position.y,
                        z: markedBlock[0].position.z + dir.z
                    };
                    
                    const targetBlock = getBlockAt(targetPos.x, targetPos.y, targetPos.z);
                    const belowBlock = getBlockAt(targetPos.x, targetPos.y - 1, targetPos.z);
                    console.log("targetPos:",targetPos);
                    console.log("targetBlock:",targetBlock);
                    console.log("belowBlock:",belowBlock);
                    
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
                console.log("goalBlockList",goalBlockList);
                if(goalBlockList.length !== 0)
                {
                    break;
                }   else{
                    markedBlock.shift();
                }
            }
            // console.log("markedBlock:",markedBlock[0])
            const result = findPath_2(goalBlockList, currentpos, data, blocks, timeout, goal, true, closeList, bot);
            // console.log("findPath_2 result:", result);
            if(result===null){
                nullTrigger = true;
                return null;
            }
            if (!Array.isArray(result) || result.length !== 3) {
                console.error("Error: findPath_2 returned an invalid result!", result);
                return null; // エラー回避のため処理を終了
            }

            const [closeNode, path, currentGoal] = result;
            console.log("closeNode:", closeNode);
            console.log("path:", path);
            console.log("currentGoal:", currentGoal);
            spawnParticlesAtPath(path, bot); //綺麗にルートを表示する。
            // `closeNode` の各要素を `closeList` に追加（重複は除外）
            for (const node of closeNode) {
                const nodeKey = `${node.x},${node.y},${node.z}`;
                if (!closeSet.has(nodeKey)) {
                    closeSet.add(nodeKey);
                    closeList.push(node); // `closeList` に追加
                }
            }
            console.log("closeList:", closeList);
            if (path === null) {
                let currentBelowPos = {x: currentpos.x, y: currentpos.y - 1, z: currentpos.z};
                if (!closeList.includes(currentpos)) {
                    closeList.push(currentpos);
                }
                if (!closeList.includes(currentBelowPos)) {
                    closeList.push(currentBelowPos);
                }
                markedBlock.shift();
                if (markedBlock.length === 0 ||(path === null && currentGoal === null)) {
                    console.log("Code4Finder: Xyws83LenWaQDJ2fYZpj");
                    pathList.pop();
                    if (pathList.length === 0) {
                        currentpos = start;
                    } else {
                        currentpos = pathList[pathList.length-1][0]
                    }
                    break;
                }
            } else {
                pathList.push(path);
                if(Number(path[path.length-1].x) === Number(goal.x) &&Number(path[path.length-1].y) === Number(goal.y) &&Number(path[path.length-1].z) === Number(goal.z)){
                    currentpos = goal;
                }else{
                    if(currentGoal === null){
                        currentpos = { x: markedBlock[0].position.x, y: markedBlock[0].position.y +1, z: markedBlock[0].position.z };
                        console.log(currentpos);
                        // currentpos = markedBlock[0].position;
                    }else{
                        currentpos = { x: currentGoal.x, y: currentGoal.y , z: currentGoal.z };
                        console.log(currentpos);
                    }
                }
                break;
            }
        }
        console.log("currentpos.x:",currentpos.x)
        if (currentpos.x.toString() === goal.x && currentpos.y.toString() === goal.y && currentpos.z.toString() === goal.z) {
            pathList = pathList.flat();
            pathList.forEach(current => {
                bot.chat(`/particle dust{color:[1.0,0.0,0.35],scale:3.01} ${current.x} ${current.y} ${current.z} 0 0 0 0 1 force`);
            });
            console.log(`${Date.now() - startTime_}かかりました。`);
            bot.chat(`${Date.now() - startTime_}かかりました。`);
            return pathList;
        }
    }
}

module.exports = { findPath , splitedLayerPathFinder };
