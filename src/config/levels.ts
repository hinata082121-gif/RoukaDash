import type { LevelConfig, LevelMapConfig } from '../types/LevelTypes';
import type { SideScrollConfig } from '../types/SideScrollTypes';
import { SIDE_VISUAL } from './visualTheme';

const level1Map: LevelMapConfig = {
  floorLabel: '1F',
  initialFloor: 1,
  walkable: [
    { x: 156, y: 176, width: 80, height: 464 },
    { x: 144, y: 128, width: 104, height: 80 }
  ],
  blocking: [
    { x: 56, y: 192, width: 88, height: 128 },
    { x: 56, y: 368, width: 88, height: 128 },
    { x: 248, y: 192, width: 88, height: 128 },
    { x: 248, y: 368, width: 88, height: 128 },
    { x: 166, y: 130, width: 52, height: 14 }
  ],
  rooms: [
    { label: '1-1', kind: 'classroom', x: 56, y: 192, width: 88, height: 128, door: { x: 144, y: 256 } },
    { label: '1-2', kind: 'classroom', x: 56, y: 368, width: 88, height: 128, door: { x: 144, y: 432 } },
    { label: '1-3', kind: 'classroom', x: 248, y: 192, width: 88, height: 128, door: { x: 248, y: 256 } },
    { label: '職員室', kind: 'staff', x: 248, y: 368, width: 88, height: 128, door: { x: 248, y: 432 } }
  ],
  props: [
    { kind: 'entrance', x: 144, y: 128, width: 104, height: 80, label: '玄関ホール' },
    { kind: 'shoebox', x: 166, y: 130, width: 52, height: 14 },
    { kind: 'window', x: 164, y: 184, width: 64, height: 12 },
    { kind: 'extinguisher', x: 238, y: 336, width: 10, height: 20 },
    { kind: 'poster', x: 70, y: 512, width: 42, height: 26 }
  ]
};

const level2Map: LevelMapConfig = {
  floorLabel: '2F',
  initialFloor: 2,
  walkable: [
    { x: 80, y: 160, width: 232, height: 64 },
    { x: 156, y: 160, width: 80, height: 464 },
    { x: 80, y: 288, width: 156, height: 64 },
    { x: 80, y: 416, width: 232, height: 64 },
    { x: 88, y: 560, width: 148, height: 64 }
  ],
  blocking: [
    { x: 56, y: 240, width: 88, height: 128 },
    { x: 56, y: 400, width: 88, height: 112 },
    { x: 248, y: 240, width: 88, height: 128 },
    { x: 248, y: 496, width: 88, height: 112 },
    { x: 88, y: 296, width: 42, height: 14 }
  ],
  rooms: [
    { label: '理科室', kind: 'science', x: 56, y: 240, width: 88, height: 128, door: { x: 144, y: 304 } },
    { label: '準備室', kind: 'storage', x: 56, y: 400, width: 88, height: 112, door: { x: 144, y: 456 } },
    { label: '2-1', kind: 'classroom', x: 248, y: 240, width: 88, height: 128, door: { x: 248, y: 304 } },
    { label: '2-2', kind: 'classroom', x: 248, y: 496, width: 88, height: 112, door: { x: 248, y: 552 } }
  ],
  props: [
    { kind: 'board', x: 88, y: 296, width: 42, height: 28, label: '待機' },
    { kind: 'stairs', x: 88, y: 560, width: 148, height: 64, label: '階段前' },
    { kind: 'window', x: 164, y: 168, width: 64, height: 12 },
    { kind: 'extinguisher', x: 238, y: 384, width: 10, height: 20 }
  ]
};

