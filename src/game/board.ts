import * as PIXI from "pixi.js";
import {CardTile} from "./cardTile";
import {Bag} from "./bag";
import {Side, SideUtil} from "./side";
import {CardConnector} from "./cardConnector";
import InteractionEvent = PIXI.interaction.InteractionEvent;
import {Card} from "./card";

export class Board extends PIXI.Container {
    readonly gridSide: number;
    readonly grid: Array<CardTile>;

    readonly bag: Bag;
    readonly cardConnector: CardConnector;
    readonly rootCardTile: CardTile;

    static TILE_SIZE = 120;

    // Pixie
    uiBackground: PIXI.Graphics;
    isDragging: boolean;


    /**
     * Creates the Board referred to a certain Bag.
     * The Board size is calculated to fit the Bag's cards.
     */
    constructor(bag: Bag, initialCard: Card) {
        super();
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
        this.set(Math.floor(this.gridSide / 2), Math.floor(this.gridSide / 2), this.rootCardTile, true);

        this.initPixie();
    }

    private initPixie() {
        this.hitArea = {
            contains(x: number, y: number): boolean {
                return true;
            }
        }
        this.zIndex = 1000;

        // Drag
        this.interactive = true;
        this.interactiveChildren = false;
        this.isDragging = false;

        let thus = this;
        this.on("mousedown", function(e: InteractionEvent) {
            thus.isDragging = true;
        });
        this.on("mouseup", function(e: InteractionEvent) {
            thus.isDragging = false;
        });
        this.on("mouseupoutside", function(e: InteractionEvent) {
            thus.isDragging = false;
        });
        this.on("mousemove", function(e: InteractionEvent) {
            if (thus.isDragging) {
                let event = e.data.originalEvent as MouseEvent;
                thus.position.x += event.movementX;
                thus.position.y += event.movementY;
            }
        });
    }

    private flatIndex(x: number, y: number): number {
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
        target.x = Math.floor(src.x * this.scale.x / Board.TILE_SIZE);
        target.y = Math.floor(src.y * this.scale.y / Board.TILE_SIZE);
    }

    getNeighbour(x: number, y: number, side: Side): CardTile | undefined {
        let d = SideUtil.getNeighbourCoords(side);
        return this.get(x + d[0], x + d[1]);
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
        // Let's hope the caller already checked if he can.
        this.cardConnector.addCard(undefined, x, y, undefined);

        // Graphics
        let sprite = tile.createSprite();
        sprite.anchor.set(0.5, 0.5);
        sprite.width = Board.TILE_SIZE;
        sprite.height = Board.TILE_SIZE;
        this.cardCoordToRelPos(x, y, sprite.position);
        this.addChild(sprite);

        return true;
    }

    cardCoordToRelPos(x: number, y: number, target: PIXI.IPoint) {
        target.set(Board.TILE_SIZE / 2 + x * Board.TILE_SIZE, Board.TILE_SIZE / 2 + y * Board.TILE_SIZE);
    }
}
