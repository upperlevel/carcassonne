<template>
    <sprite-component
            class="bag"

            :frame="this.frame"
            :atlas-url="this.getAtlasUrl()"
            :atlas-size="this.getAtlasSize()"
            :tint="undefined"

            v-on:mouseover="this.onHover()"
            v-on:mouseleave="this.onLeave()"
    >
    </sprite-component>
</template>

<script lang="ts">
    import Vue from "vue";
    import * as PIXI from "pixi.js"

    import SpriteComponent from "../util/sprite.vue";

    export default Vue.extend({
        data() {
            return {
                frame: "",
            }
        },
        methods: {
            getAtlas(): PIXI.Spritesheet {
                return PIXI.Loader.shared.resources["bag"].spritesheet;
            },

            getAtlasUrl() {
                return "images/bag.png";
            },

            getAtlasSize() {
                return this.getAtlas().baseTexture;
            },

            getBagOpened() {
                return this.getAtlas().textures["bag_opened.png"].orig;
            },

            getBagClosed() {
                return this.getAtlas().textures["bag_closed.png"].orig;
            },

            onHover() {
                console.log("[bag] onHover");
                this.frame = this.getBagOpened();
            },

            onLeave() {
                console.log("[bag] onLeave");
                this.frame = this.getBagClosed();
            }
        },
        components: {
            SpriteComponent
        },
        mounted() {
            this.frame = this.getBagClosed();
        }
    });
</script>

<style scoped>
    .bag {
        width: 100%;
        height: 100%;
    }
</style>