
type SideType = "lawn" | "village" | "road";

interface Card {
    hasMonastery: boolean,
    spritePath: string,
    sides: {
        left:   SideType,
        right:  SideType,
        top:    SideType,
        bottom: SideType,
    };
}
