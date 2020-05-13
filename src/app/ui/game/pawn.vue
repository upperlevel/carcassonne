<template>
    <sprite-component
            :frame="this.getFrame()"
            :atlas-url="this.getAtlasUrl()"
            :atlas-size="this.getAtlasSize()"
            :tint="this.colorToStr(this.color)"

            v-on:click.native="onClick"

    ></sprite-component>
</template>

<script lang="ts">
    import Vue from "vue";
    import * as PIXI from "pixi.js"

    import SpriteComponent from "../util/sprite.vue";

    import PawnsImg from "Public/images/pawns.png";

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
                return PawnsImg;
            },

            getAtlasSize() {
                return this.getAtlas().baseTexture;
            },

            colorToStr(color: number) {
                return `
                    rgb(
                        ${(color >> 16) & 0xff},
                        ${(color >> 8) & 0xff},
                        ${color & 0xff}
                    )
                `;
            },

            onClick() {
                this.eventEmitter.emit("pawn-pick", this); // TODO Never listened
            }
        },
        components: {
            SpriteComponent
        },
    });
</script>

<style scoped>
</style>