import type { SideScrollLayoutConfig, SideScrollMetrics } from '../types/SideScrollTypes';

export function buildSideScrollMetrics(width: number, height: number, layout: SideScrollLayoutConfig): SideScrollMetrics {
  const effectiveHeight = Math.min(height, layout.designHeight);
  const ppm = layout.pixelsPerMeter * (effectiveHeight / layout.designHeight);
  const corridorDepthPx = clamp(layout.corridor.widthM * ppm * layout.depthScale, 140, 180);
  const walkY = Math.round(effectiveHeight * layout.corridor.walkLineRatio);
  const hallBackY = Math.round(effectiveHeight * layout.corridor.backLineRatio);
  const floorBottomY = Math.min(height - 130, Math.round(walkY + corridorDepthPx * 0.52));

  return {
    ppm,
    corridorDepthPx,
    classroomModuleWidthPx: Math.max(640, Math.round(layout.classroom.widthM * ppm)),
    doorPairWidthPx: Math.round(layout.openings.doorPairWidthM * ppm),
    windowBandWidthPx: Math.round(layout.openings.windowBandWidthM * ppm),
    ceilingY: Math.round(effectiveHeight * 0.12),
    transomTopY: Math.round(effectiveHeight * 0.16),
    windowTopY: Math.round(effectiveHeight * 0.22),
    windowBottomY: Math.round(effectiveHeight * 0.455),
    sillY: Math.round(effectiveHeight * 0.455),
    hallBackY,
    walkY,
    floorBottomY,
    playerHeightPx: Math.round(1.7 * ppm),
    hallwayTeacherHeightPx: Math.round(1.74 * ppm),
    seatedStudentVisibleHeightPx: Math.round(1.18 * ppm),
    deskWidthPx: Math.round(0.6 * ppm),
    deskHeightPx: Math.round(0.4 * ppm)
  };
}

export function mToPx(meters: number, metrics: SideScrollMetrics): number {
  return meters * metrics.ppm;
}

export function depthToPx(meters: number, metrics: SideScrollMetrics, layout: SideScrollLayoutConfig): number {
  return meters * metrics.ppm * layout.depthScale;
}

export function getWalkY(metrics: SideScrollMetrics): number {
  return metrics.walkY;
}

export function getHallBackY(metrics: SideScrollMetrics): number {
  return metrics.hallBackY;
}

export function getClassroomModuleWidth(metrics: SideScrollMetrics): number {
  return metrics.classroomModuleWidthPx;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
