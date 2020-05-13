<template>
    <div>
        <sprite-component
                class="bag-sprite"

                :frame="this.frame"
                :atlas-url="this.getAtlasUrl()"
                :atlas-size="this.getAtlasSize()"
                tint="transparent"

                v-on:mouseover.native="onOver"
                v-on:click.native="onClick"
                v-on:mouseleave.native="onLeave"
        >
        </sprite-component>
        <div class="bag-text">
            {{ this.cards.length }}
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import * as PIXI from "pixi.js"

    import SpriteComponent from "../util/sprite.vue";

    import BagImg from "Public/images/bag.png";

    export default Vue.extend({
        props: [
            'cards'
        ],
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
                return BagImg;
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

            onOver() {
                this.eventEmitter.emit("bag-over", this);
            },

            onClick() {
                this.eventEmitter.emit("bag-click", this);
            },

            onLeave() {
                this.eventEmitter.emit("bag-leave", this);
            }
        },
        components: {
            SpriteComponent
        },
        mounted() {
            this.frame = this.getBagClosed(); // By default the bag is closed.
        }
    });
</script>

<style scoped>
    .bag-sprite {
        width: 250px;
        height: 250px;
    }

    .bag-text {
        text-align: center;

        font-weight: bold;
        color: white;
        margin-top: -52px;
    }

</style>