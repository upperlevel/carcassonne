<template>
    <div>
        <div class="arrow">
            <button v-on:click="onPrev()"><</button>
        </div>
        <div ref="preview" class="preview" :style="
            'background-position: ' + -frame.x + 'px ' + -frame.y + 'px;' +
            'background-image: url(images/avatars.png);'
        ">
        </div>
        <div class="arrow">
            <button v-on:click="onNext()">></button>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from "vue-class-component";

import * as PIXI from "pixi.js";

@Component
export default class AvatarChooserComponent extends Vue {
    id: number = 1;
    frame: {x: number, y: number} = { x: 0, y: 0 };

    setId(value: number) {
        const spritesheet = PIXI.Loader.shared.resources["avatars"].spritesheet;
        const texture = spritesheet.textures["avatar_" + value + ".jpg"];
        if (texture) {
            this.frame = texture.orig;
            this.id = value;
        }
    }

    onPrev() {
        this.setId(this.id - 1);
    }

    onNext() {
        this.setId(this.id + 1);
    }
}
</script>

<style>
    .arrow {
        display: inline-block;
    }

    .preview {
        display: inline-block;

        width: 250px;
        height: 250px;
    }
</style>
