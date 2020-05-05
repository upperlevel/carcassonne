<template>
    <div>
        <player-bar-component
                :players="this.players"
                class="player-bar">
        </player-bar-component>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import PlayerBarComponent from "./playerBar.vue";

    export default Vue.extend({
        components: {
            PlayerBarComponent
        },
    });
</script>

<style scoped>
    .player-bar {
        position: absolute;
        top: 0;
        width: 100%;
        z-index: 1;
    }
</style>
