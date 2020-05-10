import {Side} from "../game/side";

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
export interface PlayerPlaceCard extends Packet {
    type: "player_place_card",
    x: number,
    y: number,
    rotation: number,
}

/**
 * [Player]
 * Packet sent when the player moves the card to place around.
 */
export interface PlayerPlaceCardPreview extends Packet {
    type: "player_place_card_preview",
    x: number,
    y: number,
    rotation: number,
}


/**
 * [Player]
 * Packet sent when the player places a pawn on the placed card.
 * When a monastery is chosen "monastery" will be reported.
 */
export interface PlayerPlacePawn extends Packet {
    type: "player_place_pawn",
    side: Side | "monastery";
    pos: {// TODO: remove
        x: number,
        y: number,
    }
}

/**
 * [Player]
 * Goes to the next round (can only be sent from the player of the current round).
 */
export interface NextRound extends Packet {
    type: "next_round"
}

// TODO: pawn preview.

// Special packets

export interface EndGameAck {
    type: "special_end_game",
    players: PlayerObject[],
}
