<template>
    <div class="game-bar">
        <!--
        The game-bar is composed of a part made with PIXI.js,
        that is where we'll place the pawns and the bag,
        and a part which is fixed.
        -->
        <bag-component
                class="bag"

                :cards="gamePhase.bag.cards"
        >
        </bag-component>
        <div class="pawn-container">
            <pawn-component v-for="pawn in pawns" :key="pawn"
                            class="pawn"

                            :game-phase="gamePhase"
                            :pawn-id="player.details.avatar"
                            :color="player.details.color"
            >
            </pawn-component>
        </div>
        <div class="fixed">
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";

    import BagComponent from "./bag.vue";
    import PawnComponent from "./pawn.vue";

    export default Vue.extend({
        props: [
            "gamePhase",
            "pawns",
            "player",
        ],
        components: {
            BagComponent,
            PawnComponent
        },
    });
</script>

<style scoped>
    .game-bar {
        pointer-events: none;
    }

    .bag {
        display: inline-block;

        margin-bottom: -30px;

        pointer-events: auto;
    }

    .pawn-container {
        display: inline-block;

        width: 140px;
        height: 70px;
    }

    .pawn {
        display: inline-block;

        width: 28px;
        height: 70px;

        pointer-events: auto;
    }

    .game-bar .fixed {
        height: 50px;
        background-color: #6d4c41;

        pointer-events: auto;
    }
</style>