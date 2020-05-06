<template>
    <div class="game-bar">
        <pawn-component v-for="pawn in pawns" :key="pawn"
                class="pawn"

                :pawn-id="player.details.avatar"
                :color="player.details.color"
        >
        </pawn-component>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import PawnComponent from "./pawn.vue";

    export default Vue.extend({
        props: [
            "pawns",
            "player",
        ],
        components: {
            PawnComponent
        },
    });
</script>

<style scoped>
    .game-bar {
        background-color: #6d4c41;
        border-top: 1px solid #9c786c;
    }

    .pawn {
        display: inline-block;

        width: 28px;
        height: 70px;
    }
</style>