import * as PIXI from "pixi.js";
import {app} from "../index";
import Texture = PIXI.Texture;

export class Bag extends PIXI.Container {
    cards: Array<Card>;

    sprite: PIXI.Sprite;
    text: PIXI.Text;

    onClick: () => boolean;
    onOver: () => boolean;
    onOut: () => void;

    static BAG_OPENED: Texture;
    static BAG_CLOSED: Texture;

    static fetchResources() {
        const resources = PIXI.Loader.shared.resources;
        let spritesheet;

        spritesheet = resources["bag"].spritesheet;
        Bag.BAG_OPENED = spritesheet.textures["bag_opened.png"];
        Bag.BAG_CLOSED = spritesheet.textures["bag_closed.png"];
    }

    constructor(cards: Array<Card>) {
        super();
        this.cards = cards;

        Bag.fetchResources();

        this.sprite = new PIXI.Sprite(Bag.BAG_CLOSED);
        this.sprite.scale.set(0.5);

        this.text = new PIXI.Text(
            this.cards.length.toString(),
            new PIXI.TextStyle({
                fill: 0xffffff,
            })
        );
        this.text.anchor.set(0.5);
        this.text.x = this.sprite.width / 2;
        this.text.y = this.sprite.height;


        this.addChild(this.sprite);
        this.addChild(this.text);

        this.interactive = true;
    }

    private _onClick() {
        const cancelled = !this.onClick || this.onClick();
        if (cancelled)
            return;
        this.draw();
    }

    private _onMouseOver() {
        const cancelled = !this.onOver || this.onOver();
        if (cancelled)
            return;
        this.buttonMode = true;
        this.sprite.texture = Bag.BAG_OPENED;
    }

    private _onMouseOut() {
        if (this.onOut)
            this.onOut();
        this.buttonMode = false;
        this.sprite.texture = Bag.BAG_CLOSED;
    }

    listen() {
        this.on("pointerdown", this._onClick, this);
        this.on("mouseover", this._onMouseOver, this);
        this.on("mouseout", this._onMouseOut, this);
    }

    unlisten() {
        this.off("click", this._onClick, this);
        this.off("mouseover", this._onMouseOver, this);
        this.off("mouseout", this._onMouseOut, this);
    }

    draw(): Card {
        const card = this.cards.shift();

        //this.sprite.scale.set(0.9);
        //setTimeout(() => this.sprite.scale.set(1), 1000);

        //this.text.text = this.cards.length.toString();

        this.text.text = this.cards.length.toString();
        return card;
    }

    size() {
        return this.cards.length;
    }

    static fromModality(modality: string) {
        const resource = PIXI.Loader.shared.resources["modalities/" + modality];
        return new Bag(resource.data);
    }
}
