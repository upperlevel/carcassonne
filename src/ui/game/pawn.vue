<template>
    <sprite-component
            :frame="this.getFrame()"
            :atlas-url="this.getAtlasUrl()"
            :atlas-size="this.getAtlasSize()"
            :tint="this.colorToHex(this.color)"

            v-on:click.native="onClick"

    ></sprite-component>
</template>

<script lang="ts">
    import Vue from "vue";
    import * as PIXI from "pixi.js"

    import SpriteComponent from "../util/sprite.vue";

    export default Vue.extend({
        props: [
            "pawnId",
            "color",
        ],
        methods: {
            getAtlas(): PIXI.Spritesheet {
                return PIXI.Loader.shared.resources["pawns"].spritesheet;
            },

            getFrame() {
                const name = "pawn_" + this.pawnId + ".png";
                return this.getAtlas().textures[name].orig;
            },

            getAtlasUrl() {
                return "images/pawns.png";
            },

            getAtlasSize() {
                return this.getAtlas().baseTexture;
            },

            colorToHex(color: number) {
                return "#" + color.toString(16);
            },

            onClick() {
                this.$eventHub.$emit("pawn-pick", this);
            }
        },
        components: {
            SpriteComponent
        },
    });
</script>

<style scoped>
</style>