const level3Map: LevelMapConfig = {
  floorLabel: '1F',
  initialFloor: 1,
  walkable: [
    { x: 80, y: 528, width: 232, height: 64 },
    { x: 156, y: 176, width: 80, height: 416 },
    { x: 80, y: 336, width: 232, height: 64 },
    { x: 156, y: 176, width: 156, height: 64 },
    { x: 80, y: 432, width: 156, height: 48 }
  ],
  blocking: [
    { x: 56, y: 408, width: 88, height: 112 },
    { x: 248, y: 112, width: 88, height: 128 },
    { x: 248, y: 408, width: 88, height: 112 },
    { x: 56, y: 176, width: 88, height: 112 },
    { x: 88, y: 344, width: 44, height: 12 },
    { x: 72, y: 192, width: 56, height: 42 }
  ],
  rooms: [
    { label: '保健室', kind: 'nurse', x: 56, y: 408, width: 88, height: 112, door: { x: 144, y: 464 } },
    { label: '1-1', kind: 'classroom', x: 248, y: 112, width: 88, height: 128, door: { x: 248, y: 196 } },
    { label: '1-2', kind: 'classroom', x: 248, y: 408, width: 88, height: 112, door: { x: 248, y: 464 } },
    { label: '下駄箱', kind: 'storage', x: 56, y: 176, width: 88, height: 112, door: { x: 144, y: 232 } }
  ],
  props: [
    { kind: 'shoebox', x: 72, y: 192, width: 56, height: 42 },
    { kind: 'board', x: 88, y: 344, width: 44, height: 30, label: '安全' },
    { kind: 'poster', x: 270, y: 344, width: 36, height: 28, label: '待機' },
    { kind: 'window', x: 164, y: 536, width: 64, height: 12 },
    { kind: 'extinguisher', x: 238, y: 400, width: 10, height: 20 }
  ]
};

const level4Map: LevelMapConfig = {
  floorLabel: '3F→2F',
  initialFloor: 3,
  walkable: [
    { x: 80, y: 192, width: 232, height: 64 },
    { x: 156, y: 128, width: 80, height: 520 },
    { x: 80, y: 416, width: 232, height: 64 },
    { x: 112, y: 608, width: 168, height: 64 }
  ],
  dashDisabledZones: [
    { x: 112, y: 608, width: 168, height: 64 }
  ],
  stairTransitions: [
    {
      id: 'l4-stairs-3f-to-2f',
      fromFloor: 3,
      toFloor: 2,
      trigger: { x: 112, y: 608, width: 168, height: 64 },
      destinationSpawn: { x: 196, y: 520 },
      label: '2Fへ移動中...'
    }
  ],
  blocking: [
    { x: 56, y: 88, width: 88, height: 112 },
    { x: 248, y: 88, width: 88, height: 112 },
    { x: 248, y: 288, width: 88, height: 112 },
    { x: 56, y: 288, width: 88, height: 112 },
    { x: 88, y: 424, width: 42, height: 12 }
  ],
  rooms: [
    { label: '図書室', kind: 'library', x: 56, y: 88, width: 88, height: 112, door: { x: 144, y: 152 } },
    { label: '3-1', kind: 'classroom', x: 248, y: 88, width: 88, height: 112, door: { x: 248, y: 152 } },
    { label: '職員室', kind: 'staff', x: 248, y: 288, width: 88, height: 112, door: { x: 248, y: 352 } },
    { label: '資料室', kind: 'storage', x: 56, y: 288, width: 88, height: 112, door: { x: 144, y: 352 } }
  ],
  props: [
    { kind: 'stairs', x: 112, y: 608, width: 168, height: 64, label: '階段 2Fへ' },
    { kind: 'window', x: 164, y: 136, width: 64, height: 12 },
    { kind: 'board', x: 88, y: 424, width: 42, height: 30 },
    { kind: 'extinguisher', x: 238, y: 512, width: 10, height: 20 }
  ]
};

