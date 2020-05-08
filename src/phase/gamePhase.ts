import {Phase} from "./phase";
import {app, channel, me} from "../index";
import * as PIXI from "pixi.js";
import {PlayerDraw, PlayerPlace, RandomSeed} from "../protocol/game";
import {Bag} from "../game/bag";
import {Board} from "../game/board";
import {CardTile} from "../game/cardTile";
import {shuffle} from "../util/array";
import {Card} from "../game/card";

import GameComponent from "../ui/game/game.vue";
import {GamePlayer} from "../game/gamePlayer";
import {ScoreVisualizer} from "../game/particles/scoreVisualizer";

import Vue from "vue";

export class GamePhase extends Phase {
    seed: number;

    bag: Bag;
    board: Board;
    scoreVisualizer: ScoreVisualizer;

    me: GamePlayer;
    playersById: Map<string, GamePlayer> = new Map();
    orderedPlayers: GamePlayer[] = [];

    avatars: Array<PIXI.Container>;
    roundOfIdx: number = -1;
    roundOf: GamePlayer = undefined;

    drawnCard: CardTile;

    lastMouseDownTime?: number;
    lastMouseDownPos?: PIXI.IPoint;

    readonly eventTarget: EventTarget = new EventTarget();

    constructor(playersById: {[id: string]: PlayerObject}) {
        super("game");

        // Prepare Map of GamePlayers by id.
        Object
            .keys(playersById)
            .map(id => {
                const player = new GamePlayer(this, playersById[id]);
                if (player.id === me.id) this.me = player;

                this.playersById.set(player.id, player);
            });

        // The players are sorted by id to make sure all clients has the same list.
        this.orderedPlayers = Array.from(this.playersById.values())
            .sort((a, b) => {
                if (a.id < b.id) return -1;
                if (a.id > b.id) return  1;
                return 0;
            }
        );

        // UI
        let card = this.setupBag();
        this.setupBoard(card);
        this.scoreVisualizer = new ScoreVisualizer(this.orderedPlayers);
    }

    ui() {
        const self = this;
        return new GameComponent({
            data() {
                return {
                    gamePhase: self,
                    myPlayer: self.me,
                    players: self.orderedPlayers,
                }
            },
        })
    }

    // ================================================================================================
    // UI
    // ================================================================================================

    setupBag() {
        this.bag = Bag.fromModality(this,"classical");

        let card = this.bag.draw(); // The first card of the un-shuffled bag is the root.
        this.bag.onCardDraw = this.onDraw.bind(this);
        this.bag.canCardBePlaced = (x) => this.board.getPossiblePlacements(x).length > 0;
        return card;
    }

    setupBoard(initialCard: Card) {
        this.board = new Board(this, this.bag, initialCard);
        this.board.position.set(0, 0);
        this.centerBoard();
        //console.log("BOARD", this.board);
    }

