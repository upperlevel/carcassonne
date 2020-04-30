import * as PIXI from "pixi.js";

export const topBar = {
    color: 0xe0e0e0,

    shadow: {
        color: 0xbdbdbd,
        height: 6,
    },

    player: {
        image: {
            height: 150,
        },
        name: {
            style: new PIXI.TextStyle({
                fontFamily: 'Arial',
                fontSize: 12,
            }),
        },
        points: {
            style: new PIXI.TextStyle({
                fontFamily: 'Arial',
                fontSize: 12,
            }),
        },
    },

    marker: {
        color: 0xd84315,
    },
};