const level5Map: LevelMapConfig = {
  floorLabel: '3F→1F',
  initialFloor: 3,
  walkable: [
    { x: 80, y: 576, width: 176, height: 64 },
    { x: 156, y: 128, width: 80, height: 512 },
    { x: 80, y: 448, width: 232, height: 64 },
    { x: 80, y: 288, width: 232, height: 64 },
    { x: 236, y: 352, width: 76, height: 48 },
    { x: 80, y: 384, width: 76, height: 48 },
    { x: 144, y: 128, width: 104, height: 80 }
  ],
  dashDisabledZones: [
    { x: 80, y: 576, width: 176, height: 64 },
    { x: 80, y: 384, width: 76, height: 48 }
  ],
  stairTransitions: [
    {
      id: 'l5-stairs-3f-to-2f',
      fromFloor: 3,
      toFloor: 2,
      trigger: { x: 80, y: 576, width: 176, height: 64 },
      destinationSpawn: { x: 196, y: 480 },
      label: '2Fへ移動中...'
    },
    {
      id: 'l5-stairs-2f-to-1f',
      fromFloor: 2,
      toFloor: 1,
      trigger: { x: 80, y: 384, width: 76, height: 48 },
      destinationSpawn: { x: 196, y: 236 },
      label: '1Fへ移動中...'
    }
  ],
  blocking: [
    { x: 56, y: 520, width: 88, height: 112 },
    { x: 56, y: 160, width: 88, height: 112 },
    { x: 248, y: 360, width: 88, height: 80 },
    { x: 248, y: 520, width: 88, height: 112 },
    { x: 166, y: 130, width: 52, height: 14 },
    { x: 88, y: 296, width: 42, height: 12 }
  ],
  rooms: [
    { label: '音楽室', kind: 'music', x: 56, y: 520, width: 88, height: 112, door: { x: 144, y: 584 } },
    { label: '3-1', kind: 'classroom', x: 56, y: 160, width: 88, height: 112, door: { x: 144, y: 216 } },
    { label: '2-1', kind: 'classroom', x: 248, y: 360, width: 88, height: 80, door: { x: 248, y: 400 } },
    { label: '職員室', kind: 'staff', x: 248, y: 520, width: 88, height: 112, door: { x: 248, y: 584 } }
  ],
  props: [
    { kind: 'entrance', x: 144, y: 128, width: 104, height: 80, label: '玄関ホール' },
    { kind: 'stairs', x: 80, y: 576, width: 176, height: 64, label: '階段 2Fへ' },
    { kind: 'stairs', x: 80, y: 384, width: 76, height: 48, label: '階段 1Fへ' },
    { kind: 'shoebox', x: 166, y: 130, width: 52, height: 14 },
    { kind: 'board', x: 88, y: 296, width: 42, height: 30, label: '待機' },
    { kind: 'poster', x: 264, y: 366, width: 34, height: 24, label: '安全' },
    { kind: 'window', x: 164, y: 136, width: 64, height: 12 },
    { kind: 'extinguisher', x: 238, y: 512, width: 10, height: 20 }
  ]
};

const sideLevel1: SideScrollConfig = {
  worldWidth: 1250,
  floorY: SIDE_VISUAL.playerLaneY,
  startX: 82,
  goalX: 960,
  initialFloor: 1,
  goalFloor: 1,
  backgroundRooms: [
    { x: 70, width: 640, floor: 1, label: '1-1', kind: 'classroom' },
    { x: 750, width: 420, floor: 1, label: '玄関', kind: 'storage' }
  ],
  students: [
    { id: 'l1-s1', x: 250, floor: 1, layer: 'hallway', color: 0x4f9ad8 },
    { id: 'l1-s2', x: 460, floor: 1, layer: 'seated', color: 0x71c562 },
    { id: 'l1-s3', x: 790, floor: 1, layer: 'hallway', color: 0xf59e0b }
  ],
  teachers: [
    {
      id: 'l1-watch',
      type: 'classroom_watch',
      x: 470,
      floor: 1,
      roomId: '1:1-1',
      direction: 'right',
      visionWidth: 176,
      visionHeight: 86,
      hiddenMs: 1900,
      warningMs: 850,
      watchingMs: 1750
    }
  ]
};

const sideLevel2: SideScrollConfig = {
  worldWidth: 1450,
  floorY: SIDE_VISUAL.playerLaneY,
  startX: 82,
  goalX: 1140,
  initialFloor: 2,
  goalFloor: 2,
  backgroundRooms: [
    { x: 60, width: 640, floor: 2, label: '理科室', kind: 'science' },
    { x: 735, width: 640, floor: 2, label: '2-1', kind: 'classroom' }
  ],
  students: [
    { id: 'l2-s1', x: 210, floor: 2, layer: 'seated', color: 0x71c562 },
    { id: 'l2-s2', x: 510, floor: 2, layer: 'hallway', color: 0x4f9ad8 },
    { id: 'l2-s3', x: 820, floor: 2, layer: 'seated', color: 0xf59e0b }
  ],
  teachers: [
    {
      id: 'l2-patrol',
      type: 'hallway_patrol',
      x: 520,
      floor: 2,
      direction: 'right',
      visionWidth: 188,
      visionHeight: 82,
      patrolMinX: 420,
      patrolMaxX: 720,
      speed: 68
    }
  ]
};

