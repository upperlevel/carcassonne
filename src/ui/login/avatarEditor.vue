<template>
    <div class="container-fluid">
        <div class="row">
            <div class="col">
                <div class="input-group" style="max-width: 500px">
                    <div class="input-group-prepend">
                        <button v-on:click="prevAvatar()">
                            <
                        </button>
                    </div>
                    <avatar-component
                            style="height: 250px"
                            class="avatar form-control"
                            :avatar-id="avatarId" :color="parseInt(color.substr(1), 16)">
                    </avatar-component>
                    <div class="input-group-append">
                        <button v-on:click="nextAvatar()">
                            >
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col form-group">
                <label>Color:</label>
                <input class="form-control" type="color" v-on:input="color = $event.target.value">
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue"
    import AvatarComponent from "../avatar.vue";

    import * as PIXI from "pixi.js"

    export default Vue.extend({
        data() {
            return {
                avatarId: 1,
                color: "#000000",
            }
        },
        components: {
            AvatarComponent
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
