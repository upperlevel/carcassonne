<template>
    <div class="how-to-play">
        <h2 style="margin-bottom: 15px">How to play Carcassonne?</h2>
        <p>
            The game is divided in turns.
            <br>
            Every turn the player has to draw a card from the bag and place it on the map where possible.
            After placing the card, the player can decide to own the structure formed (a village or a road) by placing a pawn on it.
            <br>
            If the structure was already owned by another player, this can't be done.
            After closing a structure, the players that have the highest number of pawns within it will receive the same amount of points.
            <br>
            The game ends when the bag's empty and the winner is the player that scored higher points.
        </p>

        <div style="margin-top: 15px; text-align: center">
            <small>1/1</small>
        </div>
    </div>
</template>

<script>
    export default {
        name: "howToPlay.vue"
    }
</script>

<style scoped>
    .how-to-play {
        text-align: justify;

        background-color: #faf8f0;
        color: black;
    }
</style>