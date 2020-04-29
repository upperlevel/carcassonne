import {Phase} from "./phase";
import {app, channel} from "../index";
import * as PIXI from "pixi.js";
import {PlayerDraw, PlayerPlace, RandomSeed} from "../protocol/game";
import {Bag} from "../game/bag";
import {Board} from "../game/board";
import {CardTile} from "../game/cardTile";
import {shuffle} from "../util/array";

export class GamePhase extends Phase {
    seed: number;

    bag: Bag;
    readonly board: Board;

    me: PlayerObject;
    playersById: Map<string, PlayerObject>;

    orderedPlayers: Array<PlayerObject>;
    avatars: Array<PIXI.Container>;
    roundOfIdx: number = -1;
    roundOf: PlayerObject = undefined;

    drawnCard: CardTile;

    /* UI */
    topBar: PIXI.Container;


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
        this.setupTopBar();
        this.setupBag();
        this.board = new Board(this.bag);
    }

    // ================================================================================================
    // UI
    // ================================================================================================

    setupAvatar(player: PlayerObject) {
        const avatars = PIXI.Loader.shared.resources["avatars"].spritesheet;

        const container = new PIXI.Container();

        const image = new PIXI.Sprite(avatars.textures[player.avatar]);
        container.addChild(image);

        const name = new PIXI.Text(player.username);
        name.anchor.x = 0.5;
        name.position.set(image.width / 2, image.height);
        container.addChild(name);

        const points = new PIXI.Text("0");
        points.anchor.x = 0.5;
        points.position.set(image.width / 2, image.height + name.height);
        container.addChild(points);

        return container;
    }

    setupTopBar() {
        const height = 150;

        this.topBar = new PIXI.Container();

        const background = new PIXI.Graphics();
        background.zIndex = -1;
        background.beginFill(0xe0e0e0);
        background.drawRect(0, 0, app.screen.width, height); // TODO resize
        this.topBar.addChild(background);

        this.avatars = new Array<PIXI.Container>();
        let width = 0;
        for (const player of this.orderedPlayers) {
            const avatar = this.setupAvatar(player);
            avatar.width = (avatar.width / avatar.height) * height;
            avatar.height = height;
            this.topBar.addChild(avatar);

            width += avatar.width;
            this.avatars.push(avatar);
        }

        let x = this.topBar.width / 2 - width / 2;
        for (const avatar of this.avatars) {
            avatar.x = x;
            x += avatar.width;
        }
    }

    setupBag() {
        this.bag = Bag.fromModality("classical");
        this.bag.position.set(0, this.topBar.height);

        const cancelled = () => !this.isMyRound() || this.drawnCard !== undefined;
        this.bag.onClick = cancelled;
        this.bag.onOver  = cancelled;
    }

    setupBoard() {
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
        return this.roundOf && this.roundOf.id == this.me.id;
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

    /** Function issued when any player draws a card. */
    onDraw() {
        this.drawnCard = new CardTile(this.bag.draw());

        const spritesheet = PIXI.Loader.shared.resources["cards"].spritesheet;
        const texture = spritesheet.textures[this.drawnCard.card.spritePath];

        this.drawnCardSprite = new PIXI.Sprite(texture);
        this.drawnCardSprite.anchor.set(0.5);
        app.stage.addChild(this.drawnCardSprite);
    }

    /** Function called when the bag is clicked. */
    onBagClick() {
        if (this.roundOf.id !== this.me.id) // It's not your round!
            return;
        this.onDraw();
        // Notify the other players that a card has been drawn.
        channel.send({
            type: "player_draw",
        } as PlayerDraw);


    }

    /** Function called when another player (that is not me) draws a card. */
    onPlayerDraw(event: CustomEvent) {
        const packet = event.detail as PlayerDraw;
        this.onDraw();
    }

    // ================================================================================================
    // Place
    // ================================================================================================

    /** Function called when the cursor moves around the map. */
    onCursorMove(event: PIXI.interaction.InteractionEvent) {
        console.log("[Stage] onCursorMove");
        if (this.drawnCardSprite) {
            const cursor = event.data.global;
            this.drawnCardSprite.position.set(cursor.x, cursor.y);
        }
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
            return; // Can't place the card here.
        this.nextRound();
    }

    /** Function called when the board is clicked. */
    onBoardClick(x: number, y: number) {
        if (!this.drawnCard || this.roundOf.id !== this.me.id) // Card not drawn or it's not your round.
            return;
        // map.set
        const rotation = this.drawnCard.rotation;
        this.onPlace(x, y, rotation); // Doesn't care of the result.
        channel.send({
            type: "player_place",
            x: x,
            y: y,
            rotation: rotation,
        } as PlayerPlace)
    }

    /** Function called when another player (that is not me) places a card.*/
    onPlayerPlace(event: CustomEvent) {
        const packet = event.detail as PlayerPlace;
        this.onPlace(packet.x, packet.y, packet.rotation);
    }

    enable() {
        super.enable();
        app.stage = new PIXI.Container();
        app.stage.addChild(this.bag);
        app.stage.addChild(this.topBar);

        if (this.me.isHost) {
            this.setSeed(Math.random());

            channel.send({
                type: "random_seed",
                seed: this.seed,
            } as RandomSeed);
        }

        this.bag.listen();

        channel.eventManager.addEventListener("random_seed",  this.onRandomSeed.bind(this));
        channel.eventManager.addEventListener("player_draw",  this.onPlayerDraw.bind(this));
        channel.eventManager.addEventListener("player_place", this.onPlayerPlace.bind(this));
    }

    disable() {
        super.disable();

        app.stage.off("mousemove", this.onCursorMove.bind(this));

        this.bag.unlisten();

        channel.eventManager.removeEventListener("random_seed",  this.onRandomSeed.bind(this));
        channel.eventManager.removeEventListener("player_draw",  this.onPlayerDraw.bind(this));
        channel.eventManager.removeEventListener("player_place", this.onPlayerPlace.bind(this));
    }
}