const sideLevel3: SideScrollConfig = {
  worldWidth: 1620,
  floorY: SIDE_VISUAL.playerLaneY,
  startX: 84,
  goalX: 1320,
  initialFloor: 1,
  goalFloor: 1,
  backgroundRooms: [
    { x: 70, width: 640, floor: 1, label: '保健室', kind: 'nurse' },
    { x: 780, width: 640, floor: 1, label: '1-1', kind: 'classroom' }
  ],
  students: [
    { id: 'l3-s1', x: 310, floor: 1, layer: 'hallway', color: 0x4f9ad8 },
    { id: 'l3-s2', x: 560, floor: 1, layer: 'seated', color: 0xf59e0b },
    { id: 'l3-s3', x: 980, floor: 1, layer: 'hallway', color: 0x71c562 }
  ],
  teachers: [
    {
      id: 'l3-patrol',
      type: 'hallway_patrol',
      x: 460,
      floor: 1,
      direction: 'right',
      visionWidth: 180,
      visionHeight: 82,
      patrolMinX: 360,
      patrolMaxX: 620,
      speed: 65
    },
    {
      id: 'l3-watch',
      type: 'classroom_watch',
      x: 900,
      floor: 1,
      roomId: '1:1-1',
      direction: 'left',
      visionWidth: 192,
      visionHeight: 86,
      hiddenMs: 1800,
      warningMs: 820,
      watchingMs: 1800
    }
  ]
};

const sideLevel4: SideScrollConfig = {
  worldWidth: 1940,
  floorY: SIDE_VISUAL.playerLaneY,
  startX: 84,
  goalX: 1490,
  initialFloor: 3,
  goalFloor: 2,
  backgroundRooms: [
    { x: 70, width: 640, floor: 3, label: '図書室', kind: 'library' },
    { x: 930, width: 640, floor: 2, label: '職員室', kind: 'staff' },
    { x: 1240, width: 640, floor: 2, label: '2-1', kind: 'classroom' }
  ],
  students: [
    { id: 'l4-s1', x: 250, floor: 3, layer: 'seated', color: 0x4f9ad8 },
    { id: 'l4-s2', x: 530, floor: 3, layer: 'hallway', color: 0xf59e0b },
    { id: 'l4-s3', x: 1180, floor: 2, layer: 'hallway', color: 0x71c562 }
  ],
  teachers: [
    {
      id: 'l4-patrol-3f',
      type: 'hallway_patrol',
      x: 430,
      floor: 3,
      direction: 'right',
      visionWidth: 180,
      visionHeight: 82,
      patrolMinX: 320,
      patrolMaxX: 600,
      speed: 70
    },
    {
      id: 'l4-patrol-2f',
      type: 'hallway_patrol',
      x: 1120,
      floor: 2,
      direction: 'left',
      visionWidth: 186,
      visionHeight: 82,
      patrolMinX: 1000,
      patrolMaxX: 1330,
      speed: 72
    }
  ],
  stairTransitions: [
    {
      id: 'l4-side-stairs-3f-to-2f',
      fromFloor: 3,
      toFloor: 2,
      trigger: { x: 760, y: 550, width: 88, height: 100 },
      destinationSpawn: { x: 900, y: SIDE_VISUAL.playerLaneY },
      label: '2Fへ移動中...'
    }
  ]
};

