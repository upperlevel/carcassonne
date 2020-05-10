import {RoundState} from "../../phase/gamePhase";
import {RoundState} from "../../phase/gamePhase";
<template>
    <div class="game">
        <!-- PlayerBar -->
        <player-bar-component
                class="player-bar"

                :players="this.players"
        >
        </player-bar-component>

        <!-- ActionBar -->
        <div class="hint-bar" v-html="getRoundStateHint()">
        </div>

        <!-- GameBar -->
        <game-bar-component
                class="game-bar"

                :game-phase="this.gamePhase"
                :pawns="this.myPlayer.pawns"
                :player="this.myPlayer"
        >
        </game-bar-component>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";

    import PlayerBarComponent from "./playerBar.vue";
    import GameBarComponent from "./gameBar.vue";
    import {RoundState} from "../../phase/gamePhase";

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
            GameBarComponent
        },
        methods: {
            colorToStr(color: number) {
                return `
                    rgb(
                        ${(color >> 16) & 0xff},
                        ${(color >> 8) & 0xff},
                        ${color & 0xff}
                    )
                `;
            },

            getRoundStateHint() {
                if (this.gamePhase.isMyRound()) {
                    switch (this.gamePhase.roundState) {
                        case RoundState.CardDraw:
                            return `<h4 style="color: yellow">Yo! It's your turn, <u>draw a card</u>.</h4>`;
                        case RoundState.CardPlace:
                            return `<h4 style="color: yellow"><u>Place the card</u> on the board.</h4>`;
                        case RoundState.PawnPick:
                            return `<h4 style="color: yellow"><u>Skip</u> the round or <u>pick a pawn</u>.</h4>`;
                        case RoundState.PawnPlace:
                            return `<h4 style="color: yellow"><u>Place the pawn</u> within the card you've placed.</h4>`;
                    }
                }
                const roundOf = this.gamePhase.roundOf;
                const roundOfColor = this.colorToStr(roundOf.color);
                return `<h4 style="color: red">It's the turn of: <span style="color: ${roundOfColor}">${roundOf.username}</span>.</h4>`;
            }
        }
    });
</script>

<style scoped>
    .game {
        user-select: none;
    }

    .hint-bar {
        position: absolute;

        bottom: 80px;
        width: 100%;

        z-index: 10;

        pointer-events: none;

        text-align: center;
        text-shadow: -1px -1px 0 black, 1px -1px 0 black, -1px  1px 0 black, 1px  1px 0 black;
    }

    .game-bar {
        position: absolute;
        bottom: 0;
        width: 100%;
        z-index: 25;
    }

    .player-bar {
        position: absolute;
        top: 0;
        width: 100%;
        z-index: 1;
    }
</style>
