<template>
    <div class="game">
        <player-bar-component class="player-bar" :players="this.players"></player-bar-component>
        <hint-bar-component class="hint" :game-phase="this.gamePhase" :round-of="this.gamePhase.roundOf" :round-state="this.gamePhase.roundState"></hint-bar-component>

        <!------------------------------------------------------------------------------------------------ game-bar -->

        <div class="game-bar" style="text-align: left">
            <!-- Bag -->
            <bag-component class="bag" :cards="this.gamePhase.bag.cards"></bag-component>

            <!-- Pawn container -->
            <div class="pawn-container" v-on:click="onPawnInteract">
                <pawn-component v-for="pawn in this.myPlayer.pawns" :key="pawn"
                                class="pawn"

                                :game-phase="gamePhase"
                                :pawn-image="myPawnImage"
                >
                </pawn-component>
            </div>

            <!-- Next round -->
            <div class="button-bar game-footer">
                <button class="btn primary-btn" v-on:click="onNextRound" :disabled="!canNextRound()">
                    Done!
                </button>
            </div>
        </div>


        <!------------------------------------------------------------------------------------------------ scoreboard -->
        <div class="scoreboard"
            :style="{display: this.gamePhase.isScoreBoardVisible ? 'block' : 'none'}"
        >
            <div v-if="isGameEnd()" class="end">
                <h2 class="winner">The winner is: <span :style="{color: this.gamePhase.winner.details.color}">{{ this.gamePhase.winner.details.username }}</span>!</h2>
                <h6 class="description">Congrats! ฅ^•ﻌ•^ฅ</h6>
                <br>
                <h6 class="countdown">Returning to lobby in: {{ this.gamePhase.lobbyCountdown }} seconds.</h6>
            </div>

            <table>
                <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>Score</th>
                </tr>
                <tr v-for="(player, rank) in this.gamePhase.getScoreBoard()">
                    <th :style="getRankColor(rank + 1)">
                        {{ rank + 1 }}.
                    </th>
                    <td class="username">
                        {{ player.username }}
                    </td>
                    <td>{{ player.score }}</td>
                </tr>
            </table>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";

    import PlayerBarComponent from "./playerBar.vue";
    import BagComponent from "./bag.vue";
    import PawnComponent from "./pawn.vue";
    import HintBarComponent from "./hintBar.vue";

    import {RoundState} from "../../phase/gamePhase";
    import * as PIXI from "pixi.js"
    import hex2rgb = PIXI.utils.hex2rgb;

    import PawnsImg from "Public/images/pawns.png";

    export default Vue.extend({
        /* Passed on initialization.
        data() {
            return {
                gamePhase,
                myPlayer,
                players,
            }
        },
         */
        components: {
            PlayerBarComponent,
            BagComponent,
            PawnComponent,
            HintBarComponent
        },
        mounted: function () {
            this.recomputePawnImage()
        },
        methods: {
            onPawnInteract(event: MouseEvent) {
                this.eventEmitter.emit("pawn-interact", event);
            },

            canNextRound() {
                return this.gamePhase.isMyRound() && this.gamePhase.canSkipRound();
            },

            onNextRound() {
                this.eventEmitter.emit("next-round");
            },


            colorToStr(color: number) {
                return `
                    rgb(
                        ${(color >> 16) & 0xff},
                        ${(color >> 8) & 0xff},
                        ${color & 0xff}
                    )
                `;
            },

            getRankColor(rank: number) {
                switch (rank) {
                    case 1:
                        return {color: "#fdd835"};
                    case 2:
                        return {color: "#bdbdbd"};
                    case 3:
                        return {color: "#a30000"};
                    default:
                        return {color: "white"};
                }
            },

            isGameEnd() {
                return this.gamePhase.roundState === RoundState.GameEnd;
            },

            recomputePawnImage() {
                let fg = new Image();
                fg.src = PawnsImg;

                let onReady = () => {
                    let canvas = document.createElement("canvas");
                    canvas.style.display = "none";

                    let color = this.myPlayer.details.color;

                    let atlas = PIXI.Loader.shared.resources["pawns"].spritesheet;

                    let size = atlas.baseTexture;

                    const name = "pawn_" + this.myPlayer.details.avatar + ".png";
                    const frame = atlas.textures[name].orig;

                    canvas.width = frame.width;
                    canvas.height = frame.height;
                    let ctx = canvas.getContext("2d");

                    ctx.globalCompositeOperation = 'copy';
                    ctx.drawImage(fg, frame.x, frame.y, size.width, size.height, 0, 0, size.width, size.height);

                    const rgbValues = hex2rgb(color);
                    const r = rgbValues[0];
                    const g = rgbValues[1];
                    const b = rgbValues[2];

                    const pixelData = ctx.getImageData(0, 0, size.width, size.height);
                    let pixels = pixelData.data;

                    for (let i = 0; i < pixels.length; i += 4) {
                        pixels[i + 0] *= r;
                        pixels[i + 1] *= g;
                        pixels[i + 2] *= b;
                    }

                    ctx.putImageData(pixelData, 0, 0);
                    console.log(canvas.toDataURL());
                    this.myPawnImage = canvas.toDataURL();
                };

                if (fg.complete) {
                    onReady()
                } else {
                    fg.onload = onReady;
                }
            }
        },
    });
</script>

<style scoped>
    .game {
        user-select: none;
    }

    .hint {
        position: absolute;
        bottom: 105px;
        width: 100%;
        z-index: 40;
        text-align: center;

        pointer-events: none;
    }

    .game-bar {
        position: fixed;
        bottom: 0;
        width: 100%;
        z-index: 25;

        pointer-events: none;
    }

    .player-bar {
        position: fixed;
        top: 0;
        width: 100%;
        z-index: 1;
    }

    .scoreboard {
        position: absolute;

        top: 35%;
        width: 100%;
        text-align: center;

        z-index: 50;

        pointer-events: none;
    }

    .scoreboard table {
        display: inline-block;

        padding: 25px;

        color: white;
        background-color: rgba(0, 10, 18, 0.7);

        border-radius: 15px;
        border: 1px solid #263238;

        pointer-events: none;
    }

    .scoreboard table tr {
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);

        pointer-events: none;
    }

    .scoreboard table tr th {
        padding-left: 15px;
        padding-right: 15px;
    }

    .scoreboard .username {
    }

    .end {
        text-align: center;

        pointer-events: none;
    }

    .end .winner {
        color: gold;
        text-shadow: -1px -1px 0 black, 1px -1px 0 black, -1px  1px 0 black, 1px  1px 0 black;

        pointer-events: none;
    }

    .end .description {
        color: gold;
        text-shadow: -1px -1px 0 black, 1px -1px 0 black, -1px  1px 0 black, 1px  1px 0 black;

        pointer-events: none;
    }

    .end .countdown {
        color: white;
        text-shadow: -1px -1px 0 black, 1px -1px 0 black, -1px  1px 0 black, 1px  1px 0 black;

        pointer-events: none;
    }


    .bag {
        display: inline-block;
        vertical-align: bottom;

        pointer-events: auto;
    }

    .pawn-container {
        display: inline-block;
        vertical-align: bottom;

        width: 140px;
        height: 70px;
        border-top-left-radius: 5px;
        border-top-right-radius: 5px;

        background-color: rgba(0, 0, 0, 0.30);

        pointer-events: auto;
    }

    .pawn {
        display: inline-block;

        width: 28px;
        height: 70px;
    }

    .button-bar {
        text-align: center;

        padding: 20px;

        pointer-events: auto;
    }

</style>
