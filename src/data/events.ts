export type MysteryEvent = {
  id: string;
  title: string;
  body: string;
  kind: 'message' | 'clue' | 'anomaly';
  rarity: 'common' | 'uncommon' | 'rare';
};

export const mysteryEvents: MysteryEvent[] = [
  { id:'e01', title:'Someone is here.', body:'You felt it before the screen changed. You are not alone.', kind:'message', rarity:'common' },
  { id:'e02', title:'Do not look behind you.', body:'There is no reason to check. That is what makes it worse.', kind:'message', rarity:'common' },
  { id:'e03', title:'Signal received.', body:'Origin unknown. The signal contains a single repeating pulse.', kind:'clue', rarity:'uncommon' },
  { id:'e04', title:'A small contradiction.', body:'The counter moved. But you did not press the button.', kind:'anomaly', rarity:'rare' },
  { id:'e05', title:'You have been here before.', body:'A faint mark appears beneath the button. It looks familiar.', kind:'clue', rarity:'uncommon' },
  { id:'e06', title:'Stop counting.', body:'Numbers are useful. Until they begin counting you.', kind:'message', rarity:'common' },
  { id:'e07', title:'The room is listening.', body:'A quiet click answers from somewhere beyond the screen.', kind:'anomaly', rarity:'rare' },
  { id:'e08', title:'Fragment 01 recovered.', body:'“When the light goes out, the door remembers.”', kind:'clue', rarity:'uncommon' },
  { id:'e09', title:'Nothing changed.', body:'And yet, you are certain something is different.', kind:'message', rarity:'common' },
  { id:'e10', title:'Unknown caller.', body:'The missed call has no number. Just the time: NOW.', kind:'anomaly', rarity:'rare' },
  { id:'e11', title:'A second shadow.', body:'Your shadow seems to be facing the wrong direction.', kind:'message', rarity:'common' },
  { id:'e12', title:'Fragment 02 recovered.', body:'“Three knocks. Two answers. One silence.”', kind:'clue', rarity:'uncommon' },
  { id:'e13', title:'The button remembers.', body:'It remembers every press. Even the ones you forgot.', kind:'message', rarity:'common' },
  { id:'e14', title:'A pulse in the dark.', body:'The glow briefly matches a heartbeat. Yours, perhaps.', kind:'anomaly', rarity:'rare' },
  { id:'e15', title:'Keep this secret.', body:'You found something that was not meant to be found.', kind:'clue', rarity:'uncommon' },
  { id:'e16', title:'Almost a voice.', body:'A whisper breaks through the static. It says your next move.', kind:'anomaly', rarity:'rare' },
  { id:'e17', title:'The silence has weight.', body:'Wait a moment. The quiet is part of the message.', kind:'message', rarity:'common' },
  { id:'e18', title:'Fragment 03 recovered.', body:'“The last choice is never the first choice.”', kind:'clue', rarity:'uncommon' },
  { id:'e19', title:'A familiar warning.', body:'You have seen this warning somewhere. You cannot remember where.', kind:'message', rarity:'common' },
  { id:'e20', title:'It blinked.', body:'The button blinked once. You did not.', kind:'anomaly', rarity:'rare' },
  { id:'e21', title:'Do you trust it?', body:'The only thing more dangerous than the button is your certainty.', kind:'message', rarity:'common' },
  { id:'e22', title:'Fragment 04 recovered.', body:'“Look for the space between the signals.”', kind:'clue', rarity:'uncommon' },
  { id:'e23', title:'A new mark.', body:'A thin red line appears, then fades. Something is unlocking.', kind:'clue', rarity:'uncommon' },
  { id:'e24', title:'Not your reflection.', body:'For one instant, the glass showed an empty room.', kind:'anomaly', rarity:'rare' },
  { id:'e25', title:'One more?', body:'The button is waiting. It has all the time in the world.', kind:'message', rarity:'common' },
];

export function chooseEvent(pressCount: number, seen: string[]): MysteryEvent {
  const unseen = mysteryEvents.filter((event) => !seen.includes(event.id));
  const pool = unseen.length ? unseen : mysteryEvents;
  const rare = pool.filter((event) => event.rarity === 'rare');
  const roll = Math.random();
  const candidates = roll < 0.12 && rare.length ? rare : pool;
  return candidates[(pressCount + Math.floor(Math.random() * candidates.length)) % candidates.length];
}
