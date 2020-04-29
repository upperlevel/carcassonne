

export class CardTile {
    card: Card;
    rotation: number;

    constructor(card: Card) {
        this.card = card;
    }

    isCompatible(side: Side, placedCard: CardTile): boolean {
        // TODO
        return false;
    }
}
