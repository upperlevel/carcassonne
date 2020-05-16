<template>
    <div class="phase-container">
        <div class="title-container">
            <h1 class="title">Carcassonne</h1>
        </div>

        <div style="text-align: center">Players: {{ this.playersCount() }}</div>

        <div class="player-container"> <!-- PlayerObject[] -->
            <div v-for="player of Object.values(this.playersById)" class="player">
                <!-- Avatar -->
                <avatar-component
                        class="player-avatar"

                        :avatar-id="player.avatar"
                        :color="player.color">
                </avatar-component>
                <!-- Name -->
                <div class="player-name" :style="getNameStyle(player)">
                    {{ getName(player) }}
                </div>
            </div>
        </div>
        <div v-if="this.me.isHost" style="text-align: center">
            <button class="primary-btn" :disabled="!canStart()" v-on:click="onStart">Start</button>
        </div>

        <footer-component></footer-component>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import AvatarComponent from "../avatar.vue";
    import FooterComponent from "../footer.vue";

    export default Vue.extend({
        components: {
            AvatarComponent,
            FooterComponent
        },
        methods: {
            playersCount() {
                return Object.keys(this.playersById).length;
            },

            getNameStyle(player: PlayerObject) {
                const isMe = player.id === this.me.id;
                return {
                    color: isMe ? 'yellow' : 'white',
                    textDecoration: player.isHost ? 'underline' : 'none',
                }
            },

            getName(player: PlayerObject) {
                return player.username + (player.id === this.me.id ? " (You)" : "");
            },

            canStart() {
                return this.me.isHost && this.playersCount() > 1;
            },

            onStart() {
                this.eventEmitter.emit('start');
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
