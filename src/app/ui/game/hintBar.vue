<template>
    <div class="hint">
        <div v-if="roundOf === undefined">
        </div>
        <div v-else-if="!gamePhase.isMyRound()" class="other-round">
            <div v-if="roundOf.online" class="online">
                It's the turn of: <span :style="{color: `#${(`00000${(roundOf.color | 0).toString(16)}`).substr(-6)}`}">{{ roundOf.username }}</span>.
            </div>
            <div v-else class="offline">
                Trying to contact <span :style="{color:`#${(`00000${(roundOf.color | 0).toString(16)}`).substr(-6)}`}">{{ roundOf.username }}</span>...
            </div>
        </div>
        <div v-else class="my-round">
            <div v-if="roundState === RoundState.CardDraw" class="card-draw">
                Yo! It's your turn, <u>draw a card</u>.
            </div>
            <div v-if="roundState === RoundState.CardPlace" class="card-place">
                <u>Place the card</u> on the board.
            </div>
            <div v-if="roundState === RoundState.PawnPick" class="pawn-pick">
                <u>Skip</u> the round or <u>pick a pawn</u>.
            </div>
            <div v-if="roundState === RoundState.PawnPlace" class="pawn-place">
                <u>Place the pawn</u> within the card you've placed.
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {RoundState} from "../../phase/gamePhase";

    export default Vue.extend({
        props: [
            'gamePhase',
            'roundOf',
            'roundState'
        ],
        data() {
            return {
                RoundState: RoundState
            }
        },
    });
</script>

<style scoped>
    .hint {
        text-shadow: -1px -1px 0 black, 1px -1px 0 black, -1px  1px 0 black, 1px  1px 0 black;
    }

    .hint .other-round {
        color: red;
    }

    .hint .my-round {
        color: yellow;
    }

    .hint .my-round .card-draw {
        font-size: 30px;
        text-transform: uppercase;
    }
</style>
