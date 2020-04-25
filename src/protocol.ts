interface PlayerObject {
    id?: number,
    name: string,
    color: number,
    strokeColor: number,
}

interface Login extends Event {
    id: number,
    type: "login",
    username: "username",
}

interface LoginResponse extends Event {
    id: number,
    type: "login_response",
    request_id: number,
    result: string,
    player_id?: number,
}

interface EventPlayerJoin extends Event {
    id: number,
    type: "event_player_joined",
    player: PlayerObject
}

interface EventPlayerLeft extends Event {
    id: number,
    type: "event_player_left",
    player: PlayerObject
}
