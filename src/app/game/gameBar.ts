import * as PIXI from "pixi.js";

export class GameBar extends PIXI.Container {
    background: PIXI.Graphics;
    shadow: PIXI.Graphics;

    constructor() {
        super();

        this.background = new PIXI.Graphics();
        this.addChild(this.background);

        this.shadow = new PIXI.Graphics();
        this.addChild(this.shadow);

        this.redraw();
    }

    redraw() {
        const barHeight = 70;
        const shadowHeight = 1;

        this.background
            .clear()
            .beginFill(0x6D4C41)
            .drawRect(0, window.innerHeight - barHeight, window.innerWidth, barHeight) // 20 pixels over the HTML game-bar.
            .endFill();

        this.shadow
            .clear()
            .beginFill(0x8D6E63)
            .drawRect(0, window.innerHeight - barHeight - shadowHeight, window.innerWidth, shadowHeight)
            .endFill();
    }
}
