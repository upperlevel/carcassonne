<template>
    <div class="footer">
        <div class="credits">
            <div class="links">
                <a href="https://github.com/upperlevel/carcassonne" target="_blank">
                    <img alt="" src="" class="github">
                </a>
            </div>
            <small>
                Developed by <a href="https://github.com/upperlevel" target="_blank" class="upperlevel">Upperlevel</a>
            </small>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";

    export default Vue.extend({
    });
</script>

<style scoped>

    .footer {
    }

    .credits {
        text-align: right;
        padding: 20px;
    }

    .github {
        width: auto;
        height: 32px;
        content: url("~Public/images/GitHub-Mark-Light-32px.png");
    }

    .github:hover {
        opacity: 0.5;
    }

    .upperlevel:hover {
        opacity: 0.5;
    }

</style>
