
interface Login {
    id: number,
    type: "login",
    details: PlayerObject,
}

interface LoginResponse {
    id: number,
    type: "login_response",
    requestId: number,
    result: string,
    playerId?: string,
}

interface RoomCreate {
    id?: number,
    type: "room_create",
}

interface RoomCreateResponse {
    id: number,
    type: "room_create_response",
    requestId: number,
    result: string,
    players?: PlayerObject[],
    inviteId?: string,
}

interface RoomJoin {
    id?: string,
    type: "room_join",
    inviteId: string,
}

interface RoomJoinResponse {
    id: number,
    type: "room_join_response",
    requestId: number,
    result: string,
    players?: PlayerObject[]
}

interface EventPlayerJoin {
    id: number,
    type: "event_player_joined",
    player: PlayerObject
}

interface EventPlayerLeft {
    id: number,
    type: "event_player_left",
    player: string
}

interface RoomStart {
    id?: number,
    type: "room_start",
    connectionType: string, // fixed
}

interface RoomStartResponse {
    id: number,
    type: "room_start_response",
    requestId: number,
    result: string,
}

interface EventRoomStart {
    id?: number,
    type: "event_room_start",
}

interface EventRoomStartAck {
    id?: number,
    type: "event_room_start_ack",
    requestId: number
}
