<template>
    <div class="game">
        <!-- PlayerBar -->
        <player-bar-component
                :players="this.players"
                class="player-bar"
        >
        </player-bar-component>

        <!-- GameBar -->
        <game-bar-component
                class="game-bar"

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

    export default Vue.extend({
        components: {
            PlayerBarComponent,
            GameBarComponent
        },
    });
</script>

<style scoped>
    .game {
        user-select: none;
    }

    .game-bar {
        position: absolute;
        bottom: 0;
        width: 100%;
        z-index: 1;
    }

    .player-bar {
        position: absolute;
        top: 0;
        width: 100%;
        z-index: 1;
    }
</style>
