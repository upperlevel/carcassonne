
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
            //                         X,  Y
            case Side.TOP:    return [ 0, -1];
            case Side.RIGHT:  return [ 1,  0];
            case Side.BOTTOM: return [ 0,  1];
            case Side.LEFT:   return [-1,  0];
        }
        return [0,  0];
    }

    static invert(side: Side): Side {
        return (side + 2) % 4;
    }
}