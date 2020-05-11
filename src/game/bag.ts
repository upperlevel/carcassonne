import * as PIXI from "pixi.js";
import * as EventEmitter from "eventemitter3";
import {Card, CardFlag} from "./card";
import {GamePhase, RoundState} from "../phase/gamePhase";

export class Bag {
    gamePhase: GamePhase;
    uiEventEmitter: EventEmitter;

    cards: Array<Card>;

    bagOpenedFrame: PIXI.Rectangle;
    bagClosedFrame: PIXI.Rectangle;

    constructor(gamePhase: GamePhase, cards: Array<Card>) {
        this.cards = cards;

        this.gamePhase = gamePhase;
        this.uiEventEmitter = this.gamePhase.uiEventEmitter;

        const atlas = PIXI.Loader.shared.resources["bag"].spritesheet;
        this.bagOpenedFrame = atlas.textures["bag_opened.png"].orig;
        this.bagClosedFrame = atlas.textures["bag_closed.png"].orig;
    }

    canPlaceCard(): boolean {
        return this.gamePhase.isMyRound() && this.gamePhase.roundState == RoundState.CardDraw;
    }

    onBagOver(vBag: any) {
        if (this.canPlaceCard()) {
            vBag.frame = this.bagOpenedFrame;
            vBag.$el.style.cursor = "pointer";
        }
    }

    onBagClick(vBag: any) {
        if (this.canPlaceCard()) {
            this.gamePhase.onDraw();
        }
    }

    onBagLeave(vBag: any) {
        vBag.frame = this.bagClosedFrame;
        vBag.$el.style.cursor = "auto";
    }

    listen() {
        this.uiEventEmitter.on("bag-over", this.onBagOver, this);
        this.uiEventEmitter.on("bag-click", this.onBagClick, this);
        this.uiEventEmitter.on("bag-leave", this.onBagLeave, this);
    }

    unlisten() {
        this.uiEventEmitter.off("bag-over", this.onBagOver, this);
        this.uiEventEmitter.off("bag-click", this.onBagClick, this);
        this.uiEventEmitter.off("bag-leave", this.onBagLeave, this);
    }


    draw(): Card {
        return this.cards.shift();
    }

    size() {
        return this.cards.length;
    }

    static fromModality(gamePhase: GamePhase, modality: string) {
        const resource = PIXI.Loader.shared.resources["modalities/" + modality];
        let cards = Bag.duplicateCards(resource.data);

        let initialCard = Bag.findFirstInitialCard(cards);
        // Put the first card first
        [cards[0], cards[initialCard]] = [cards[initialCard], cards[0]];

        return new Bag(gamePhase, cards);
    }

    static duplicateCards(original: Array<Card>): Array<Card> {
        let res = new Array<Card>();
        for (let card of original) {
            res.push(...Array(card.quantity).fill(card))
        }
        return res;
    }

    static findFirstCardFlag(cards: Array<Card>, start: number, flag: CardFlag): number {
        let cardsLen = cards.length;
        for (let i = start; i < cardsLen; i++) {
            if (cards[i].flags.indexOf(flag) >= 0) {
                return i;
            }
        }
    }

    static findFirstInitialCard(cards: Array<Card>): number {
        return this.findFirstCardFlag(cards, 0, "root")
    }
}
