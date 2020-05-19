<template>
    <div class="footer">
        <div class="credits">
            <div class="links">
                <a href="https://github.com/upperlevel/carcassonne" target="_blank" class="github"></a>
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
    .credits {
        text-align: right;
        padding: 20px;
    }

    .github {
        display: inline-block;
        width: 32px;
        height: 32px;
        background-image: url("~Public/images/GitHub-Mark-Light-32px.png");
    }

    .github:hover {
        opacity: 0.5;
    }

    .upperlevel {
        color: white;
    }

    .upperlevel:hover {
        opacity: 0.5;
    }

</style>
