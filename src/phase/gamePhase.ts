import {Phase} from "./phase";
import {app, channel} from "../index";
import * as PIXI from "pixi.js";
import {PlayerDraw, PlayerPlace, RandomSeed} from "../protocol/game";
import {Bag} from "../game/bag";
import {Board} from "../game/board";
import {CardTile} from "../game/cardTile";
import {shuffle} from "../util/array";
import {TopBar} from "../game/ui/topBar";
import {Card} from "../game/card";

export class GamePhase extends Phase {
    seed: number;

    bag: Bag;
    board: Board;

    me: PlayerObject;
    playersById: Map<string, PlayerObject>;

    orderedPlayers: Array<PlayerObject>;
    avatars: Array<PIXI.Container>;
    roundOfIdx: number = -1;
    roundOf: PlayerObject = undefined;

    drawnCard: CardTile;

    readonly eventTarget: EventTarget = new EventTarget();

    /* UI */
    topBar: TopBar;

    constructor(me: PlayerObject, playersById: Map<string, PlayerObject>) {
        super("game");

        this.me = me;
        this.playersById = playersById;
        this.orderedPlayers = Array.from(playersById.values()).sort((a, b) => {
            if (a.id < b.id) return -1;
            if (a.id > b.id) return  1;
            return 0;
        }); // The players are sorted this way to make sure all clients has the same list.

        // UI
        this.topBar = new TopBar(this);

        let card = this.setupBag();
        this.setupBoard(card);
    }

    // ================================================================================================
    // UI
    // ================================================================================================

    setupBag() {
        this.bag = Bag.fromModality("classical");
        this.bag.position.set(0, this.topBar.height);

        const cancelled = () => !this.canDrawCard();
        this.bag.onClick = cancelled;
        this.bag.onOver  = cancelled;
        let card = this.bag.draw(); // The first card of the un-shuffled bag is the root.
        this.bag.onCardDraw = this.onDraw.bind(this);
        return card;
    }

    setupBoard(initialCard: Card) {
        this.board = new Board(this.bag, initialCard);
        this.board.position.set(0, this.topBar.height);
        this.centerBoard();
        //console.log("BOARD", this.board);
    }

    setSeed(seed: number) {
        this.seed = seed;
        console.log("Game seed:", this.seed);

        shuffle(this.orderedPlayers, this.seed);
        shuffle(this.bag.cards, this.seed);

        this.onStart();

        this.topBar.setPlayers(this.orderedPlayers);
    }

    onRandomSeed(event: CustomEvent) {
        const packet = event.detail as RandomSeed;
        if (!this.seed) {
            this.setSeed(packet.seed);
            return;
        }
        console.error("Seed received but there was already another seed set.");
    }

    /** Function called when the game is ready to start. */
    onStart() {
        console.log("Game started.");
        this.nextRound();
    }

    isMyRound() {
        return this.isRoundOf(this.me);
    }

    isRoundOf(player: PlayerObject) {
        return this.roundOf && this.roundOf.id == player.id;
    }

    /** Goes on with the next round. */
    nextRound() {
        if (this.bag.size() == 0) { // If the bag's empty ends the game.
            this.onEnd();
            return;
        }

        this.roundOfIdx = (this.roundOfIdx + 1) % this.orderedPlayers.length;
        this.roundOf = this.orderedPlayers[this.roundOfIdx];
        console.log("Round of:", this.roundOf.username);

        this.drawnCard = undefined;

        if (this.roundOf.id == this.me.id) {
            console.log("It's your round!");
        }
    }

    /** Function called when the game finishes (the bag goes out of cards). */
    onEnd() {
        console.log("Game ended.");
        // TODO show ranking
    }

    drawnCardSprite: PIXI.Sprite; // TODO temp

    // ================================================================================================
    // Draw
    // ================================================================================================

    canDrawCard() {
        return this.isMyRound() && this.drawnCard === undefined;
    }

    /** Function issued when any player draws a card. */
    onDraw(card: Card) {
        if (this.isMyRound()) {
            // Notify the other players that a card has been drawn.
            channel.send({
                type: "player_draw",
            } as PlayerDraw);
        }

        this.drawnCard = new CardTile(card);

        this.drawnCardSprite = this.drawnCard.createSprite();
        this.drawnCardSprite.anchor.set(0.5, 0.5)
        this.drawnCardSprite.width = Board.TILE_SIZE;
        this.drawnCardSprite.height = Board.TILE_SIZE;
        this.board.addChild(this.drawnCardSprite);
    }

    /** Function called when another player (that is not me) draws a card. */
    onPlayerDraw(event: CustomEvent) {
        const packet = event.detail as PlayerDraw;
        this.bag.draw();
    }

    // ================================================================================================
    // Place
    // ================================================================================================

    /** Function called when the cursor moves around the map. */
    onCursorMove(event: PIXI.interaction.InteractionEvent) {
        //console.log("[Stage] onCursorMove");
        if (this.drawnCardSprite) {
            this.updateDrawnCard(event)
        }
    }

