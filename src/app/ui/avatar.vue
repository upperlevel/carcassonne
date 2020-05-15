<template>
    <div>
        <div class="sprite-background" :style="{
            backgroundColor: colorToStr(this.color),
            zIndex: -1
        }">
            <div ref="sprite" class="sprite" :style="getSpriteStyle()"></div>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import * as PIXI from "pixi.js";
    import {windowEventEmitter} from "../index";

    import AvatarsImg from "Public/images/avatars.png";

    export default Vue.extend({
        props: {
            avatarId: Number,
            color: Number,
        },
        methods: {
            colorToStr(color: number) {
                return `
                    rgb(
                        ${(color >> 16) & 0xff},
                        ${(color >> 8) & 0xff},
                        ${color & 0xff}
                    )
                `;
            },

            /**
             * Resizes the frame to maintain aspect ratio.
             * The width is calculated based on the height, that fits the container.
             *
             * This function has to be called every time the window resizes.
             */
            resizeFrame() {
                const sprite = this.getSprite().orig;
                const width = sprite.width / sprite.height * this.$refs.sprite.clientHeight;
                this.$refs.sprite.style.width = width + "px";
            },

            getSprite() {
                const spritesheet = PIXI.Loader.shared.resources["avatars"].spritesheet;
                return spritesheet.textures["avatar_" + this.avatarId + ".png"];
            },

            /**
             * Takes the Sprite out of the atlas and calculates the CSS properties in order to visualize it.
             * This function has to be called only when avatarId changes.
             */
            getSpriteStyle() {
                const sprite = this.getSprite();
                if (!sprite) {
                    return {};
                } else {
                    const frame = sprite.orig;
                    const base = sprite.baseTexture;

                    const bgSize = {
                        x: base.width / frame.width * 100,
                        y: base.height / frame.height * 100
                    };

                    const bgPos = {
                        x: frame.x / (base.width - frame.width + Number.EPSILON) * 100,
                        y: frame.y / (base.height - frame.height + Number.EPSILON) * 100
                    };

                    return {
                        backgroundPosition: `${bgPos.x}% ${bgPos.y}%`,
                        backgroundSize: `${bgSize.x}% ${bgSize.y}%`,
                        backgroundImage: 'url(' + AvatarsImg + ')',
                        zIndex: 0
                    }
                }
            },
        },
        mounted() {
            windowEventEmitter.on("resize", this.resizeFrame, this);
            this.$nextTick(() => {
                this.resizeFrame();
            });
        },
        beforeDestroy() {
            windowEventEmitter.off("resize", this.resizeFrame, this);
        }
    });
</script>

<style scoped>
    .sprite-background {
        width: 100%;
        height: 100%;
        text-align: center;
    }

    .sprite {
        display: inline-block;
        height: 100%;
    }

</style>
