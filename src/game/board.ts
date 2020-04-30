import * as PIXI from "pixi.js";
import {CardTile} from "./cardTile";
import {Bag} from "./bag";
import {Side} from "./side";

export class Board extends PIXI.Container {
    readonly gridSide: number;
    readonly grid: Array<CardTile>;

    readonly rootCardTile: CardTile;
    readonly bag: Bag;

    static TILE_SIZE = 120;

    // Pixie
    uiBackground: PIXI.Graphics;


    /**
     * Creates the Board referred to a certain Bag.
     * The Board size is calculated to fit the Bag's cards.
     */
    constructor(bag: Bag) {
        super();
        // Why bag.size() * 2? Good question!
        // We begin the map at the center with one card, then the player can continue however he wants,
        // the worst spatial case is if he places all of the cards in one line, this creates a single line of bag.size()
        // length. the player could do this in all 4 directions, so we should create a grid with bag.size() * 2 to
        //  compensate for all of the possible cases.
        this.gridSide = (bag.size() - 1) * 2 + 1;
        this.grid = new Array<CardTile>(this.gridSide * this.gridSide);

        this.rootCardTile = new CardTile(bag.draw()); // The first card of the un-shuffled bag is the root.
        this.set(this.gridSide / 2, this.gridSide / 2, this.rootCardTile);

        this.bag = bag;
        this.initPixie();
    }

    private initPixie() {
        this.width = Board.TILE_SIZE * this.gridSide;
        this.height = Board.TILE_SIZE * this.gridSide;
    }

    private flatIndex(x: number, y: number) {
        return x * this.gridSide + y;
    }

    get(x: number, y: number) {
        return this.grid[this.flatIndex(x, y)];
    }

    canSet(x: number, y: number, tile: CardTile): boolean {
        let neighbor;

        neighbor = this.get(x, y);
        if (neighbor != null)
            return false;

        neighbor = this.get(x - 1, y);
        if (neighbor && !tile.isCompatible(Side.LEFT, neighbor))
            return false;

        neighbor = this.get(x + 1, y);
        if (neighbor && !tile.isCompatible(Side.RIGHT, neighbor))
            return false;

        neighbor = this.get(x, y - 1);
        if (neighbor && !tile.isCompatible(Side.BOTTOM, neighbor))
            return false;

        neighbor = this.get(x, y + 1);
        if (neighbor && !tile.isCompatible(Side.TOP, neighbor))
            return false;

        return true;
    }

    /**
     * Sets the card at the given Board coordinates.
     * @param x    the X in Board coordinates.
     * @param y    the Y in Board coordinates.
     * @param tile the CardTile to be set, can be provided with a rotation.
     *
     * @return     true if the card has been set, otherwise false.
     */
    set(x: number, y: number, tile: CardTile): boolean {
        if (!this.canSet(x, y, tile))
            return false;
        this.grid[this.flatIndex(x, y)] = tile;

        // Graphics
        let sprite = tile.createSprite();
        sprite.width = Board.TILE_SIZE;
        sprite.height = Board.TILE_SIZE;
        sprite.position.set(Board.TILE_SIZE / 2 + x * Board.TILE_SIZE, Board.TILE_SIZE / 2 + y * Board.TILE_SIZE);
        this.addChild(sprite);

        return true;
    }
}
