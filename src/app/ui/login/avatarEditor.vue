<template>
    <div>
        <div class="avatar">
            <button class="btn secondary-btn back" v-on:click="prevAvatar()"><</button>

            <avatar-component class="preview" :avatar-id="avatarId" :color="this.color"></avatar-component>

            <button class="btn secondary-btn next" v-on:click="nextAvatar()">></button>
        </div>
        <div class="color-pool">
            <color-pool-component v-model="color"></color-pool-component>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue"
    import AvatarComponent from "../avatar.vue";
    import ColorPoolComponent from "./colorPool.vue"

    import * as PIXI from "pixi.js"

    export default Vue.extend({
        data() {
            return {
                avatarId: 1,
                color: 0xd50000,
            }
        },
        components: {
            AvatarComponent,
            ColorPoolComponent
        },
        methods: {
            verifyAvatarId(id: number) {
                const spritesheet = PIXI.Loader.shared.resources["avatars"].spritesheet;
                const texture = spritesheet.textures["avatar_" + id + ".png"];
                return texture !== undefined;
            },

            prevAvatar() {
                if (this.verifyAvatarId(this.avatarId - 1))
                    this.avatarId--;
            },

            nextAvatar() {
                if (this.verifyAvatarId(this.avatarId + 1))
                    this.avatarId++;
            },
        },
    });
</script>

<style scoped>

    .avatar {
        height: 250px;
    }

    .avatar .preview {
        display: inline-block;
        height: 100%;
    }

    .avatar .back, .next {
        display: inline-block;
        height: 100%;
        vertical-align: top;
        width: 50px;
    }

    .avatar .back {
        border-top-left-radius: 3px;
        border-bottom-left-radius: 3px;
    }

    .avatar .next {
        border-top-right-radius: 3px;
        border-bottom-right-radius: 3px;
    }

    .color-pool {
        margin-top: 25px;
    }

</style>
