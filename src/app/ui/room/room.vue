<template>
    <div class="phase-container">
        <div class="title-container">
            <h1 class="title">Carcassonne</h1>
            <div v-if="this.playersCount() < 2" style="color: #B2FF59">
                Invite friends to play Carcassonne with you, the minimum number of players requested to start is 2.
            </div>
            <div class="text-primary" v-else>
                <div v-if="this.me.isHost">
                    When you're ready press start!
                </div>
                <div class="text-info" v-else>
                    Only the guy with the underlined name can start.
                </div>
            </div>
        </div>

        <div style="text-align: center;">
            Players: {{ this.playersCount() }}
        </div>

        <div class="invite-container">
            <button class="btn-sm primary-btn" v-on:click="onCopyInviteLink">Copy invite link</button>
            <small v-if="inviteLinkCopied">Copied to clipboard!</small>
        </div>

        <div class="player-container">
            <div v-for="player of Object.values(this.playersById)" class="player">
                <avatar-component class="player-avatar" :avatar-id="player.avatar" :color="player.color"></avatar-component>
                <div class="player-name" :style="getNameStyle(player)">
                    {{ player.username }}
                </div>
                <div class="player-name" v-if="player.id === me.id" :style="getNameStyle(player)">
                    (You)
                </div>
            </div>
        </div>
        <div class="start-container" v-if="this.me.isHost">
            <button class="btn primary-btn" :disabled="!canStart()" v-on:click="onStart">Start</button>
        </div>

        <footer-component></footer-component>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import AvatarComponent from "../avatar.vue";
    import FooterComponent from "../footer.vue";

    export default Vue.extend({
        data() {
            return {
                inviteLinkCopied: false
            }
        },
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

            canStart() {
                return this.me.isHost && this.playersCount() > 1;
            },

            onStart() {
                this.eventEmitter.emit('start');
            },

            onCopyInviteLink() {
                const link = window.location.href;
                navigator.clipboard.writeText(link);
                this.inviteLinkCopied = true;
            }
        }
    });
</script>

<style scoped>
    .invite-container {
        text-align: center;
        padding-top: 15px;
        padding-bottom: 15px;
    }

    .player-container {
        text-align: center;
        padding-top: 15px;
        padding-bottom: 15px;
    }

    .player {
        display: inline-block;
        vertical-align: top;

        text-align: center;

        background-color: rgba(0, 0, 0, 0.25);
        border-radius: 5px;

        padding-top: 10px;
        padding-bottom: 10px;

        margin-left: 15px;
        margin-right: 15px;

        width: 140px;
        max-width: 140px;

        height: 170px;
        max-height: 170px;
    }

    .player-avatar {
        display: inline-block;
        width: 120px;
        height: 120px;
    }

    .player-name {
        text-shadow: 1px 0 0 black, -1px 0 0 black, 0 1px 0 black, 0 -1px 0 black, 1px 1px black, -1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black;
    }

    .start-container {
        text-align: center;
        margin-bottom: 100px;
    }
</style>