const sideLevel5: SideScrollConfig = {
  worldWidth: 2530,
  floorY: SIDE_VISUAL.playerLaneY,
  startX: 84,
  goalX: 2060,
  initialFloor: 3,
  goalFloor: 1,
  backgroundRooms: [
    { x: 70, width: 640, floor: 3, label: '音楽室', kind: 'music' },
    { x: 800, width: 640, floor: 2, label: '2-1', kind: 'classroom' },
    { x: 1140, width: 640, floor: 2, label: '職員室', kind: 'staff' },
    { x: 1540, width: 640, floor: 1, label: '1-1', kind: 'classroom' },
    { x: 1830, width: 640, floor: 1, label: '玄関', kind: 'storage' }
  ],
  students: [
    { id: 'l5-s1', x: 260, floor: 3, layer: 'seated', color: 0xf59e0b },
    { id: 'l5-s2', x: 560, floor: 3, layer: 'hallway', color: 0x4f9ad8 },
    { id: 'l5-s3', x: 1020, floor: 2, layer: 'hallway', color: 0x71c562 },
    { id: 'l5-s4', x: 1320, floor: 2, layer: 'seated', color: 0xf59e0b },
    { id: 'l5-s5', x: 1740, floor: 1, layer: 'hallway', color: 0x4f9ad8 }
  ],
  teachers: [
    {
      id: 'l5-watch-3f',
      type: 'classroom_watch',
      x: 260,
      floor: 3,
      roomId: '3:音楽室',
      direction: 'right',
      visionWidth: 184,
      visionHeight: 86,
      hiddenMs: 1700,
      warningMs: 780,
      watchingMs: 1780
    },
    {
      id: 'l5-patrol-2f',
      type: 'hallway_patrol',
      x: 1060,
      floor: 2,
      direction: 'right',
      visionWidth: 188,
      visionHeight: 82,
      patrolMinX: 920,
      patrolMaxX: 1240,
      speed: 70
    },
    {
      id: 'l5-static-1f',
      type: 'hallway_static',
      x: 1680,
      floor: 1,
      direction: 'left',
      visionWidth: 192,
      visionHeight: 82
    },
    {
      id: 'l5-watch-1f',
      type: 'classroom_watch',
      x: 1880,
      floor: 1,
      roomId: '1:1-1',
      direction: 'left',
      visionWidth: 178,
      visionHeight: 86,
      hiddenMs: 1900,
      warningMs: 800,
      watchingMs: 1720
    }
  ],
  stairTransitions: [
    {
      id: 'l5-side-stairs-3f-to-2f',
      fromFloor: 3,
      toFloor: 2,
      trigger: { x: 680, y: 550, width: 88, height: 100 },
      destinationSpawn: { x: 810, y: SIDE_VISUAL.playerLaneY },
      label: '2Fへ移動中...'
    },
    {
      id: 'l5-side-stairs-2f-to-1f',
      fromFloor: 2,
      toFloor: 1,
      trigger: { x: 1420, y: 550, width: 88, height: 100 },
      destinationSpawn: { x: 1530, y: SIDE_VISUAL.playerLaneY },
      label: '1Fへ移動中...'
    }
  ]
};

