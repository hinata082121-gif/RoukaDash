import type { Point, TeacherConfig } from './TeacherTypes';
import type { SideScrollConfig } from './SideScrollTypes';

export type RoomKind = 'classroom' | 'science' | 'music' | 'library' | 'nurse' | 'staff' | 'storage';
export type MapPropKind = 'window' | 'board' | 'shoebox' | 'extinguisher' | 'stairs' | 'entrance' | 'poster';

export interface RectConfig {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RoomConfig extends RectConfig {
  label: string;
  kind: RoomKind;
  door: Point;
}

export interface MapPropConfig extends RectConfig {
  kind: MapPropKind;
  label?: string;
}

export interface StairTransitionConfig {
  id: string;
  fromFloor: number;
  toFloor: number;
  trigger: RectConfig;
  destinationSpawn: Point;
  label: string;
}

export interface LevelMapConfig {
  floorLabel: string;
  initialFloor?: number;
  walkable: RectConfig[];
  blocking: RectConfig[];
  dashDisabledZones?: RectConfig[];
  stairTransitions?: StairTransitionConfig[];
  rooms: RoomConfig[];
  props: MapPropConfig[];
}

export interface LevelConfig {
  id: number;
  name: string;
  startLabel: string;
  goalLabel: string;
  timeLimit: number;
  objective: string;
  introText?: string;
  expectedClearTime?: string;
  playerStart: Point;
  goalFloor?: number;
  goal: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  map: LevelMapConfig;
  sideScroll?: SideScrollConfig;
  teachers: TeacherConfig[];
  unlockedMapArea: string;
}

export interface GameResultData {
  levelId: number;
  cleared: boolean;
  clearTime: number;
  dashCount: number;
  reason?: string;
}
