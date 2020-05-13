import {channel} from "../../index";
import {PlayerPlaceCardPreview} from "../../protocol/game";

export class CardPreviewManager {
    private lastX: number = 0;
    private lastY: number = 0;
    private lastRot: number = 0;

    private nextX: number = 0;
    private nextY: number = 0;
    private nextRot: number = 0;

    private timeoutId?: any;

    static PACKET_UPDATE_FREQ = 75;

    onUpdate(x: number, y: number, rot: number) {
        this.nextX = x;
        this.nextY = y;
        this.nextRot = rot;
        this.trySend();
    }

    onPlace() {
        clearTimeout(this.timeoutId)
        this.timeoutId = undefined;
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
