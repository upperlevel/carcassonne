import * as PIXI from "pixi.js";
import Vue from "vue";
import {Card, CardFlag} from "./card";
import {GamePhase, RoundState} from "../phase/gamePhase";

export class Bag {
    gamePhase: GamePhase;
    vPool: Vue;

    cards: Array<Card>;

    bagOpenedFrame: PIXI.Rectangle;
    bagClosedFrame: PIXI.Rectangle;

    constructor(gamePhase: GamePhase, cards: Array<Card>) {
        this.cards = cards;

        this.gamePhase = gamePhase;
        this.vPool = this.gamePhase.vEventHandler;

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
        this.vPool.$on("bag-over", this.onBagOver.bind(this));
        this.vPool.$on("bag-click", this.onBagClick.bind(this));
        this.vPool.$on("bag-leave", this.onBagLeave.bind(this));
    }

    unlisten() {
        this.vPool.$off("bag-over", this.onBagOver.bind(this));
        this.vPool.$off("bag-click", this.onBagClick.bind(this));
        this.vPool.$off("bag-leave", this.onBagLeave.bind(this));
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
