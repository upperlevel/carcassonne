
import * as PIXI from "pixi.js";

import AvatarsImage from "Public/images/avatars.png";
import AvatarsSpritesheet from "Public/spritesheets/avatars.json";

import CardsImage from "Public/images/cards.png";
import CardsSpritesheet from "Public/spritesheets/cards.json";

import PawnsImage from "Public/images/pawns.png";
import PawnsSpritesheet from "Public/spritesheets/pawns.json";

import BagImage from "Public/images/bag.png";
import BagSpritesheet from "Public/spritesheets/bag.json";
import BaseTexture = PIXI.BaseTexture;
import ImageResource = PIXI.resources.ImageResource;

async function loadSpritesheet(loader: PIXI.Loader, name: string, imgUrl: string, data: any) {
    return new Promise((resolve, reject) => {
        console.log("[Spritesheet] Loading: " + name);
        const imgElm = new Image();
        imgElm.crossOrigin = 'anonymous';
        imgElm.onload = () => {
            const tex = new PIXI.Texture(new BaseTexture(new ImageResource(imgElm)));
            const spritesheet = new PIXI.Spritesheet(tex, data);
            loader.resources[name] = new (PIXI.LoaderResource as any)(name, "");
            loader.resources[name].spritesheet = spritesheet;
            spritesheet.parse(() => {
                console.log("[Spritesheet] Loaded: " + name);
                resolve(spritesheet);
            });
        };
        imgElm.src = imgUrl; // When the listeners are set, we can finally start downloading the image.
    });
}

export async function load() {
    const loader = PIXI.Loader.shared;
    await Promise.all([
        loadSpritesheet(loader, "avatars", AvatarsImage, AvatarsSpritesheet),
        loadSpritesheet(loader, "cards", CardsImage, CardsSpritesheet),
        loadSpritesheet(loader, "pawns",  PawnsImage, PawnsSpritesheet),
        loadSpritesheet(loader, "bag", BagImage, BagSpritesheet)
    ]);
}
