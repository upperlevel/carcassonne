import {Board} from "./board";
import {Side, SideUtil} from "./side";
import {SideTypeUtil} from "./card";
import {AnimationData} from "./particles/pathAnimationScheduler";
import {Pawn} from "./pawns/pawn";

export class CardConnector {
    readonly board: Board;
    private pathData: Map<number, PathData>;
    private nextId: number;
    // Array of path ids to close
    private pathsToClose = new Array<number>();

    constructor(board: Board) {
        this.board = board;
        this.pathData = new Map();
        this.nextId = 0;
    }

    canOwnPath(x: number, y: number, chosenSide: Side): boolean {
        let tile = this.board.get(x, y);
        if (tile === undefined) return false;
        if (!SideTypeUtil.isOwnable(tile.getSideType(chosenSide))) return false;
        let path = tile.paths[chosenSide];
        if (path < 0) return false;
        return this.pathData.get(path).followers.size == 0;
    }

    assignPath(x: number, y: number, side: Side, path: number, reAssign?: boolean) {
        if (reAssign === undefined) {
            reAssign = false;
        }

        let tile = this.board.get(x, y);
        let cons = tile.getSideConnections(side);
        let oldVal = tile.paths[side];

        let pathData = this.pathData.get(path);

        for (let con of cons) {
            tile.paths[con] = path;
            let adjSide = SideUtil.invert(con);
            let neighbour = this.board.getNeighbour(x, y, con);
            if (neighbour === undefined) {
                if (!reAssign) {
                    pathData.openEndCount++;
                    //console.log("(" + x.toString() + ", " + y.toString() + ") found open end at " + SideUtil.toStr(con) + " now " + path.toString() + " = " + pathData.openEndCount);
                }
                continue;
            }
            if (!reAssign) {
                pathData.openEndCount--;
                //console.log("(" + x.toString() + ", " + y.toString() + ") found closed end at " + SideUtil.toStr(con) + " now " + path.toString() + " = " + pathData.openEndCount)
            }

            let adjPath = neighbour.paths[adjSide];
            if (adjPath == path) {
                continue
            }

            let d = SideUtil.getNeighbourCoords(con);
            if (!reAssign && adjPath != oldVal) {
                // Merge!
                pathData.merge(this.pathData.get(adjPath));
                //console.log("MERGING: " + path.toString() + " <= " + adjPath.toString() + " new: " + pathData.openEndCount);
                this.pathData.delete(adjPath);
                // By the end of the next recursive call no other tile should have the original path.
                // (they should all have been replaced with `path`).
            }
            // Why reAssign = true?
            //   /   |   /
            // /   0 | 0  /
            //   0   |   1
            // --------------
            //       |   1
            //       | 1   /
            //       |   /
            // Imagine putting a
            //   x
            // /   x
            //   x
            // Tile in the lower left space, this will first merge the 1 path to 0
            // then it will explore itself (finding 1 open path),
            // The merge method will handle the openEnds, we don't need the call to explore new
            // open/closed paths, the reAssign flag will do just that: reassign the tile's paths without
            // meddling with the path status.
            this.assignPath(x + d[0], y + d[1], adjSide, path, true);
        }

        if (!reAssign && pathData.openEndCount <= 0) {
            //console.warn("CLOSING " + path.toString())
            if (pathData.pawns.length > 0) {
                this.closePath(path, false);
            } else {
                this.pathsToClose.push(path)
            }
        }
    }

    assignScore(x: number, y: number, side: number, gameEnd: boolean, tiles?: Array<[number, number]>): number {
        let score = 0;

        // THIS IS A STACK, queues are not supported in js and I don't want to write one.
        // So this is a DFS visit of the tree with root at (x, y, side) with no recursion.
        let todo = [[x, y, side]];

        while (todo.length > 0) {
            [x, y, side] = todo.pop();

            if (tiles !== undefined) {
                tiles.push([x, y]);
            }

            let tile = this.board.get(x, y);
            let sideType = tile.getSideType(side);

            switch (sideType) {
                case "lawn":
                    break;
                case "village":
                    let hasPennant = tile.card.flags.indexOf("pennant") >= 0;
                    score += (1 + (hasPennant ? 1 : 0)) * (gameEnd ? 1 : 2);
                    break;
                case "road":
                    score += 1;
                    break;
            }

            let originalPath = tile.paths[side];
            // Add unexplored neighbors to the stack and remove this from the path (set it to -2)
            for (let s of SideUtil.all) {
                if (tile.paths[s] != originalPath) continue;
                tile.paths[s] = -2;
                let neigh = this.board.getNeighbour(x, y, s);
                if (neigh === undefined) continue;
                if (neigh.paths[SideUtil.invert(s)] >= 0) {
                    let d = SideUtil.getNeighbourCoords(s);
                    todo.push([x + d[0], y + d[1], SideUtil.invert(s)]);
                }
            }
        }

        return score;
    }

