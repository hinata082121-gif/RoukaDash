import type { RectConfig, RoomKind, StairTransitionConfig } from './LevelTypes';

export type SideScrollTeacherKind = 'hallway_patrol' | 'hallway_static' | 'classroom_watch';
export type SideScrollDirection = 'left' | 'right';
export type SideScrollTeacherState = 'hidden' | 'warning' | 'watching' | 'active';
export type StudentLayer = 'hallway' | 'classroom';

export interface SideScrollRoomConfig {
  x: number;
  width: number;
  floor: number;
  label: string;
  kind: RoomKind;
}

export interface StudentConfig {
  id: string;
  x: number;
  floor: number;
  layer: StudentLayer;
  color?: number;
}

export interface SideScrollTeacherConfig {
  id: string;
  type: SideScrollTeacherKind;
  x: number;
  floor: number;
  direction: SideScrollDirection;
  visionWidth: number;
  visionHeight: number;
  patrolMinX?: number;
  patrolMaxX?: number;
  speed?: number;
  hiddenMs?: number;
  warningMs?: number;
  watchingMs?: number;
}

export interface SideScrollConfig {
  worldWidth: number;
  floorY: number;
  startX: number;
  goalX: number;
  initialFloor: number;
  goalFloor: number;
  backgroundRooms: SideScrollRoomConfig[];
  students: StudentConfig[];
  teachers: SideScrollTeacherConfig[];
  stairTransitions?: StairTransitionConfig[];
  props?: RectConfig[];
}
