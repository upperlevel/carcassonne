/**
 * [Host]
 * Packet containing the random seed used in all random operations of the game.
 */
export interface RandomSeed {
    type: "random_seed"
    seed: number;
}

/**
 * [Player]
 * Packet sent when the player draws a card from the bag.
 */
export interface PlayerDraw {
    type: "player_draw",
}

/**
 * [Player]
 * Packet sent when the player places a card on the board.
 */
export interface PlayerPlace {
    type: "player_place",
    x: number,
    y: number,
    rotation: number,
}
