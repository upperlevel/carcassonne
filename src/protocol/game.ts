export interface Packet {
    sender: string,
}

/**
 * [Host]
 * Packet containing the random seed used in all random operations of the game.
 */
export interface RandomSeed extends Packet {
    type: "random_seed"
    seed: number;
}

/**
 * [Player]
 * Packet sent when the player draws a card from the bag.
 */
export interface PlayerDraw extends Packet {
    type: "player_draw",
}

/**
 * [Player]
 * Packet sent when the player places a card on the board.
 */
export interface PlayerPlace extends Packet {
    type: "player_place",
    x: number,
    y: number,
    rotation: number,
}

/**
 * [Player]
 * Packet sent when the player moves the card to place around.
 */
export interface PlayerPlacePreview extends Packet {
    type: "player_place_preview",
    x: number,
    y: number,
    rotation: number,
}

