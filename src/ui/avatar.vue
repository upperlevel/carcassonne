<template>
    <div>
        <div class="w-100 h-100 text-center" :style="{
            backgroundColor: this.color,
            zIndex: -1
        }">
            <div ref="sprite" class="d-inline-block h-100" :style="getSpriteStyle()"></div>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import * as PIXI from "pixi.js";

    export default Vue.extend({
        props: {
            avatarId: Number,
            color: String,
        },
        methods: {
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
                        backgroundImage: 'url(images/avatars.png)',
                        zIndex: 0
                    }
                }
            },
        },
        mounted() {
            window.addEventListener("resize", this.resizeFrame);
            this.$nextTick(() => {
                this.resizeFrame();
            });
        },
        beforeDestroy() {
            window.removeEventListener("resize", this.resizeFrame);
        }
    });
</script>
