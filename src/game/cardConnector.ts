import {Board} from "./board";
import {CardTile} from "./cardTile";
import {Side, SideUtil} from "./side";
import {SideTypeUtil} from "./card";

export class CardConnector {
    readonly board: Board;
    private pathData: Map<number, PathData>;
    private nextId: number;

    constructor(board: Board) {
        this.board = board
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
            if (this.pathData.get(f).owners.size != 0) return false;
        }

        return true;
    }

    assignPath(x: number, y: number, side: Side, path: number) {
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

            let d = SideUtil.getNeighbourCoords(side);
            if (adjPath != oldVal) {
                // Merge!
                pathData.merge(this.pathData.get(adjPath));
                this.pathData.delete(adjPath);
                // By the end of the next recursive call no other tile should have the original path.
                // (they should all have been replaced with `path`).
            }
            this.assignPath(x + d[0], y + d[1], adjSide, path);
        }

        if (pathData.openEndCount <= 0) {
            this.closePath(x, y, side);
        }
    }

    closePath(x: number, y: number, side: Side) {
        console.log("TODO: close and assign points!");
        // TODO
        // You can implement this with a simple DFS, if you emulate a rooted tree (with (x, y, side) as root)
        // you will visit each node.
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
                continue
            }

            let sideConn = tile.getSideConnections(side);

            for (let s of sideConn) {
                setPaths = setPaths | (1 << side);
            }

            // Find any assigned path
            let path = -1;
            for (let s of sideConn) {
                let neighbour = this.board.getNeighbour(x, y, s);
                if (neighbour == undefined) continue;
                path = neighbour.paths[SideUtil.invert(s)];
                break;
            }

            if (path == -1) {
                path = this.createPath()
            }

            this.assignPath(x, y, side, path);
        }
    }

    addCard(player: string | undefined, x: number, y: number, chosenSide: Side | undefined): boolean {
        let tile = this.board.get(x, y);

        if (chosenSide !== undefined && !this.canPlaceWithChosenSide(tile, x, y, chosenSide)) return false;

        this.initializePaths(x, y);

        if (chosenSide !== undefined) {
            this.pathData.get(chosenSide).owners.add(player);
        }

        return true;
    }
}

class PathData {
    owners: Set<String>;
    openEndCount: number;

    constructor() {
        this.owners = new Set();
        this.openEndCount = 0;
    }

    merge(other: PathData) {
        other.owners.forEach(this.owners.add, this.owners);
        this.openEndCount += other.openEndCount;
    }
}
