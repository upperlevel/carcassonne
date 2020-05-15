<template>
    <div class="container">
        <!-- Name -->
        <div class="insert-name">
            <label>Insert your name here:</label>
            <input type="text" v-model="name" spellcheck="false">
        </div>
        <!-- Avatar -->
        <div class="edit-avatar">
            <label>Choose your avatar:</label>
            <avatar-editor ref="editor" class="avatar-editor"></avatar-editor>
        </div>
        <!-- Play! -->
        <button class="play" v-on:click="submit()" :disabled="!canSubmit()">
            Play!
        </button>
        <!-- Error -->
        <div>{{ errorMessage }}</div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import AvatarEditor from "./avatarEditor.vue";

    export default Vue.extend({
        data() {
            return {
                name: "",
                errorMessage: ""
            }
        },
        components: {
            AvatarEditor
        },
        methods: {
            canSubmit() {
                if (this.name.length < 1 || this.name.length > 16 || !/^[a-zA-Z0-9_]*$/.test(this.name))
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
    .container {
        text-align: center;
    }

    label, input[type=text] {
        display: block;
        color: white;
        width: 100%;
    }

    input[type=text] {
        margin-top: 14px;

        background-color: #593726;
        border: none;
        border-radius: 2px;
        padding: 12px 6px;
        outline: none;
    }

    .insert-name {
        display: inline-block;
    }

    .edit-avatar {
        margin-top: 35px;
    }

    .avatar-editor {
        margin-top: 14px;
    }

    .play {
        margin-top: 35px;
        background-color: #ffd324;
        border: none;
        outline: none;
        padding: 15px;
    }

    .play:hover {
        background-color: #ffe666;
        cursor: pointer;
    }

</style>
