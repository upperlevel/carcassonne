import {Board} from "./board";
import {CardTile} from "./cardTile";
import {Side, SideUtil} from "./side";
import {SideTypeUtil} from "./card";

export class CardConnector {
    readonly board: Board;
    private pathData: Map<number, PathData>;
    private nextId: number;

    constructor(board: Board) {
        this.board = board;
        this.pathData = new Map();
        this.nextId = 0;
    }

    canPlaceWithChosenSide(tile: CardTile, x: number, y: number, chosenSide: Side) {
        let cons = tile.getSideConnections(chosenSide);

        for (let con of cons) {
            let neighbour = this.board.getNeighbour(x, y, con);
            if (neighbour === undefined) continue;
            let adjSide = SideUtil.invert(chosenSide);
            if (!SideTypeUtil.isOwnable(neighbour.getSideType(adjSide))) continue
            let f = neighbour.paths[adjSide];
            if (this.pathData.get(f).followers.size != 0) return false;
        }

        return true;
    }

    assignPath(x: number, y: number, side: Side, path: number, dontClose?: boolean) {
        let tile = this.board.get(x, y);
        let cons = tile.getSideConnections(side);
        let oldVal = tile.paths[side];

        let pathData = this.pathData.get(path);

        for (let con of cons) {
            tile.paths[con] = path;
            let adjSide = SideUtil.invert(con);
            let neighbour = this.board.getNeighbour(x, y, con);
            if (neighbour === undefined) {
                pathData.openEndCount++;
                continue;
            }

            let adjPath = neighbour.paths[adjSide];

            if (adjPath == path) {
                pathData.openEndCount--;
                continue
            }

            let d = SideUtil.getNeighbourCoords(con);
            if (adjPath != oldVal) {
                // Merge!
                pathData.merge(this.pathData.get(adjPath));
                this.pathData.delete(adjPath);
                // By the end of the next recursive call no other tile should have the original path.
                // (they should all have been replaced with `path`).
            }
            // Why dontClose = true?
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
            // But the first recursive call to assignPath will close the 0th path (because it sees no open paths).
            // dontClose is just a flag saying that we're still processing the path and that we should not take conclusions.
            this.assignPath(x + d[0], y + d[1], adjSide, path, true);
        }

        if (dontClose != true && pathData.openEndCount <= 0) {
            console.warn("CLOSING " + path.toString())
            this.closePath(x, y, side, false);
        }
    }

    assignScore(x: number, y: number, side: number, gameEnd: boolean): number {
        let score = 0;

        // THIS IS A STACK, queues are not supported in js and I don't want to write one.
        // So this is a DFS visit of the tree with root at (x, y, side) with no recursion.
        let todo = [[x, y, side]];

        while (todo.length > 0) {
            [x, y, side] = todo.pop();

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

    closePath(x: number, y: number, side: Side, gameEnd: boolean) {
        let path = this.board.get(x, y).paths[side];

        let score = this.assignScore(x, y, side, gameEnd);
        this.pathData.get(path).getScoreWinners().forEach((x) => {
            this.board.phase.awardScore(x, score);
        });
        //console.log("ADD SCORE " + score.toString());

        this.pathData.delete(path);
    }

    createPath(): number {
        let id = this.nextId;
        this.nextId++;
        this.pathData.set(id, new PathData())
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
                path = this.createPath();
            }

            this.assignPath(x, y, side, path);
        }
    }

    addCard(player: string | undefined, x: number, y: number, chosenSide: Side | undefined): boolean {
        let tile = this.board.get(x, y);

        if (chosenSide !== undefined && !this.canPlaceWithChosenSide(tile, x, y, chosenSide)) return false;

        this.initializePaths(x, y);
        //console.log("CARD INITIALIZED: ", tile.paths);

        if (chosenSide !== undefined) {
            this.pathData.get(chosenSide).addFollower(player);
        }

        return true;
    }
}

class PathData {
    followers: Map<string, number>;
    openEndCount: number;

    constructor() {
        this.followers = new Map();
        this.openEndCount = 0;
    }

    addFollower(playerId: string, times?: number) {
        let x = this.followers.get(playerId) || 0;
        this.followers.set(playerId, x + (times || 1));
    }

    merge(other: PathData) {
        other.followers.forEach((val, key) => {
            this.addFollower(key, val);
        })

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
}
