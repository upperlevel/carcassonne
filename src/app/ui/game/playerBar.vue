<template>
    <div class="player-bar header">
        <div v-for="player in players" class="player">
            <avatar-component
                    style="height: 85px"
                    :avatarId="player.details.avatar"
                    :color="player.details.color"
            ></avatar-component>
            <div :class="player.isMyRound() ? 'player round-of-marker' : 'player'">
                <div class="player-name" :style="{textDecoration: player.online ? 'none' : 'line-through'}">
                    {{ player.username }}
                </div>
                <div class="player-description">
                    Score: {{ player.score }} <br>
                    Pawns: {{ player.pawns }}
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import AvatarComponent from "../avatar.vue"

    export default Vue.extend({
        props: [
            'players',
            'roundOf'
        ],
        components: {
            AvatarComponent,
        },
    })
</script>

<style scoped>
    .player-bar {
        padding-bottom: 13px;
        text-align: center;
    }

    .round-of-marker {
        border-bottom: 3px solid red;
    }

    .player {
        color: black;
    }

    .player-name {
        font-size: 12px;
    }

    .player-description {
        font-size: 10px;
    }

    .player {
        text-align: center;
        display: inline-block;
    }
</style>