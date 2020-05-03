<template>
    <div>
        <div>
            <label>Name:</label>
            <input type="text" v-model="name">
        </div>
        <div style="margin-top: 25px">
            <avatar-editor ref="editor"></avatar-editor>
        </div>
        <div>
            <button v-on:click="submit()" :disabled="!canSubmit()">Submit</button>
            <div>{{ errorMessage }}</div>
        </div>
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
                this.$emit("submit", {
                    username: this.name,
                    color: parseInt(editor.color.substr(1), 16),
                    avatar: editor.avatarId,
                });
            }
        }
    });
</script>
