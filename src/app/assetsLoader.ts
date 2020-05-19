
import * as PIXI from "pixi.js";

import AvatarsImage from "Public/images/avatars.png";
import AvatarsSpritesheet from "Public/spritesheets/avatars.json";

import CardsImage from "Public/images/cards.png";
import CardsSpritesheet from "Public/spritesheets/cards.json";

import PawnsImage from "Public/images/pawns.png";
import PawnsSpritesheet from "Public/spritesheets/pawns.json";

import BagImage from "Public/images/bag.png";
import BagSpritesheet from "Public/spritesheets/bag.json";

async function loadSpritesheet(loader: PIXI.Loader, name: string, image: string, data: any) {
    return new Promise((resolve, reject) => {
        const texture = PIXI.Texture.from(image);
        texture.baseTexture.on("loaded", () => {
            const spritesheet = new PIXI.Spritesheet(texture, data);
            loader.resources[name] = new (PIXI.LoaderResource as any)(name, "");
            loader.resources[name].spritesheet = spritesheet;
            spritesheet.parse(() => {
                resolve(spritesheet);
            });
        });
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
