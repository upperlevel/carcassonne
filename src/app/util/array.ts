
// https://github.com/yixizhang/seed-shuffle
export function shuffle<T>(array: Array<T>, seed: number) {
    let currentIndex = array.length, temporaryValue, randomIndex;
    seed = seed || 1;
    let random = function () {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    };
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
        // Pick a remaining element...
        randomIndex = Math.floor(random() * currentIndex);
        currentIndex -= 1;
        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    return array;
}