    setSeed(seed: number) {
        this.seed = seed;
        console.log("Game seed:", this.seed);

        shuffle(this.orderedPlayers, this.seed);
        shuffle(this.bag.cards, this.seed);

        this.onStart();
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

    isRoundOf(player: GamePlayer) {
        return this.roundOf && this.roundOf.id == player.id;
    }

    hasDrawn() {
        return this.drawnCard !== undefined;
    }

    /** Goes on with the next round. */
    nextRound() {
        if (this.bag.size() == 0) { // If the bag's empty ends the game.
            this.onEnd();
            return;
        }

        this.roundOfIdx = (this.roundOfIdx + 1) % this.orderedPlayers.length;
        this.roundOf = this.orderedPlayers[this.roundOfIdx];
        this.vue.$forceUpdate();

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
        this.drawnCardSprite.anchor.set(0.5, 0.5);
        this.drawnCardSprite.width = Board.TILE_SIZE;
        this.drawnCardSprite.height = Board.TILE_SIZE;
        this.board.addChild(this.drawnCardSprite);
    }

    /** Function called when another player (that is not me) draws a card. */
    onPlayerDraw(event: CustomEvent) {
        //const packet = event.detail as PlayerDraw;
        const card = this.bag.draw();
        this.onDraw(card);
    }

    // ================================================================================================
    // Place
    // ================================================================================================

    /**
     * Function called when the mouse scrolls.
     * The map is zoomed in and out based on the scroll direction.
     */
    onMouseWheel(event: WheelEvent) {
        const scalingSpeed = 0.1;

        const minScale = 0.1;
        const maxScale = 3;

        const dScale = 1 - Math.sign(event.deltaY) * scalingSpeed;

        //console.log("Scale", this.board.scale.x, this.board.scale.y, "dScale", dScale);
        if (this.board.scale.x < minScale && dScale < 1 || this.board.scale.x > maxScale && dScale > 1)
            return;

        // Before scaling adjust the position:
        // Takes the vector that goes from the board position (upper-left) to the cursor.
        // Apply the dScale factor to that vector and find the new board position.
        // Finally, the cursor position plus the vector obtained is the new board position.

        let padX = this.board.position.x - event.clientX;
        let padY = this.board.position.y - event.clientY;

        padX *= dScale;
        padY *= dScale;

        this.board.position.x = padX + event.clientX;
        this.board.position.y = padY + event.clientY;

        // Now we can set the scale.

        this.board.scale.x *= dScale;
        this.board.scale.y *= dScale;
    }

    /** Function called when the cursor moves around the map. */
    onCursorMove(event: PIXI.interaction.InteractionEvent) {
        //console.log("[Stage] onCursorMove");
        if (this.drawnCardSprite) {
            this.updateDrawnCard(event)
        }
    }

    onCursorDown(event: PIXI.interaction.InteractionEvent) {
        this.lastMouseDownTime = Date.now();
        this.lastMouseDownPos = event.data.global.clone();
    }

    onCursorUp(event: PIXI.interaction.InteractionEvent) {
        if (this.lastMouseDownTime === undefined) return;

        let now = Date.now();

        let timeDiff = now - this.lastMouseDownTime;

        let diffX = Math.abs(event.data.global.x - this.lastMouseDownPos.x);
        let diffY = Math.abs(event.data.global.y - this.lastMouseDownPos.y);
        let diffPos = Math.sqrt(diffX*diffX + diffY*diffY);

        let isClick = diffPos < 5 && timeDiff < 500;
        if (isClick) this.onCursorClick(event);
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
        this.drawnCard.rotation = rotation;
        if (!this.board.set(x, y, this.drawnCard))
            return false; // Can't place the card here.
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
        if (!this.onPlace(packet.x, packet.y, packet.rotation)) {
            console.error("Invalid tile set!")// TODO: better error management
        }
    }

    /**
     * Make the board's center and the window's center overlap.
     * This way the initial board position is centered to the root card.
     */
    centerBoard() {
        let boardScreenWidth = app.renderer.width;
        let boardScreenHeight = app.renderer.height;

        let screenMidPointWidth = boardScreenWidth / 2;
        let screenMidPointHeight = boardScreenHeight / 2;

        let boardSize = this.board.gridSide * Board.TILE_SIZE;// Both width and height (they're the same)

        this.board.position.set(screenMidPointWidth - boardSize / 2, screenMidPointHeight - boardSize / 2);
    }

    awardScore(playerId: string, score: number) {
        this.playersById.get(playerId).score += score;
        let anim = this.scoreVisualizer.animateScore(playerId, score);
        anim.zIndex = 50;
        app.stage.addChild(anim);
    }

    enable() {
        super.enable();

        app.renderer.backgroundColor = 0x3e2723; // dark brown

        app.stage = new PIXI.Container();
        app.stage.addChild(this.bag);
        app.stage.addChild(this.board);
        app.stage.interactive = true;

        if (this.me.details.isHost) {
            this.setSeed(Math.random());

            channel.send({
                type: "random_seed",
                seed: this.seed,
            } as RandomSeed);
        }

        app.stage.addChild(this.bag);

        this.bag.listen();
        this.scoreVisualizer.enable();

        channel.eventManager.addEventListener("random_seed",  this.onRandomSeed.bind(this));
        channel.eventManager.addEventListener("player_draw",  this.onPlayerDraw.bind(this));
        channel.eventManager.addEventListener("player_place", this.onPlayerPlace.bind(this));

        app.stage.on("mousemove", this.onCursorMove.bind(this));
        app.stage.on("mousedown", this.onCursorDown.bind(this));
        app.stage.on("mouseup", this.onCursorUp.bind(this));
        app.stage.on("rightdown", this.onCursorRightClick.bind(this));

        window.addEventListener("wheel", this.onMouseWheel.bind(this));
    }

    disable() {
        super.disable();

        app.stage.off("mousemove", this.onCursorMove.bind(this));
        app.stage.off("mousedown", this.onCursorDown.bind(this));
        app.stage.off("mouseup", this.onCursorUp.bind(this));
        app.stage.off("rightdown", this.onCursorRightClick.bind(this));

        this.scoreVisualizer.disable();
        this.bag.unlisten();

        channel.eventManager.removeEventListener("random_seed",  this.onRandomSeed.bind(this));
        channel.eventManager.removeEventListener("player_draw",  this.onPlayerDraw.bind(this));
        channel.eventManager.removeEventListener("player_place", this.onPlayerPlace.bind(this));

        window.removeEventListener("wheel", this.onMouseWheel.bind(this));
    }
}
