export type GameSave = {
  presses: number;
  clues: string[];
  seenEvents: string[];
  achievements: string[];
  lastEvent: string;
  soundOn: boolean;
  itemsFound: string[];
  roomsVisited: string[];
  fear: number;
  horrorSeen: string[];
  hazardSeen: string[];
};

const KEY = 'the-last-button-save-v1';

export const emptySave: GameSave = {
  presses: 0,
  clues: [],
  seenEvents: [],
  achievements: [],
  lastEvent: '',
  soundOn: false,
  itemsFound: [],
  roomsVisited: [],
  fear: 0,
  horrorSeen: [],
  hazardSeen: [],
};

export function loadSave(): GameSave {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptySave;
    const parsed = JSON.parse(raw) as Partial<GameSave>;
    return {
      ...emptySave,
      ...parsed,
      clues: Array.isArray(parsed.clues) ? parsed.clues : [],
      seenEvents: Array.isArray(parsed.seenEvents) ? parsed.seenEvents : [],
      achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
      itemsFound: Array.isArray(parsed.itemsFound) ? parsed.itemsFound : [],
      roomsVisited: Array.isArray(parsed.roomsVisited) ? parsed.roomsVisited : [],
      fear: typeof parsed.fear === 'number' ? Math.max(0, Math.min(100, parsed.fear)) : 0,
      horrorSeen: Array.isArray(parsed.horrorSeen) ? parsed.horrorSeen : [],
      hazardSeen: Array.isArray(parsed.hazardSeen) ? parsed.hazardSeen : [],
    };
  } catch {
    return emptySave;
  }
}

export function persistSave(save: GameSave): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    // The game remains playable if browser storage is unavailable.
  }
}
