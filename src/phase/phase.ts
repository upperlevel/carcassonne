
export class Phase {
    name: string;

    div: HTMLDivElement;
    canvas: HTMLCanvasElement | null;

    constructor(name: string) {
        this.name = name;

        this.div = document.getElementById(this.name) as HTMLDivElement;
        this.canvas = document.getElementById(this.name + "Canvas") as HTMLCanvasElement;
    }

    querySelector(query: string) {
        return this.div.querySelector(query);
    }

    enable() {
        console.log(`[${this.name}] Enabling`);
        this.div.style.display = "block";
    }

    disable() {
        console.log(`[${this.name}] Disabling`);
        this.div.style.display = "none";
    }

    resize() {
        console.log(`[${this.name}] Resize`);
        if (this.canvas) {
            this.canvas.width = this.canvas.clientWidth;
            this.canvas.height = this.canvas.clientHeight;
        }
    }

    update(delta: number) {
    }

    render() {
    }
}