    /** Function called when the cursor clicks. */
    onCursorClick(event: PIXI.interaction.InteractionEvent) {
        if (this.drawnCard && this.isMyRound()) {
            let pos = event.data.getLocalPosition(this.board, null, event.data.global);
            this.board.containerCoordsToTileCoords(pos, pos);
            this.onPlaceSend(pos.x, pos.y)
        }
    }

    /** Function called when the cursor clicks. */
    onCursorRightClick(event: PIXI.interaction.InteractionEvent) {
        if (this.drawnCard && this.isMyRound()) {
            this.drawnCard.rotation = (this.drawnCard.rotation + 1) % 4;
            this.updateDrawnCard(event)
            // TODO: Send out event: card rotation
        }
    }

    updateDrawnCard(event: PIXI.interaction.InteractionEvent) {
        let pos = event.data.getLocalPosition(this.board, null, event.data.global);
        this.board.containerCoordsToTileCoords(pos, pos);

        let canSet = this.board.canSet(pos.x, pos.y, this.drawnCard);

        this.board.cardCoordToRelPos(pos.x, pos.y, pos);
        this.drawnCardSprite.position.set(pos.x, pos.y);
        this.drawnCardSprite.tint = canSet ? 0xFFFFFF : 0xFFAAAA;
        this.drawnCardSprite.rotation = -this.drawnCard.rotation * Math.PI / 2;
    }

    /**
     * Function called when any player places the drawn card within the Board.
     *
     * @param x        The X in Board coordinates.
     * @param y        The Y in Board coordinates.
     * @param rotation The rotation of the card.
     */
    onPlace(x: number, y: number, rotation: number) {
        if (!this.board.set(x, y, this.drawnCard))
            return false; // Can't place the card here.
        this.drawnCard.rotation = rotation;
        this.board.removeChild(this.drawnCardSprite);
        this.drawnCard = null;
        this.drawnCardSprite = null;
        this.nextRound();
        return true;
    }

    /** Function called when the board is clicked. */
    onPlaceSend(x: number, y: number) {
        if (!this.drawnCard || !this.isMyRound()) // Card not drawn or it's not your round.
            return false;
        let rotation = this.drawnCard.rotation;
        if (!this.onPlace(x, y, rotation)) {
            return false;
        }
        channel.send({
            type: "player_place",
            x: x,
            y: y,
            rotation: rotation,
        } as PlayerPlace);
        return true;
    }

    /** Function called when another player (that is not me) places a card.*/
    onPlayerPlace(event: CustomEvent) {
        const packet = event.detail as PlayerPlace;
        this.onPlace(packet.x, packet.y, packet.rotation);
    }

    centerBoard() {
        let boardScreenWidth = app.renderer.width;
        let boardScreenHeight = app.renderer.height - this.topBar.height;

        // Relative to the topmost point (0, topBar.height)
        let screenMidPointWidth = boardScreenWidth / 2;
        let screenMidPointHeight = boardScreenHeight / 2;

        let boardSize = this.board.gridSide * Board.TILE_SIZE;// Both width and height (they're the same)

        this.board.position.set(screenMidPointWidth - boardSize / 2, screenMidPointHeight - boardSize / 2);
    }

    enable() {
        super.enable();
        app.stage = new PIXI.Container();
        app.stage.addChild(this.bag);
        app.stage.addChild(this.topBar);
        app.stage.addChild(this.board);
        app.stage.interactive = true;

        if (this.me.isHost) {
            this.setSeed(Math.random());

            channel.send({
                type: "random_seed",
                seed: this.seed,
            } as RandomSeed);
        }

        app.stage.addChild(this.topBar);
        app.stage.addChild(this.bag);

        this.topBar.listen();
        this.bag.listen();

        channel.eventManager.addEventListener("random_seed",  this.onRandomSeed.bind(this));
        channel.eventManager.addEventListener("player_draw",  this.onPlayerDraw.bind(this));
        channel.eventManager.addEventListener("player_place", this.onPlayerPlace.bind(this));

        app.stage.on("mousemove", this.onCursorMove.bind(this));
        app.stage.on("mousedown", this.onCursorClick.bind(this));
        app.stage.on("rightdown", this.onCursorRightClick.bind(this));
    }

    disable() {
        super.disable();

        app.stage.off("mousemove", this.onCursorMove.bind(this));
        app.stage.off("mousedown", this.onCursorClick.bind(this));
        app.stage.off("rightdown", this.onCursorRightClick.bind(this));

        this.topBar.unlisten();
        this.bag.unlisten();

        channel.eventManager.removeEventListener("random_seed",  this.onRandomSeed.bind(this));
        channel.eventManager.removeEventListener("player_draw",  this.onPlayerDraw.bind(this));
        channel.eventManager.removeEventListener("player_place", this.onPlayerPlace.bind(this));
    }
}
