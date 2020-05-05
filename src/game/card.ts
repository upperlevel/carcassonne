import {Side} from "./side";

export type SideType = "lawn" | "village" | "road";
export type CardFlag = "monastery" | "pennant" | "root";

export class SideTypeUtil {
    static isOwnable(sideType: SideType): boolean {
        // You can't own nature!
        return sideType != "lawn";
    }
}

export interface CardSides {
    left:   SideType,
    right:  SideType,
    top:    SideType,
    bottom: SideType,
}

// TODO: compress this (bitsets & more).
export interface Card {
    spritePath: string,
    quantity: number,
    sides: CardSides,
    connections: Side[][],
    flags: CardFlag[]
}
