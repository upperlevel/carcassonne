import {Side} from "./side";

export type SideType = "lawn" | "village" | "road";

export class SideTypeUtil {
    static isOwnable(sideType: SideType): boolean {
        // You can't own nature!
        return sideType != "lawn";
    }
}

export interface Card {
    hasMonastery: boolean,
    spritePath: string,
    sides: {
        left:   SideType,
        right:  SideType,
        top:    SideType,
        bottom: SideType,
    };
    connections: Side[][]
}
