
export class Channel {
    socket: WebSocket;
    packetId: number = 0;
    eventManager: EventTarget = new EventTarget();

    onMessage(event: MessageEvent) {
        const packet = JSON.parse(event.data);
        console.log("Read", packet);
        this.eventManager.dispatchEvent(new CustomEvent("any", {detail: packet}));
        this.eventManager.dispatchEvent(new CustomEvent(packet.type, {detail: packet}));
    }

    constructor(socket: WebSocket) {
        this.socket = socket;
        this.socket.onmessage = (event: MessageEvent) => this.onMessage(event);
    }

    send(packet: any) {
        const wrapped = {
            id: this.packetId,
            ...packet
        };
        console.log("Sent", wrapped);
        this.socket.send(JSON.stringify(wrapped));
        this.packetId++;
    }

    readOnce(type: string | "any", callback: (packet: any) => void) {
        const self = this;
        self.eventManager.addEventListener(type, function (event: CustomEvent)  {
            callback(event.detail);
            self.eventManager.removeEventListener(type, this);
        });
    }

    // Manager
    static instance: Channel;

    static get() {
        return Channel.instance;
    }
}

