import {GamePhase, RoundState} from "../../phase/gamePhase";
import {app, channel} from "../../index";
import {PlayerPawnInteract, PlayerPawnPlace, PlayerPawnPreview} from "../../protocol/game";
import * as PIXI from "pixi.js";
import {PawnOwner, PawnPlacer} from "../pawnPlacer";

const PACKET_UPDATE_FREQ = 50;

export class PawnPlaceManager {
    readonly phase: GamePhase;
    readonly placer: PawnPlacer;
    readonly previewServer: PawnPreviewServer;
    readonly previewClient: PawnPreviewClient;

    pawn: PIXI.Sprite;

    constructor(phase: GamePhase) {
        this.phase = phase;
        this.placer = new PawnPlacer(this, phase);
        this.previewServer = new PawnPreviewServer();
        this.previewClient = new PawnPreviewClient(this, phase);
    }

    onPawnInteract(event: MouseEvent) {
        if (!this.phase.isMyRound()) return;
        let state = this.phase.roundState;

        if (state == RoundState.PawnPlace) {
            // pawn already picked, remove it
            this.undoPawnPick();
        } else if (state == RoundState.PawnPick) {
            let bpos = this.phase.board.position;
            this.pawnPick(bpos.x + event.clientX, bpos.y + event.clientY);
        }
    }

    onPawnMove(event: PIXI.interaction.InteractionEvent) {
        if (this.phase.me.isMyRound() && this.pawn !== undefined) {
            const cursor = event.data.getLocalPosition(this.phase.board, null, event.data.global);
            this.pawn.position.set(cursor.x, cursor.y);
            this.previewServer.onUpdate(cursor.x, cursor.y);
        }
    }

    undoPawnPick() {
        this.phase.board.removeChild(this.pawn);
        this.pawn = undefined;
        this.phase.roundOf.pawns++; // This will place back the pawn on the HTML container.

        this.phase.board.removeChild(this.placer);

        this.phase.roundState = RoundState.PawnPick;

        if (this.phase.isMyRound()) {
            this.previewServer.cancel();
            channel.send({
                type: "player_pawn_interact",
                pickUp: false,
            } as PlayerPawnInteract);
        }
    }

    pawnPick(posX: number, posY: number) {
        if (this.phase.roundOf.pawns <= 0) return;

        this.phase.roundState = RoundState.PawnPlace;
        this.phase.roundOf.pawns--;

        this.createPawn(posX, posY);

        // Spawns the grid that helps during pawn placement.
        this.placer.serveTo(this.phase.placedCard, this.phase.roundOf);
        this.placer.zIndex = 10000;
        this.phase.board.addChild(this.placer);

        if (this.phase.isMyRound()) {
            channel.send({
                type: "player_pawn_interact",
                pickUp: true,
                x: posX,
                y: posY,
            } as PlayerPawnInteract);
        }
    }

    createPawn(x: number, y: number) {
        // Spawns the PIXI pawn to attach to the cursor.
        const pawn = this.phase.roundOf.createPawn();
        pawn.zIndex = 101;
        pawn.position.set(x, y);
        this.phase.board.addChild(pawn);

        this.pawn = pawn;
    }

    private onPlacePacket(packet: PlayerPawnPlace) {
        let player = this.phase.playersById.get(packet.sender);
        if (!player.isMyRound()) {
            console.error("Wrong message sender");
            return;
        }

        if (this.previewClient.pawn === undefined) {// No preview sent, recreate the pawn
            player.pawns--;
            this.createPawn(packet.pos.x, packet.pos.y);
        }

        let pos = new PIXI.Point(packet.pos.x, packet.pos.y);

        if (packet.side == "monastery") {
            this.placer.placeMonastery(player, this.phase.placedCard, pos);
        } else {
            this.placer.placeSide(player, this.phase.placedCard, pos, packet.side);
        }
    }

    onPawnPlace(emplacement: PIXI.Point, owner: PawnOwner) {
        this.pawn.position.copyFrom(emplacement);
        owner.addPawn(this.pawn);
        this.pawn = undefined;
        this.phase.board.removeChild(this.placer);
        this.previewClient.onPlace();

        // TURN END
        this.phase.nextRound();
    }

