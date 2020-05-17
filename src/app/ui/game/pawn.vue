<template>
    <div
            :style="getImageStyle()"
            v-on:click="onClick"
    ></div>
</template>

<script lang="ts">
    import Vue from "vue";

    import SpriteComponent from "../util/sprite.vue";

    export default Vue.extend({
        props: [
            "pawnImage",
        ],
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

            onClick() {
                this.eventEmitter.emit("pawn-pick", this);
            },

            getImageStyle() {
                return {
                    backgroundImage: `url(${this.pawnImage})`,
                    backgroundSize: '100%',
                }
            }
        },
        components: {
            SpriteComponent
        },
    });
</script>

<style scoped>
</style>