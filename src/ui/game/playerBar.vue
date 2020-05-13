<template>
    <div class="player-bar">
        <div v-for="player in players" class="player">
            <avatar-component
                    style="height: 85px"
                    :avatarId="player.details.avatar"
                    :color="player.details.color"
            ></avatar-component>
            <div :class="player.isMyRound() ? 'round-of-marker' : ''">
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
        text-align: center;
        background-color: darkgray;
        border-bottom: 3px solid dimgray;
    }

    .round-of-marker {
        border-bottom: 3px solid red;
    }

    .player-name {
        font-size: 12px;
        font-weight: bold;
    }

    .player-description {
        font-size: 10px;
    }

    .player {
        text-align: center;
        display: inline-block;
    }
</style>