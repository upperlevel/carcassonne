

export class CardTile {
    card: Card;
    rotation: number;

    constructor(card: Card) {
        this.card = card;
    }

    getSide(side: Side): SideType {
        switch (side % Side.size) {
            case Side.LEFT: return this.card.sides.left;
            case Side.RIGHT: return this.card.sides.right;
            case Side.BOTTOM: return this.card.sides.bottom;
            case Side.TOP: return this.card.sides.top;
        }
    }

    isCompatible(side: Side, placedCard: CardTile): boolean {
        return this.getSide(side) == placedCard.getSide(side + 2)
    }
}
