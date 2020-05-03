<template>
    <div style="margin-top: 25px">
        <div style="text-align: center">
            <h1>Carcassonne</h1>
            <h6>
                Room: <code>{{ roomId }}</code>
            </h6>
            <div>
                <small>Players: {{ players.length }}</small>
            </div>
        </div>
        <div class="player-container"> <!-- PlayerObject[] -->
            <div v-for="player in players" class="player">
                <!-- Avatar -->
                <avatar-component
                        class="player-avatar"

                        :avatar-id="player.avatar"
                        :color="hexColor(player.color)">
                </avatar-component>
                <!-- Name -->
                <h4 class="player-name" :style="getNameStyle(player)">
                    {{ getName(player) }}
                </h4>
            </div>
        </div>
        <div style="text-align: center">
            <button :disabled="!canStart()" v-on:click="$emit('start')">Start</button>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import AvatarComponent from "../avatar.vue";
    import {me} from "../../index";

    export default Vue.extend({
        data() {
            return {
                roomId: "",
                players: [] // PlayerObject[]
            }
        },
        components: {
            AvatarComponent
        },
        methods: {
            hexColor(color: number) {
                return "#" + (color as number).toString(16);
            },

            getNameStyle(player: PlayerObject) {
                const isMe = player.id === me.id;
                return {
                    color: isMe ? 'yellow' : 'white',
                    textShadow: `
                        -1px -1px 0 black,
                         1px -1px 0 black,
                        -1px  1px 0 black,
                         1px  1px 0 black
                    `,
                    textDecoration: player.isHost ? 'underline' : 'none',
                }
            },

            getName(player: PlayerObject) {
                return player.username + (player.id === me.id ? " (You)" : "");
            },

            canStart() {
                return me.isHost && this.players.length > 1;
            }
        }
    });
</script>

<style scoped>
    .player-container {
        text-align: center;
    }

    .player {
        display: inline-block;
        padding: 25px;
    }

    .player-avatar {
        height: 250px;
    }

    .player-name {
        margin-top: 25px;
    }
</style>
