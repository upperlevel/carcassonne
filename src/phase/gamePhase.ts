import {Phase} from "./phase";
import {app, channel, stage, windowEventEmitter} from "../index";
import * as PIXI from "pixi.js";
import {
    EndGameAck,
    NextRound,
    PlayerDraw,
    PlayerLeft,
    PlayerPlaceCard,
    PlayerPlaceCardPreview,
    RandomSeed
} from "../protocol/game";
import {Bag} from "../game/bag";
import {Board} from "../game/board";
import {CardTile} from "../game/cardTile";
import {shuffle} from "../util/array";
import {Card} from "../game/card";

import GameComponent from "../ui/game/game.vue";
import {GamePlayer} from "../game/gamePlayer";
import {ScoreVisualizer} from "../game/particles/scoreVisualizer";
import {GameBar} from "../game/gameBar";
import {PathAnimationScheduler} from "../game/particles/pathAnimationScheduler";
import {CardPlaceAssistant} from "../game/particles/cardPlaceAssistant";
import {RoomPhase} from "./roomPhase";
import {PawnPlaceManager} from "../game/particles/pawnPlaceManager";
import {CardPreviewManager} from "../game/particles/cardPreviewManager";

export class GamePhase extends Phase {
    seed: number;

    gameBar: GameBar;
    bag: Bag;
    board: Board;
    scoreVisualizer: ScoreVisualizer;
    cardPlaceAssistant: CardPlaceAssistant;

    roomId: string;
    me: GamePlayer;
    playersById: Map<string, GamePlayer> = new Map();
    orderedPlayers: GamePlayer[] = [];

    avatars: Array<PIXI.Container>;
    roundOfIdx: number = -1;
    roundOf: GamePlayer = undefined;
    roundState: RoundState = RoundState.CardDraw;

    pathAnimationScheduler: PathAnimationScheduler;
    drawnCard: CardTile;
    drawnCardPreview: CardPreviewManager;

    placedCard: { x: number, y: number, tile: CardTile };
    pawnManager: PawnPlaceManager;

    lastMouseDownTime?: number;
    lastMouseDownPos?: PIXI.IPoint;

    isScoreBoardVisible: boolean;
    lobbyCountdown: number;
    winner: GamePlayer;

