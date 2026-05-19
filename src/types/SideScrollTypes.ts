import type { RectConfig, RoomKind, StairTransitionConfig } from './LevelTypes';

export type SideScrollTeacherKind = 'hallway_patrol' | 'hallway_static' | 'classroom_watch';
export type SideScrollDirection = 'left' | 'right';
export type SideScrollTeacherState = 'hidden' | 'warning' | 'watching' | 'active';
export type StudentLayer = 'hallway' | 'classroom';

export interface SideScrollLayoutConfig {
  designWidth: number;
  designHeight: number;
  pixelsPerMeter: number;
  depthScale: number;
  classroom: {
    widthM: number;
    depthM: number;
    ceilingHeightM: number;
    sillHeightM: number;
    transomHeightM: number;
  };
  corridor: {
    widthM: number;
    backLineRatio: number;
    walkLineRatio: number;
  };
  openings: {
    doorPairWidthM: number;
    windowBandWidthM: number;
  };
}

export interface SideScrollMetrics {
  ppm: number;
  corridorDepthPx: number;
  classroomModuleWidthPx: number;
  doorPairWidthPx: number;
  windowBandWidthPx: number;
  ceilingY: number;
  transomTopY: number;
  windowTopY: number;
  windowBottomY: number;
  sillY: number;
  hallBackY: number;
  walkY: number;
  floorBottomY: number;
  playerHeightPx: number;
  hallwayTeacherHeightPx: number;
  seatedStudentVisibleHeightPx: number;
  deskWidthPx: number;
  deskHeightPx: number;
}

export interface PeekAnchor {
  roomId: string;
  x: number;
  y: number;
  direction: SideScrollDirection;
  maskRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ClassroomSeatAnchor {
  roomId: string;
  x: number;
  y: number;
  scale: number;
  row: number;
}

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
