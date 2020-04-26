interface PlayerObject {
    id?: string,
    username: string,
    color: number,
    border_color: number,
}

interface Login {
    id: number,
    type: "login",
    details: PlayerObject,
}

interface LoginResponse {
    id: number,
    type: "login_response",
    request_id: number,
    result: string,
    player_id?: string,
}

interface RoomCreate {
    id?: number,
    type: "room_create",
}

interface RoomCreateResponse {
    id: number,
    type: "room_create_response",
    request_id: number,
    result: string,
    players?: PlayerObject[],
    invite_id?: string,
}

interface RoomJoin {
    id?: string,
    type: "room_join",
    invite_id: string,
}

interface RoomJoinResponse {
    id: number,
    type: "room_join_response",
    request_id: number,
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
    connection_type: string, // fixed
}

interface RoomStartResponse {
    id: number,
    type: "room_start_response",
    request_id: number,
    result: string,
}

interface EventRoomStart {
    id?: number,
    type: "event_room_start",
}

interface EventRoomStartAck {
    id?: number,
    type: "event_room_start_ack",
    request_id: number
}
