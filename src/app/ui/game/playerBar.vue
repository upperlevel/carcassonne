<template>
    <div class="player-bar">
        <div v-for="player in players" class="player" :style="player.isMyRound() ? {backgroundColor: 'rgba(255, 255, 0, 0.25)'} : {backgroundColor: 'rgba(0, 0, 0, 0.25)'}">
            <avatar-component
                    class="avatar"
                    style="height: 85px"
                    :avatarId="player.details.avatar"
                    :color="player.details.color"
            ></avatar-component>
            <div>
                <div class="name" :style="{textDecoration: player.online ? 'none' : 'line-through'}">
                    {{ player.username }}
                </div>
                <div class="score">
                    {{ player.score }}
                </div>
                <div>
                    <div v-for="pawn in player.pawns" :key="pawn" class="pawn">
                        <svg height="14" width="14">
                            <circle cx="7" cy="7" r="6" stroke="black" stroke-width="1" :fill="`#${(`00000${(player.color | 0).toString(16)}`).substr(-6)}`" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import AvatarComponent from "../avatar.vue"
    import PawnComponent from "./pawn.vue";

    export default Vue.extend({
        props: [
            'players',
            'roundOf'
        ],
        components: {
            AvatarComponent,
            PawnComponent
        },
    })
</script>

<style scoped>
    .player-bar {
        text-align: center;
        padding: 13px;

        pointer-events: none;
    }

    .player {
        text-align: center;
        display: inline-block;

        padding: 13px;
        border-radius: 5px;

        text-shadow: 1px 0 0 black, -1px 0 0 black, 0 1px 0 black, 0 -1px 0 black, 1px 1px black, -1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black;

        margin-right: 13px;

        pointer-events: auto;
    }

    .player .name {
        font-size: 14px;
        padding-top: 5px;
    }

    .player .score {
        font-size: 34px;
    }

    .player .pawn {
        display: inline-block;
    }
</style>