    closePath(path: number, gameEnd: boolean) {
        let pathData = this.pathData.get(path);

        if (pathData.pawns.length > 0) {
            let x = pathData.entryPoint.x;
            let y = pathData.entryPoint.y;
            let side = pathData.entryPoint.side;

            let tiles = new Array<[number, number]>();
            let score = this.assignScore(x, y, side, gameEnd, tiles);

            let winners = pathData.getScoreWinners();

            // Give scores to pawns, we need to be sure to give the score only one time to each player
            let toScore = new Set(winners);
            for (let pawn of pathData.pawns) {
                if (toScore.has(pawn.owner.id)) {
                    pawn.addScore(score);
                    toScore.delete(pawn.owner.id);
                }
            }

            let animData = new AnimationData(tiles, pathData.pawns);
            this.board.phase.pathAnimationScheduler.addAnimation(animData);
        }

        this.pathData.delete(path);
    }

    createPath(entryPoint: TileSide): number {
        let id = this.nextId;
        this.nextId++;
        this.pathData.set(id, new PathData(entryPoint))
        return id;
    }

    private initializePaths(x: number, y: number) {
        let tile = this.board.get(x, y);
        let setPaths = 0;// bitset!

        for (let side of SideUtil.all) {
            if ((setPaths & (1 << side)) != 0) continue;

            if (!SideTypeUtil.isOwnable(tile.getSideType(side))) {
                continue;
            }

            let sideConn = tile.getSideConnections(side);

            for (let s of sideConn) {
                setPaths = setPaths | (1 << s);
            }

            // Find any assigned path
            let path = -1;
            for (let s of sideConn) {
                let neighbour = this.board.getNeighbour(x, y, s);
                if (neighbour === undefined) continue;

                path = neighbour.paths[SideUtil.invert(s)];
                break;
            }

            if (path == -1) {
                path = this.createPath(new TileSide(x, y, side));
            }

            this.assignPath(x, y, side, path);
        }
    }

    addCard(x: number, y: number) {
        this.initializePaths(x, y);

        return true;
    }

    onTurnEnd(endGame: boolean) {
        while (this.pathsToClose.length > 0) {
            let path = this.pathsToClose.pop();
            this.closePath(path, endGame);
        }
    }

    onGameEnd() {
        this.pathData.forEach((data, id) => {
            this.closePath(id, true);
        })
    }

    ownPath(x: number, y: number, chosenSide: Side, pawn: Pawn): boolean {
        if (!this.canOwnPath(x, y, chosenSide)) return false;

        let path = this.board.get(x, y).paths[chosenSide];
        this.pathData.get(path).addPawn(pawn);
        return true;
    }

    getPathData(x: number, y: number, side: Side): PathData | undefined {
        let tile = this.board.get(x, y);
        if (tile === undefined) return undefined;
        let pathId = tile.paths[side];
        if (pathId < 0) return undefined;
        return this.pathData.get(pathId);
    }

    canOwnAnyPath(x: number, y: number) {
        let tile = this.board.get(x, y);
        if (tile === undefined) return false;
        for (let side of SideUtil.all) {
            if (!SideTypeUtil.isOwnable(tile.getSideType(side))) continue;
            let path = tile.paths[side];
            if (path < 0) continue;
            if (this.pathData.get(path).followers.size == 0) return true;
        }
        return false;
    }
}

class TileSide {
    x: number;
    y: number;
    side: Side;

    constructor(x: number, y: number, side: Side) {
        this.x = x;
        this.y = y;
        this.side = side;
    }
}

class PathData {
    entryPoint: TileSide;
    followers = new Map<string, number>();
    openEndCount: number = 0;
    pawns = new Array<Pawn>();

    constructor(entryPoint: TileSide) {
        this.entryPoint = entryPoint;
    }

    private addFollower(playerId: string, times?: number) {
        let x = this.followers.get(playerId) || 0;
        this.followers.set(playerId, x + (times || 1));
    }

    merge(other: PathData) {
        other.followers.forEach((val, key) => {
            this.addFollower(key, val);
        })
        this.pawns.push(...other.pawns);

        this.openEndCount += other.openEndCount;
    }

    getScoreWinners(): string[] {
        let max = 0;
        let res: string[] = [];
        this.followers.forEach((count, player) => {
           if (count > max) {
               max = count;
               res = [player];
           } else if (count == max) {
               res.push(player);
           }
        });

        return res;
    }

    addPawn(g: Pawn): void {
        this.addFollower(g.owner.id, 1);
        this.pawns.push(g);
    }
}
