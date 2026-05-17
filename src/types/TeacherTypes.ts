export type TeacherKind = 'peek' | 'patrol';
export type PeekState = 'hidden' | 'warning' | 'watching';

export interface Point {
  x: number;
  y: number;
}

export interface VisionRectConfig {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PeekTeacherConfig {
  id: string;
  type: 'peek';
  position: Point;
  vision: VisionRectConfig;
  hiddenMs: number;
  warningMs: number;
  watchingMs: number;
}

export interface PatrolTeacherConfig {
  id: string;
  type: 'patrol';
  position: Point;
  waypoints: Point[];
  speed: number;
  visionSize: {
    width: number;
    height: number;
  };
}

export type TeacherConfig = PeekTeacherConfig | PatrolTeacherConfig;