    constructor(roomId: string, me: PlayerObject, playersById: { [id: string]: PlayerObject }) {
        super("game");
        this.roomId = roomId;

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
                    if (a.id > b.id) return 1;
                    return 0;
                }
            );

        this.pawnManager = new PawnPlaceManager(this);

        // UI
        this.pathAnimationScheduler = new PathAnimationScheduler(this);
        this.drawnCardPreview = new CardPreviewManager();
        this.gameBar = new GameBar();
        let card = this.setupBag();
        this.setupBoard(card);
        this.scoreVisualizer = new ScoreVisualizer(this.orderedPlayers);
        this.cardPlaceAssistant = new CardPlaceAssistant(this);
    }

    ui() {
        const self = this;
        return new GameComponent({
            data() {
                return {
                    gamePhase: self,
                    myPlayer: self.me,
                    players: self.orderedPlayers,
                    roundState: self.roundState,
                    showScoreBoard: false,
                }
            },
        })
    }

    // ================================================================================================
    // UI
    // ================================================================================================

    onResize() {
        this.gameBar.redraw();
    }

    setupBag() {
        this.bag = Bag.fromModality(this, "classical");

        return this.bag.draw(); // The first card of the un-shuffled bag is the root.
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

    onRandomSeed(packet: RandomSeed) {
        if (!this.seed) {
            this.setSeed(packet.seed);
            return;
        }
        console.error("Seed received but there was already another seed set.");
    }

    onPlayerLeft(packet: PlayerLeft) {
        if (packet.newHost !== undefined) {
            this.playersById.get(packet.newHost).details.isHost = true;
            if (packet.newHost == this.me.id && !this.seed) {
                // Well, it's my job now
                this.generateSeed();
            }
        }
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

    canSkipRound(): boolean {
        switch (this.roundState) {
            case RoundState.CardDraw:
            case RoundState.CardPlace:
                return false;
            case RoundState.PawnPick:
            case RoundState.PawnPlace:
                return true;
        }
    }

    hasDrawn() {
        return this.drawnCard !== undefined;
    }

    hasPlaced() {
        return this.placedCard !== undefined;
    }

    onNextRoundClick() {
        if (this.isMyRound() && this.canSkipRound()) {
            this.pawnManager.undoPawnPick();
            channel.send({type: "next_round"} as NextRound);
            this.nextRound();
        }
    }

    nextRound() {
        let hasNextRound = this.bag.size() != 0;// If the bag's empty ends the game.

        // Process paths closes.
        if (this.placedCard !== undefined) {
            this.board.onRoundEnd(this.placedCard.x, this.placedCard.y, !hasNextRound);
        }

        // Reset all of the round-relative variables.
        this.drawnCard = undefined;
        this.placedCard = undefined;

        if (!hasNextRound) {
            this.onEnd();
            return;
        }

        // Update the round to the next player.
        this.roundOfIdx = (this.roundOfIdx + 1) % this.orderedPlayers.length;
        this.roundOf = this.orderedPlayers[this.roundOfIdx];

        console.log("Round of:", this.roundOf.username);

        this.roundState = RoundState.CardDraw;

        if (this.isMyRound()) {
            console.log("It's your round!");
        }

        this.vue.$forceUpdate();
    }

    drawnCardSprite: PIXI.Sprite; // TODO temp

    // ================================================================================================
    // Draw
    // ================================================================================================

    /** Function issued when any player draws a card. */
    onDraw() {
        if (this.isMyRound()) {
            // Notify the other players that a card has been drawn.
            channel.send({
                type: "player_draw",
            } as PlayerDraw);
        }

        let card, tiles;

        do {
            card = this.bag.draw();
            if (card === undefined) {
                this.onEnd();
                return;
            }
            tiles = this.board.getPossiblePlacements(card);
        } while (tiles.length == 0);

        this.roundState = RoundState.CardPlace;
        this.drawnCard = new CardTile(card);

        this.drawnCardSprite = this.drawnCard.createSprite();
        this.drawnCardSprite.anchor.set(0.5, 0.5);
        this.drawnCardSprite.width = Board.TILE_SIZE;
        this.drawnCardSprite.height = Board.TILE_SIZE;
        this.board.addChild(this.drawnCardSprite);
        this.cardPlaceAssistant.enable(tiles);
    }

    /** Function called when another player (that is not me) draws a card. */
    onPlayerDraw(packet: PlayerDraw) {
        this.onDraw();
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
        if (this.isMyRound()) {
            if (this.drawnCardSprite) {
                this.updateDrawnCardWithMouse(event)
            }
            if (this.roundState == RoundState.PawnPlace) {
                this.pawnManager.onPawnMove(event);
            }
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
        let diffPos = Math.sqrt(diffX * diffX + diffY * diffY);

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
            this.updateDrawnCardWithMouse(event)
        }
    }

    updateDrawnCardWithMouse(event: PIXI.interaction.InteractionEvent) {
        let pos = event.data.getLocalPosition(this.board, null, event.data.global);
        this.board.containerCoordsToTileCoords(pos, pos);
        this.drawnCardPreview.onUpdate(pos.x, pos.y, this.drawnCard.rotation);
        this.updateDrawnCard(pos.x, pos.y);
    }

    updateDrawnCard(posX: number, posY: number) {
        let canSet = this.board.canSet(posX, posY, this.drawnCard);
        let pos = new PIXI.Point();
        this.board.cardCoordToRelPos(posX, posY, pos);
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

        this.cardPlaceAssistant.disable();
        this.roundState = RoundState.PawnPick;
        this.board.removeChild(this.drawnCardSprite);

        this.placedCard = {x: x, y: y, tile: this.drawnCard};

        this.drawnCard = undefined;
        this.drawnCardSprite = undefined;

        this.vue.$forceUpdate();

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
            type: "player_place_card",
            x: x,
            y: y,
            rotation: rotation,
        } as PlayerPlaceCard);
        return true;
    }

    /** Function called when another player (that is not me) places a card.*/
    onPlayerPlaceCard(packet: PlayerPlaceCard) {
        if (!this.playersById.get(packet.sender).isMyRound()) {
            console.error("Wrong message sender");
            return;
        }
        if (!this.onPlace(packet.x, packet.y, packet.rotation)) {
            console.error("Invalid tile set!")// TODO: better error management
        }
    }

    /** Function called when another player (that is not me) is moving the card to place.*/
    onPlayerPlaceCardPreview(packet: PlayerPlaceCardPreview) {
        if (!this.playersById.get(packet.sender).isMyRound()) {
            console.error("Wrong message sender");
            return;
        }
        this.drawnCard.rotation = packet.rotation;
        this.updateDrawnCard(packet.x, packet.y);
    }

    onNextRoundPacket(packet: NextRound) {
        let player = this.playersById.get(packet.sender);
        if (!player.isMyRound()) {
            console.error("Wrong message sender");
            return;
        }
        if (!this.canSkipRound()) {
            console.error("Invalid round state: " + this.roundState);
            return;
        }
        this.nextRound();
    }


    // ================================================================================================================================
    // After-place
    // ================================================================================================================================

    returnPawn(player: string, count?: number) {
        this.playersById.get(player).pawns += count || 1;
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
        this.scoreVisualizer.animateScore(playerId, score, app.stage);
    }

    // ================================================================================================================================
    // Score-board
    // ================================================================================================================================

    getScoreBoard() {
        const players = Object.assign([], this.orderedPlayers);
        return players.sort((a, b) => {
            return b.score - a.score;
        });
    }

    setScoreBoardVisible(visible: boolean) {
        this.isScoreBoardVisible = visible;
        this.vue.$forceUpdate();
    }

    onScoreBoardKeyDown(event: KeyboardEvent) {
        if (this.roundState === RoundState.GameEnd)
            return;
        if (event.key === "Tab") {
            this.setScoreBoardVisible(true);
            event.preventDefault(); // Prevent focusing browser's address bar.
        }
    }

    onScoreBoardKeyUp(event: KeyboardEvent) {
        if (this.roundState === RoundState.GameEnd)
            return;
        if (event.key === "Tab") {
            this.setScoreBoardVisible(false);
        }
    }

    // ================================================================================================================================
    // Ending
    // ================================================================================================================================

    onEnd() {
        this.winner = this.getScoreBoard()[0];

        this.roundState = RoundState.GameEnd;
        this.vue.$forceUpdate();

        this.board.cardConnector.onGameEnd();
        this.board.onGameEnd();

        this.setScoreBoardVisible(true);

        this.lobbyCountdown = 20;
        let handle = setInterval(() => {
            if (--this.lobbyCountdown <= 0) {
                clearInterval(handle);

                channel.send({
                    "type": "end_game"
                }, true);
                channel.eventEmitter.once("special_end_game_ack", (packet: EndGameAck) => {
                    stage.setPhase(new RoomPhase(this.roomId, this.me.details, packet.players));
                });
            }
            this.vue.$forceUpdate();

        }, 1000);
    }

    generateSeed() {
        this.setSeed(Math.random());

        channel.send({
            type: "random_seed",
            seed: this.seed,
        } as RandomSeed);
    }

    enable() {
        super.enable();

        document.body.appendChild(app.view);

        app.renderer.backgroundColor = 0x3e2723; // dark brown

        // PIXI
        app.stage = new PIXI.Container();

        app.stage.addChild(this.board);
        app.stage.interactive = true;

        this.gameBar.zIndex = 1;
        app.stage.addChild(this.gameBar);

        if (this.me.details.isHost) {
            this.generateSeed();
        }

        this.bag.listen();
        this.scoreVisualizer.enable();
        this.pawnManager.enable();

        channel.eventEmitter.on("random_seed", this.onRandomSeed, this);
        channel.eventEmitter.on("player_draw", this.onPlayerDraw, this);
        channel.eventEmitter.on("player_place_card", this.onPlayerPlaceCard, this);
        channel.eventEmitter.on("player_place_card_preview", this.onPlayerPlaceCardPreview, this);
        channel.eventEmitter.on("special_player_left", this.onPlayerPlaceCardPreview, this);
        channel.eventEmitter.on("next_round", this.onNextRoundPacket, this);

        app.stage.on("mousemove", this.onCursorMove, this);
        app.stage.on("mousedown", this.onCursorDown, this);
        app.stage.on("mouseup", this.onCursorUp, this);
        app.stage.on("rightdown", this.onCursorRightClick, this);

        windowEventEmitter.on("wheel", this.onMouseWheel, this);
        windowEventEmitter.on("resize", this.onResize, this);
        windowEventEmitter.on("keydown", this.onScoreBoardKeyDown, this);
        windowEventEmitter.on("keyup", this.onScoreBoardKeyUp, this);

        this.uiEventEmitter.on("next-round", this.onNextRoundClick, this);
    }

    disable() {
        super.disable();

        app.stage.off("mousemove", this.onCursorMove, this);
        app.stage.off("mousedown", this.onCursorDown, this);
        app.stage.off("mouseup", this.onCursorUp, this);
        app.stage.off("rightdown", this.onCursorRightClick, this);

        this.pawnManager.disable();
        this.scoreVisualizer.disable();
        this.bag.unlisten();

        channel.eventEmitter.off("random_seed", this.onRandomSeed, this);
        channel.eventEmitter.off("player_draw", this.onPlayerDraw, this);
        channel.eventEmitter.off("player_place_card", this.onPlayerPlaceCard, this);
        channel.eventEmitter.off("player_place_card_preview", this.onPlayerPlaceCardPreview, this);
        channel.eventEmitter.off("next_round", this.onNextRoundPacket, this);

        windowEventEmitter.off("wheel", this.onMouseWheel, this);
        windowEventEmitter.off("resize", this.onResize, this);
        windowEventEmitter.off("keydown", this.onScoreBoardKeyDown, this);
        windowEventEmitter.off("keyup", this.onScoreBoardKeyUp, this);

        this.uiEventEmitter.off("next-round", this.onNextRoundClick, this);

        document.body.removeChild(app.view);
    }
}

export enum RoundState {
    CardDraw,
    CardPlace,
    PawnPick,
    PawnPlace,

    GameEnd,
}

