export const achievements = [
  { id:'first', title:'First Contact', description:'Press the button for the first time.', target:1 },
  { id:'ten', title:'Curiosity', description:'Reach 10 presses.', target:10 },
  { id:'twentyFive', title:'No Turning Back', description:'Reach 25 presses.', target:25 },
  { id:'fifty', title:'Persistent', description:'Reach 50 presses.', target:50 },
  { id:'clue3', title:'Pattern Seeker', description:'Discover 3 clues.', target:3, clueBased:true },
  { id:'clue5', title:'The Collector', description:'Discover 5 clues.', target:5, clueBased:true },
];

export function getChapter(presses: number, clueCount: number): number {
  if (presses >= 30 && clueCount >= 4) return 3;
  if (presses >= 12 && clueCount >= 2) return 2;
  return 1;
}

export function getLevel(presses: number): number {
  return Math.floor(presses / 10) + 1;
}