export const levels: LevelConfig[] = [
  {
    id: 1,
    name: '1階教室前から玄関ホールへ',
    startLabel: '1階教室前の廊下',
    goalLabel: '玄関ホール',
    timeLimit: 15,
    objective: '基本ルールのチュートリアル',
    expectedClearTime: '11〜14秒',
    playerStart: { x: 196, y: 608 },
    goal: { x: 168, y: 144, width: 56, height: 48 },
    map: level1Map,
    sideScroll: sideLevel1,
    unlockedMapArea: '1階エリア',
    teachers: [
      {
        id: 'l1-peek',
        type: 'peek',
        position: { x: 304, y: 256 },
        vision: { x: 156, y: 252, width: 80, height: 56 },
        hiddenMs: 2400,
        warningMs: 1200,
        watchingMs: 1800
      }
    ]
  },
  {
    id: 2,
    name: '理科室前から2年教室前へ',
    startLabel: '2階理科室前の廊下',
    goalLabel: '2年教室前',
    timeLimit: 19,
    objective: '巡回教師を避ける',
    introText: '巡回する先生に注意！',
    expectedClearTime: '14〜18秒',
    playerStart: { x: 112, y: 192 },
    goal: { x: 248, y: 424, width: 52, height: 40 },
    map: level2Map,
    sideScroll: sideLevel2,
    unlockedMapArea: '2階理科室周辺',
    teachers: [
      {
        id: 'l2-patrol',
        type: 'patrol',
        position: { x: 112, y: 448 },
        waypoints: [
          { x: 112, y: 448 },
          { x: 288, y: 448 }
        ],
        speed: 44,
        visionSize: { width: 92, height: 44 }
      }
    ]
  },
  {
    id: 3,
    name: '保健室前から1年教室前へ',
    startLabel: '保健室前の廊下',
    goalLabel: '1年教室前',
    timeLimit: 23,
    objective: '待機とルート判断を学ぶ',
    introText: '安全な場所で待とう',
    expectedClearTime: '17〜22秒',
    playerStart: { x: 112, y: 560 },
    goal: { x: 248, y: 184, width: 52, height: 40 },
    map: level3Map,
    sideScroll: sideLevel3,
    unlockedMapArea: '1階保健室・下駄箱周辺',
    teachers: [
      {
        id: 'l3-peek',
        type: 'peek',
        position: { x: 304, y: 464 },
        vision: { x: 156, y: 528, width: 132, height: 56 },
        hiddenMs: 2100,
        warningMs: 1100,
        watchingMs: 1700
      },
      {
        id: 'l3-patrol',
        type: 'patrol',
        position: { x: 196, y: 368 },
        waypoints: [
          { x: 196, y: 368 },
          { x: 112, y: 368 },
          { x: 196, y: 368 },
          { x: 196, y: 224 }
        ],
        speed: 44,
        visionSize: { width: 88, height: 44 }
      }
    ]
  },
  {
    id: 4,
    name: '図書室前から職員室前へ',
    startLabel: '図書室前の廊下',
    goalLabel: '職員室前',
    timeLimit: 24,
    objective: '階段移動と複数教師の回避',
    introText: '階段では落ち着いて移動しよう',
    expectedClearTime: '19〜22秒',
    playerStart: { x: 112, y: 224 },
    goalFloor: 2,
    goal: { x: 248, y: 432, width: 52, height: 40 },
    map: level4Map,
    sideScroll: sideLevel4,
    unlockedMapArea: '3階図書室周辺',
    teachers: [
      {
        id: 'l4-patrol-a',
        type: 'patrol',
        position: { x: 196, y: 224 },
        waypoints: [
          { x: 196, y: 224 },
          { x: 288, y: 224 },
          { x: 196, y: 224 },
          { x: 196, y: 448 }
        ],
        speed: 48,
        visionSize: { width: 94, height: 44 }
      },
      {
        id: 'l4-patrol-b',
        type: 'patrol',
        position: { x: 196, y: 640 },
        waypoints: [
          { x: 196, y: 640 },
          { x: 128, y: 640 },
          { x: 196, y: 640 },
          { x: 196, y: 448 }
        ],
        speed: 44,
        visionSize: { width: 88, height: 44 }
      }
    ]
  },
  {
    id: 5,
    name: '音楽室前から玄関ホールへ',
    startLabel: '音楽室前の廊下',
    goalLabel: '玄関ホール',
    timeLimit: 31,
    objective: '総仕上げ',
    introText: '最後は校舎を抜けて玄関へ！',
    expectedClearTime: '25〜28秒',
    playerStart: { x: 196, y: 552 },
    goalFloor: 1,
    goal: { x: 168, y: 144, width: 56, height: 48 },
    map: level5Map,
    sideScroll: sideLevel5,
    unlockedMapArea: '校舎図全体',
    teachers: [
      {
        id: 'l5-peek-a',
        type: 'peek',
        position: { x: 304, y: 400 },
        vision: { x: 156, y: 448, width: 132, height: 56 },
        hiddenMs: 2200,
        warningMs: 1100,
        watchingMs: 1700
      },
      {
        id: 'l5-peek-b',
        type: 'peek',
        position: { x: 96, y: 216 },
        vision: { x: 80, y: 288, width: 132, height: 56 },
        hiddenMs: 2500,
        warningMs: 1100,
        watchingMs: 1700
      },
      {
        id: 'l5-patrol-a',
        type: 'patrol',
        position: { x: 196, y: 320 },
        waypoints: [
          { x: 196, y: 320 },
          { x: 288, y: 320 },
          { x: 196, y: 320 },
          { x: 196, y: 480 }
        ],
        speed: 48,
        visionSize: { width: 92, height: 44 }
      },
      {
        id: 'l5-patrol-b',
        type: 'patrol',
        position: { x: 196, y: 608 },
        waypoints: [
          { x: 196, y: 608 },
          { x: 112, y: 608 },
          { x: 196, y: 608 },
          { x: 196, y: 480 }
        ],
        speed: 46,
        visionSize: { width: 88, height: 44 }
      }
    ]
  }
];
