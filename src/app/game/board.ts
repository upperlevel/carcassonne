import * as PIXI from "pixi.js";
import {CardTile} from "./cardTile";
import {Bag} from "./bag";
import {Side, SideUtil} from "./side";
import {CardConnector} from "./cardConnector";
import InteractionEvent = PIXI.interaction.InteractionEvent;
import {Card} from "./card";
import {GamePhase} from "../phase/gamePhase";
import {TileDB, TilePlacement} from "./tileDB";
import {AnimationData} from "./particles/pathAnimationScheduler";

export class Board extends PIXI.Container {
    static TILE_SIZE = 120;

    readonly phase: GamePhase;
    readonly gridSide: number;
    readonly grid: Array<CardTile>;

    readonly bag: Bag;
    readonly cardConnector: CardConnector;
    readonly rootCardTile: CardTile;

    private tileDb: TileDB;

    private left: number = Infinity;
    private right: number = -Infinity;
    private bottom: number = Infinity;
    private top: number = -Infinity;

    // Pixie
    isDragging: boolean;


    /**
     * Creates the Board referred to a certain Bag.
     * The Board size is calculated to fit the Bag's cards.
     */
    constructor(phase: GamePhase, bag: Bag, initialCard: Card) {
        super();
        this.phase = phase;
        // Why bag.size() * 2? Good question!
        // We begin the map at the center with one card, then the player can continue however he wants,
        // the worst spatial case is if he places all of the cards in one line, this creates a single line of bag.size()
        // length. the player could do this in all 4 directions, so we should create a grid with bag.size() * 2 to
        //  compensate for all of the possible cases.
        this.gridSide = (bag.size() - 1) * 2 + 1;
        this.grid = new Array<CardTile>(this.gridSide * this.gridSide);

        this.bag = bag;
        this.cardConnector = new CardConnector(this);

        this.rootCardTile = new CardTile(initialCard);
        this.tileDb = new TileDB(this);

        this.set(Math.floor(this.gridSide / 2), Math.floor(this.gridSide / 2), this.rootCardTile, true);
        this.initPixi();
    }

    /**
     * Checks if at the given position and scale the board is considered lost.
     * The board is lost if its cards' bounding-box doesn't intersect with the window.
     */
    isBoardLost(position: PIXI.IPoint, scale: PIXI.IPoint) {
        const rLeft = position.x + (this.left + 1) * Board.TILE_SIZE * scale.x;
        const rRight = position.x + this.right * Board.TILE_SIZE * scale.x;
        const rBottom = position.y + (this.bottom + 1) * Board.TILE_SIZE * scale.y;
        const rTop = position.y + this.top * Board.TILE_SIZE * scale.y;

        return rTop < 0 || rBottom > window.innerHeight || rLeft > window.innerWidth || rRight < 0;
    }

    private initPixi() {
        this.sortableChildren = true;
        this.hitArea = {
            contains(x: number, y: number): boolean {
                return true;
            }
        };

        // Drag
        this.interactive = true;
        this.interactiveChildren = true;
        this.isDragging = false;

        this.on("mousedown", (e: InteractionEvent) => {
            this.isDragging = true;
        });
        this.on("mouseup", (e: InteractionEvent) => {
            this.isDragging = false;
        });
        this.on("mouseupoutside", (e: InteractionEvent) => {
            this.isDragging = false;
        });
        this.on("mousemove", (e: InteractionEvent) => {
            if (this.isDragging) {
                let event = e.data.originalEvent as MouseEvent;

                const newPosX = this.position.x + event.movementX;
                const newPosY = this.position.y + event.movementY;

                if (this.isBoardLost(new PIXI.Point(newPosX, newPosY), this.scale)) {
                    //console.log("You can't go further than this, you'll loose the board!");
                    return;
                }

                this.position.x = newPosX;
                this.position.y = newPosY;
            }
        });
    }

    flatIndex(x: number, y: number): number {
        if (0 <= x  && x < this.gridSide && 0 <= y && y < this.gridSide) {
            return x * this.gridSide + y;
        } else {
            return -1;
        }
    }

    get(x: number, y: number): CardTile | undefined {
        return this.grid[this.flatIndex(x, y)];
    }

    containerCoordsToTileCoords(src: PIXI.Point, target: PIXI.Point) {
        target.x = Math.floor(src.x / Board.TILE_SIZE);
        target.y = Math.floor(src.y / Board.TILE_SIZE);
    }

    getNeighbour(x: number, y: number, side: Side): CardTile | undefined {
        let d = SideUtil.getNeighbourCoords(side);
        return this.get(x + d[0], y + d[1]);
    }

