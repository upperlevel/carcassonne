
export enum Side {
    TOP,
    RIGHT,
    BOTTOM,
    LEFT
}

export class SideUtil {
    static readonly all = [0, 1, 2, 3];

    static getNeighbourCoords(side: Side): [number, number] {
        switch (side) {
            case Side.TOP:    return [ 1,  0];
            case Side.RIGHT:  return [ 0,  1];
            case Side.BOTTOM: return [-1,  0];
            case Side.LEFT:   return [ 0, -1];
        }
        return [0,  0];
    }

    static invert(side: Side): Side {
        return (side + 2) % 4;
    }
}