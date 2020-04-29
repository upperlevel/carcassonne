import {CardTile} from "./cardTile";
import {Bag} from "../bag";

export class Board {
    readonly gridSide: number;
    readonly grid: Array<CardTile>;

    readonly rootCardTile: CardTile;
    readonly bag: Bag;

    /**
     * Creates the Board referred to a certain Bag.
     * The Board size is calculated to fit the Bag's cards.
     */
    constructor(bag: Bag) {
        this.gridSide = bag.size();
        this.grid = new Array<CardTile>(this.gridSide * this.gridSide);

        this.rootCardTile = new CardTile(bag.draw()); // The first card of the un-shuffled bag is the root.
        this.set(this.gridSide / 2, this.gridSide / 2, this.rootCardTile);

        this.bag = bag;
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
        if (neighbor == null)
            return false;

        neighbor = this.get(x - 1, y);
        if (!tile.isCompatible(Side.LEFT, neighbor))
            return false;

        neighbor = this.get(x + 1, y);
        if (!tile.isCompatible(Side.RIGHT, neighbor))
            return false;

        neighbor = this.get(x, y - 1);
        if (!tile.isCompatible(Side.BOTTOM, neighbor))
            return false;

        neighbor = this.get(x, y + 1);
        if (!tile.isCompatible(Side.TOP, neighbor))
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
        return true;
    }
}
