/**
 * Future network interface (types only — no live server/WebSocket in v0.1).
 * A server-authoritative PvP server would run `World` headless, accept validated commands
 * and send each client only its own team observation.
 */
import type { Command, CommandResult } from '../core/world';
import type { TeamObservation } from '../core/observation';
import type { GameEvent } from '../core/types';

export interface ClientCommandMsg { kind: 'command'; matchId: string; tick: number; cmd: Command }
export interface ServerResultMsg { kind: 'result'; tick: number; res: CommandResult }
/** Per-team filtered snapshot: never contains hidden enemy positions */
export interface ServerSnapshotMsg { kind: 'snapshot'; tick: number; obs: TeamObservation; events: GameEvent[] }
export type NetMessage = ClientCommandMsg | ServerResultMsg | ServerSnapshotMsg;
export const PROTOCOL_VERSION = 1;
