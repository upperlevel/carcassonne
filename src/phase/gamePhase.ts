import {Phase} from "./phase";
import {app, channel, me} from "../index";
import * as PIXI from "pixi.js";
import {
    NextRound,
    PlayerDraw,
    PlayerPlaceCard,
    PlayerPlaceCardPreview,
    PlayerPlacePawn,
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
import {PawnPlacer, PawnOwner} from "../game/pawnPlacer";
import {PathAnimationScheduler} from "../game/particles/pathAnimationScheduler";
import {CardPlaceAssistant} from "../game/particles/cardPlaceAssistant";

export class GamePhase extends Phase {
    seed: number;

    gameBar: GameBar;
    bag: Bag;
    board: Board;
    scoreVisualizer: ScoreVisualizer;
    cardPlaceAssistant: CardPlaceAssistant;

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

    placedCard: {x: number, y: number, tile: CardTile};

    pawnPicked: PIXI.Sprite;
    pawnPlacer: PawnPlacer;

    lastMouseDownTime?: number;
    lastMouseDownPos?: PIXI.IPoint;

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

        this.pawnPlacer = new PawnPlacer(this);

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
        this.bag = Bag.fromModality(this,"classical");

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
            channel.send({ type: "next_round" } as NextRound);
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

    /** Function called when the game finishes (the bag goes out of cards). */
    onEnd() {
        console.log("Game ended.");
        this.board.cardConnector.onGameEnd();
        this.board.onGameEnd();
        // TODO show ranking
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
    onPlayerDraw(event: CustomEvent) {
        //const packet = event.detail as PlayerDraw;
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
        if (this.drawnCardSprite && this.isMyRound()) {
            this.updateDrawnCardWithMouse(event)
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

        this.placedCard = {x: x,  y: y, tile: this.drawnCard};

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
    onPlayerPlaceCard(event: CustomEvent) {
        const packet = event.detail as PlayerPlaceCard;
        if (!this.playersById.get(packet.sender).isMyRound()) {
            console.error("Wrong message sender");
            return;
        }
        if (!this.onPlace(packet.x, packet.y, packet.rotation)) {
            console.error("Invalid tile set!")// TODO: better error management
        }
    }

    /** Function called when another player (that is not me) is moving the card to place.*/
    onPlayerPlaceCardPreview(event: CustomEvent) {
        const packet = event.detail as PlayerPlaceCardPreview;
        if (!this.playersById.get(packet.sender).isMyRound()) {
            console.error("Wrong message sender");
            return;
        }
        this.drawnCard.rotation = packet.rotation;
        this.updateDrawnCard(packet.x, packet.y);
    }

    /** Function called when another player (that is not me) places a card.*/
    onPlayerPlacePawn(event: CustomEvent) {
        const packet = event.detail as PlayerPlacePawn;
        let player = this.playersById.get(packet.sender);
        if (!player.isMyRound()) {
            console.error("Wrong message sender");
            return;
        }

        player.pawns--;
        this.createPawn(this.placedCard.x, this.placedCard.y);

        let pos = new PIXI.Point(packet.pos.x, packet.pos.y);

        if (packet.side == "monastery") {
            this.pawnPlacer.placeMonastery(player, this.placedCard, pos);
        } else {
            this.pawnPlacer.placeSide(player, this.placedCard, pos, packet.side);
        }
    }

    onNextRoundPacket(event: CustomEvent) {
        const packet = event.detail as PlayerPlacePawn;
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

    undoPawnPick() {
        this.board.removeChild(this.pawnPicked);
        this.pawnPicked = undefined;
        this.me.pawns++; // This will place back the pawn on the HTML container.

        this.board.removeChild(this.pawnPlacer);

        this.roundState = RoundState.PawnPick;
    }

    pickPawn(event: MouseEvent) {
        if (this.roundState != RoundState.PawnPick || this.me.pawns <= 0)
            return;

        this.roundState = RoundState.PawnPlace;
        this.me.pawns--;

        this.createPawn(event.clientX, event.clientY);

        // Spawns the grid that helps during pawn placement.
        this.pawnPlacer.serveTo(this.placedCard, this.me);
        this.pawnPlacer.zIndex = 10000;
        this.board.addChild(this.pawnPlacer);
    }

    createPawn(x: number, y: number) {
        // Spawns the PIXI pawn to attach to the cursor.
        const pawn = this.roundOf.createPawn();
        pawn.zIndex = 101;
        pawn.position.set(x, y);
        this.board.addChild(pawn);

        this.pawnPicked = pawn;
    }

    returnPawn(player: string, count?: number) {
        this.playersById.get(player).pawns += count || 1;
    }

    onPawnMove(event: PIXI.interaction.InteractionEvent) {
        const pawn = this.pawnPicked;
        if (pawn) {
            const cursor = event.data.getLocalPosition(this.board, null, event.data.global);
            pawn.position.set(cursor.x, cursor.y);
        }
    }

    onPawnPlace(emplacement: PIXI.Point, owner: PawnOwner) {
        this.pawnPicked.position.copyFrom(emplacement);
        owner.addPawn(this.pawnPicked);
        this.pawnPicked = undefined;

        this.board.removeChild(this.pawnPlacer);

        // TURN END
        // TODO: send packet
        this.nextRound();
    }

    /**
     * Function issued when a pawn is picked from the HTML container.
     */
    onPawnInteract(event: MouseEvent) {
        // If it's my round and I've already placed the card I can interact with pawns.
        if (!this.placedCard || !this.isMyRound())
            return;

        if (this.pawnPicked) {
            this.undoPawnPick();
        } else {
            this.pickPawn(event);
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
        this.scoreVisualizer.animateScore(playerId, score, app.stage);
    }

    enable() {
        super.enable();

        app.renderer.backgroundColor = 0x3e2723; // dark brown

        // PIXI
        app.stage = new PIXI.Container();

        app.stage.addChild(this.board);
        app.stage.interactive = true;

        this.gameBar.zIndex = 1;
        app.stage.addChild(this.gameBar);

        if (this.me.details.isHost) {
            this.setSeed(Math.random());

            channel.send({
                type: "random_seed",
                seed: this.seed,
            } as RandomSeed);
        }

        this.bag.listen();
        this.scoreVisualizer.enable();

        channel.eventManager.addEventListener("random_seed",  this.onRandomSeed.bind(this));
        channel.eventManager.addEventListener("player_draw",  this.onPlayerDraw.bind(this));
        channel.eventManager.addEventListener("player_place_card", this.onPlayerPlaceCard.bind(this));
        channel.eventManager.addEventListener("player_place_card_preview", this.onPlayerPlaceCardPreview.bind(this));
        channel.eventManager.addEventListener("player_place_pawn", this.onPlayerPlacePawn.bind(this));
        channel.eventManager.addEventListener("next_round", this.onNextRoundPacket.bind(this));

        app.stage.on("mousemove", this.onCursorMove.bind(this));
        app.stage.on("mousedown", this.onCursorDown.bind(this));
        app.stage.on("mouseup", this.onCursorUp.bind(this));
        app.stage.on("rightdown", this.onCursorRightClick.bind(this));

        window.addEventListener("wheel", this.onMouseWheel.bind(this));
        window.addEventListener("resize", this.onResize.bind(this));

        this.vEventHandler.$on("pawn-interact", this.onPawnInteract.bind(this));
        this.vEventHandler.$on("next-round", this.onNextRoundClick.bind(this));
        app.stage.on("mousemove", this.onPawnMove.bind(this));
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
        channel.eventManager.removeEventListener("player_place_card", this.onPlayerPlaceCard.bind(this));
        channel.eventManager.removeEventListener("player_place_card_preview", this.onPlayerPlaceCardPreview.bind(this));
        channel.eventManager.removeEventListener("player_place_pawn", this.onPlayerPlacePawn.bind(this));
        channel.eventManager.removeEventListener("next_round", this.onNextRoundPacket.bind(this));

        window.removeEventListener("wheel", this.onMouseWheel.bind(this));
        window.removeEventListener("resize", this.onResize.bind(this));

        this.vEventHandler.$off("pawn-interact", this.onPawnInteract.bind(this));
        this.vEventHandler.$off("next-round", this.onNextRoundClick.bind(this));
    }
}

export enum RoundState {
    CardDraw,
    CardPlace,
    PawnPick,
    PawnPlace,
}

class CardPreviewManager {
    phase: GamePhase;

    private lastX: number = 0;
    private lastY: number = 0;
    private lastRot: number = 0;

    private nextX: number = 0;
    private nextY: number = 0;
    private nextRot: number = 0;

    private timeoutId?: number;

    static PACKET_UPDATE_FREQ = 50;

    onUpdate(x: number, y: number, rot: number) {
        this.nextX = x;
        this.nextY = y;
        this.nextRot = rot;
        this.trySend();
    }

    onPlace() {
        clearTimeout(this.timeoutId)
    }

    private startTimer() {
        this.timeoutId = setTimeout(this.onTimerEnd.bind(this), CardPreviewManager.PACKET_UPDATE_FREQ);
    }

    private onTimerEnd() {
        this.timeoutId = undefined;
        this.trySend();
    }

    private trySend() {
        if (this.timeoutId !== undefined) return;
        if (this.lastX === this.nextX && this.lastY === this.nextY && this.lastRot === this.nextRot) return;
        channel.send({
            type: "player_place_card_preview",
            x: this.nextX,
            y: this.nextY,
            rotation: this.nextRot,
        } as PlayerPlaceCardPreview);
        this.lastX = this.nextX;
        this.lastY = this.nextY;
        this.lastRot = this.nextRot;
        this.startTimer();
    }
}
