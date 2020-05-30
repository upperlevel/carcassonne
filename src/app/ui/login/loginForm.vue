<template>
    <div class="form">
        <!-- Name -->
        <div class="insert-name">
            <label style="margin-bottom: 7px">Insert your name here:</label>
            <input type="text" v-model="name" spellcheck="false">
        </div>
        <!-- Avatar -->
        <div class="edit-avatar" style="margin-top: 30px">
            <label style="margin-bottom: 7px">Choose your avatar:</label>
            <avatar-editor ref="editor"></avatar-editor>
        </div>
        <!-- Play! -->
        <button class="btn primary-btn" style="margin-top: 30px" v-on:click="submit()" :disabled="!canSubmit()">
            Play!
        </button>
        <!-- Error -->
        <div class="text-error">{{ errorMessage }}</div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import AvatarEditor from "./avatarEditor.vue";
    import FooterComponent from "../footer.vue";

    export default Vue.extend({
        data() {
            return {
                name: "",
                errorMessage: ""
            }
        },
        components: {
            AvatarEditor,
            FooterComponent
        },
        methods: {
            canSubmit() {
                if (this.name.length < 1 || this.name.length > 12 || !/^[a-zA-Z0-9_]*$/.test(this.name))
                    return false;
                return true;
            },

            submit() {
                if (!this.canSubmit())
                    return;
                const editor = this.$refs.editor;
                this.eventEmitter.emit("submit", {
                    username: this.name,
                    color: editor.color,
                    avatar: editor.avatarId,
                });
            }
        }
    });
</script>

<style scoped>
    .form {
        text-align: center;
    }

    label, input[type=text] {
        display: block;
        color: white;
        width: 100%;
    }

    /*
    input[type=text] {
        margin-top: 14px;

        background-color: #593726;
        border: none;
        border-radius: 2px;
        padding: 12px 6px;
        outline: none;
    }*/

    .insert-name {
        display: inline-block;
    }

    .edit-avatar {
        margin-top: 35px;

    }

    .text-error {
        padding-top: 17px;
        padding-bottom: 17px;
    }


</style>