    canSet(x: number, y: number, tile: CardTile): boolean {
        let hasNeighbour = false;

        let node = this.get(x, y);
        if (node !== undefined) {
            //console.log("No: occupied")
            return false;
        }

        for (let side of SideUtil.all) {
            let coords = SideUtil.getNeighbourCoords(side);
            let neighbor = this.get(x + coords[0], y + coords[1]);
            hasNeighbour = hasNeighbour || neighbor !== undefined;
            //if (neighbor) console.log("Side ", side, ": ", tile.getSideType(side), neighbor.getSideType(SideUtil.invert(side)));
            if (neighbor && !tile.isCompatible(side, neighbor)) {
                //console.log("No: incompatible side ", side, ": ", tile.getSideType(side), neighbor.getSideType(SideUtil.invert(side)));
                return false;
            }
        }

        return hasNeighbour;
    }

    getPossiblePlacements(card: Card): Array<TilePlacement> {
        return this.tileDb.getPossiblePlacements(card)
    }

    monasteryInit(x: number, y: number) {
        let tile = this.get(x, y);
        if (tile === undefined || tile.monasteryData === undefined) return;

        let score = 1;
        for (let dx of [-1, 0, 1]) {
            for (let dy of [-1, 0, 1]) {
                if (dx == 0 && dy == 0) continue;
                if (this.get(x + dx, y + dy) !== undefined) score += 1;
            }
        }

        tile.monasteryData.completedTiles = score;
    }

    private monasteryPlaceNeighbour(x: number, y: number) {
        let tile = this.get(x, y);
        if (tile === undefined || tile.monasteryData === undefined) return;
        let data = tile.monasteryData;

        if (++data.completedTiles >= 9 && data.pawn !== undefined) {
            // Create animation
            let tiles = new Array<[number, number]>();
            for (let dx of [-1, 0, 1]) {
                for (let dy of [-1, 0, 1]) {
                    tiles.push([x + dx, y + dy]);
                }
            }

            data.pawn.addScore(9);
            let animData = new AnimationData(tiles, [data.pawn]);
            this.phase.pathAnimationScheduler.addAnimation(animData);
            data.pawn = undefined;
        }
    }

    /**
     * Sets the card at the given Board coordinates.
     * @param x    the X in Board coordinates.
     * @param y    the Y in Board coordinates.
     * @param tile the CardTile to be set, can be provided with a rotation.
     * @param force if true will insert the tile without any checks.
     *
     * @return     true if the card has been set, otherwise false.
     */
    set(x: number, y: number, tile: CardTile, force?: boolean): boolean {
        if (!this.canSet(x, y, tile) && force !== true)
            return false;

        this.grid[this.flatIndex(x, y)] = tile;

        if (x < this.left) {
            this.left = x;
            console.log("Left", x);
        }
        if (x > this.right) {
            this.right = x;
            console.log("Right", x);
        }
        if (y < this.bottom) {
            this.bottom = y;
            console.log("Bottom", y);
        }
        if (y > this.top) {
            this.top = y;
            console.log("Top", y);
        }

        this.tileDb.onTileAdd(x, y);

        this.cardConnector.addCard(x, y);

        // Graphics
        let sprite = tile.createSprite();
        sprite.anchor.set(0.5, 0.5);
        sprite.width = Board.TILE_SIZE;
        sprite.height = Board.TILE_SIZE;
        sprite.zIndex = 0;
        this.cardCoordToRelPos(x, y, sprite.position);
        this.addChild(sprite);

        return true;
    }

    onRoundEnd(placedX: number, placedY: number, endGame: boolean) {
        // Why are we doing this now?
        // We need to wait for the end of the turn before updating monasteries
        // otherwise we wouldn't know if the player has chosen to own it or not.
        // Same thing goes with roads but they have to do a 2-way step (first initialize, then close) as the
        // pawn placements requires initialization data.

        // If monastery: initialize data
        this.monasteryInit(placedX, placedY);

        // Update nearby monasteries
        for (let dx of [-1, 0, 1]) {
            for (let dy of [-1, 0, 1]) {
                if (dx == 0 && dy == 0) continue;
                this.monasteryPlaceNeighbour(placedX + dx, placedY + dy);
            }
        }

        this.cardConnector.onTurnEnd(endGame);
    }

    onGameEnd() {
        this.cardConnector.onGameEnd();

        this.tileDb.getAllMonasteries().forEach(b => {
            let tile = this.get(b.x, b.y);
            let data = tile.monasteryData!!;
            if (data.pawn !== undefined && data.completedTiles < 9) {
                // Create animation
                let tiles = new Array<[number, number]>();

                for (let dx of [-1, 0, 1]) {
                    for (let dy of [-1, 0, 1]) {
                        let x = b.x + dx;
                        let y = b.y + dy;
                        if (this.get(x, y) !== undefined) {
                            tiles.push([x, y]);
                        }
                    }
                }
                data.pawn.addScore(data.completedTiles);
                let animData = new AnimationData(tiles, [data.pawn]);
                this.phase.pathAnimationScheduler.addAnimation(animData);
                data.pawn = undefined;
            }
        });
    }

    cardCoordToRelPos(x: number, y: number, target: PIXI.IPoint) {
        const tileSize = Board.TILE_SIZE;
        target.set(
            tileSize / 2 + x * tileSize,
            tileSize / 2 + y * tileSize
        );
    }
}
