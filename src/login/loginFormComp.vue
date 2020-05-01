<template>
    <div style="width: 100%; text-align: center">
        <div>
            <label>Name:</label>
            <input type="text" v-model="name">
        </div>
        <div>
            <label>Avatar:</label>
            <avatar-chooser ref="avatarChooser"></avatar-chooser>
        </div>
        <div>
            <label>Color:</label>
            <div>
                <input type="color" v-model="color">
            </div>
        </div>
        <div style="text-align: center">
            <button v-on:click="onSubmit()">Submit</button>
            <div>{{ errorMessage }}</div>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

import AvatarChooser from "./avatarChooserComp.vue";

@Component({
    components: {
        "avatar-chooser": AvatarChooser
    }
})
export default class LoginFormComponent extends Vue {
    name: string = "";
    color: string = "";
    errorMessage: string = "There was an error during login WHOOOPS! <3";

    onSubmit() {
        console.log("Submitting...");
        console.log("Name", this.name);
        console.log("AvatarChooser", this.$refs.avatarChooser);
    }
}
</script>