    enable() {
        this.previewClient.enable();

        channel.eventEmitter.on("player_pawn_place",  this.onPlacePacket, this);

        this.phase.uiEventEmitter.on("pawn-interact", this.onPawnInteract, this);
    }

    disable () {
        this.previewClient.disable();

        channel.eventEmitter.off("player_pawn_place",  this.onPlacePacket, this);

        this.phase.uiEventEmitter.off("pawn-interact", this.onPawnInteract, this);
    }
}


class PawnPreviewServer {
    phase: GamePhase;

    private lastX: number = 0;
    private lastY: number = 0;

    private nextX: number = 0;
    private nextY: number = 0;

    private timeoutId?: any;

    onUpdate(x: number, y: number) {
        this.nextX = x;
        this.nextY = y;
        this.trySend();
    }

    cancel() {
        clearTimeout(this.timeoutId)
        this.timeoutId = undefined;
    }

    private startTimer() {
        this.timeoutId = setTimeout(this.onTimerEnd.bind(this), PACKET_UPDATE_FREQ);
    }

    private onTimerEnd() {
        this.timeoutId = undefined;
        this.trySend();
    }

    private trySend() {
        if (this.timeoutId !== undefined) return;
        if (this.lastX === this.nextX && this.lastY === this.nextY) return;
        channel.send({
            type: "player_pawn_preview",
            x: this.nextX,
            y: this.nextY,
        } as PlayerPawnPreview);
        this.lastX = this.nextX;
        this.lastY = this.nextY;
        this.startTimer();
    }
}

class PawnPreviewClient {
    readonly parent: PawnPlaceManager;
    readonly phase: GamePhase;

    pawn?: PIXI.Sprite = undefined;

    private lastX: number = 0;
    private lastY: number = 0;

    private nextX: number = 0;
    private nextY: number = 0;

    private receiveTime: number = 0;

    constructor(parent: PawnPlaceManager, phase: GamePhase) {
        this.parent = parent;
        this.phase = phase;
    }

    onPlace() {
        this.pawn = undefined;
        this.receiveTime = 0;
        app.ticker.remove(this.onTick, this);
    }

    private onPreviewPacket(packet: PlayerPawnPreview) {
        let player = this.phase.playersById.get(packet.sender);
        if (!player.isMyRound()) {
            console.error("Wrong sender");
            return;
        }

        if (this.receiveTime == 0) {
            this.pawn.position.set(packet.x, packet.y);
            this.lastX = packet.x;
            this.lastY = packet.y;
        } else {
            this.lastX = this.pawn.position.x;
            this.lastY = this.pawn.position.y;
        }
        this.receiveTime = Date.now();

        this.nextX = packet.x;
        this.nextY = packet.y;
    }

    private onInteractPacket(packet: PlayerPawnInteract) {
        let player = this.phase.playersById.get(packet.sender);
        if (!player.isMyRound()) {
            console.error("Wrong sender");
            return;
        }

        let curr = this.pawn !== undefined;
        if (packet.pickUp == curr) return;

        if (packet.pickUp) {// Pick up
            if (this.phase.roundState !== RoundState.PawnPick) {
                console.error("Invalid round state");
                return
            }
            this.parent.pawnPick(packet.x, packet.y);
            this.pawn = this.parent.pawn;
            app.ticker.add(this.onTick, this)
        } else {
            if (this.phase.roundState !== RoundState.PawnPlace) {
                console.error("Invalid round state");
                return
            }
            this.onPlace();// reset the pawn position & such
            this.parent.undoPawnPick();
            app.ticker.remove(this.onTick, this);
        }
    }

    private onTick() {
        let now = Date.now();
        let perc = Math.min((now - this.receiveTime) / PACKET_UPDATE_FREQ, 1);

        let posX = this.lastX * (1 - perc) + this.nextX * perc;
        let posY = this.lastY * (1 - perc) + this.nextY * perc;

        this.pawn.position.set(posX, posY);
    }


    enable() {
        channel.eventEmitter.on("player_pawn_preview",  this.onPreviewPacket, this);
        channel.eventEmitter.on("player_pawn_interact",  this.onInteractPacket, this);
    }

    disable () {
        channel.eventEmitter.off("player_pawn_preview",  this.onPreviewPacket, this);
        channel.eventEmitter.off("player_pawn_interact",  this.onInteractPacket, this);
    }
}
