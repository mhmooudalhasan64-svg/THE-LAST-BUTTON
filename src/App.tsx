import { useEffect, useMemo, useRef, useState } from 'react';
import { Archive, AudioLines, BookOpen, ChevronRight, CircleHelp, Eye, LockKeyhole, RotateCcw, Settings2, Sparkles, Trophy, Volume2, VolumeX, X } from 'lucide-react';
import { mysteryEvents, chooseEvent, type MysteryEvent } from './data/events';
import { achievements, getChapter, getLevel } from './engine/progression';
import { emptySave, loadSave, persistSave, type GameSave } from './engine/save';
import { rooms } from './data/exploration';

type Tab = 'play' | 'explore' | 'archive' | 'records';
type Language = 'en' | 'ar';

function playHorrorCue(kind: 'step' | 'breath' | 'caught' | 'escaped', intensity = 1) {
  try {
    const audio = new AudioContext();
    const now = audio.currentTime;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.connect(gain);
    gain.connect(audio.destination);

    if (kind === 'step') {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(72 * intensity, now);
      oscillator.frequency.exponentialRampToValueAtTime(38 * intensity, now + 0.16);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.055 * intensity, now + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
      oscillator.start(now);
      oscillator.stop(now + 0.22);
    } else if (kind === 'breath') {
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(115, now);
      oscillator.frequency.exponentialRampToValueAtTime(68, now + 0.65);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.022, now + 0.22);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
      oscillator.start(now);
      oscillator.stop(now + 0.82);
    } else {
      oscillator.type = kind === 'caught' ? 'sawtooth' : 'sine';
      oscillator.frequency.setValueAtTime(kind === 'caught' ? 190 : 420, now);
      oscillator.frequency.exponentialRampToValueAtTime(kind === 'caught' ? 42 : 760, now + 0.55);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(kind === 'caught' ? 0.07 : 0.035, now + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.62);
      oscillator.start(now);
      oscillator.stop(now + 0.65);
    }
    oscillator.onended = () => void audio.close();
    void audio.resume();
  } catch { /* Audio is optional and may be unavailable on some devices. */ }
}


const copy = {
  en: {
    subtitle:'ONE BUTTON. A THOUSAND SECRETS.', status:'UNKNOWN SIGNAL',
    chapter:'CHAPTER', begin:'The button is waiting.', beginBody:'No instructions. No way back. Just one choice.',
    press:'PRESS', presses:'PRESSES', level:'LEVEL', clues:'CLUES FOUND',
    archive:'ARCHIVE', records:'RECORDS', play:'PLAY', recent:'LATEST TRANSMISSION',
    empty:'No clues recovered yet.', emptyHint:'Some messages are more than they seem.',
    achievements:'ACHIEVEMENTS', unlocked:'UNLOCKED', locked:'LOCKED',
    settings:'SETTINGS', sound:'Sound effects', language:'Language', reset:'Reset progress',
    resetConfirm:'Erase all progress and start again?', cancel:'Cancel', confirm:'Reset',
    rarity:{common:'SIGNAL',uncommon:'CLUE',rare:'ANOMALY'},
    kinds:{message:'MESSAGE',clue:'EVIDENCE',anomaly:'ANOMALY'},
    footer:'YOUR CHOICES LEAVE TRACES.', discovered:'DISCOVERED',
    chapterNames:['THE BEGINNING','THE SIGNAL','THE SECRET'],
    chapterDescriptions:['Every mystery begins with a question.','Something is trying to reach you.','The fragments are starting to connect.'],
    noEvent:'The signal is quiet.', noEventBody:'For now.',
    firstSecret:'A fragment has been added to your archive.',
  },
  ar: {
    subtitle:'زر واحد. آلاف الأسرار.', status:'إشارة مجهولة',
    chapter:'الفصل', begin:'الزر ينتظرك.', beginBody:'لا تعليمات. لا عودة. خيار واحد فقط.',
    press:'اضغط', presses:'الضغطات', level:'المستوى', clues:'الأدلة المكتشفة',
    archive:'الأرشيف', records:'السجل', play:'اللعب', recent:'آخر إشارة',
    empty:'لم تكتشف أي دليل بعد.', emptyHint:'بعض الرسائل تخفي أكثر مما تظهر.',
    achievements:'الإنجازات', unlocked:'مفتوح', locked:'مقفل',
    settings:'الإعدادات', sound:'المؤثرات الصوتية', language:'اللغة', reset:'إعادة التقدم',
    resetConfirm:'هل تريد حذف تقدمك والبدء من جديد؟', cancel:'إلغاء', confirm:'إعادة',
    rarity:{common:'إشارة',uncommon:'دليل',rare:'حدث نادر'},
    kinds:{message:'رسالة',clue:'دليل',anomaly:'ظاهرة'},
    footer:'كل اختيار يترك أثراً.', discovered:'مكتشف',
    chapterNames:['البداية','الإشارة','السر'],
    chapterDescriptions:['كل لغز يبدأ بسؤال.','هناك شيء يحاول الوصول إليك.','بدأت الأجزاء تتصل ببعضها.'],
    noEvent:'الإشارة هادئة.', noEventBody:'في الوقت الحالي.',
    firstSecret:'تمت إضافة جزء إلى أرشيفك.',
  },
};

function App() {
  const [save, setSave] = useState<GameSave>(() => loadSave());
  const [tab, setTab] = useState<Tab>('play');
  const [language, setLanguage] = useState<Language>(() => {
    try {
      return localStorage.getItem('the-last-button-language') === 'ar' ? 'ar' : 'en';
    } catch {
      return 'en';
    }
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [event, setEvent] = useState<MysteryEvent | null>(null);
  const [roomId, setRoomId] = useState('control');
  const [inspected, setInspected] = useState<string | null>(null);
  const [encounter, setEncounter] = useState<{ title: string; body: string } | null>(null);
  const [hazard, setHazard] = useState<'blackout' | 'lockdown' | null>(null);
  const [chase, setChase] = useState<{ phase: 'approach' | 'chase' | 'caught' | 'escaped'; ticks: number } | null>(null);
  const [stalkerPosition, setStalkerPosition] = useState(16);
  const [stalkerDirection, setStalkerDirection] = useState<1 | -1>(1);
  const [stalkerRoomsSeen, setStalkerRoomsSeen] = useState<string[]>([]);

  const audioMoodRef = useRef<{ phase: string | null; fear: number }>({ phase: null, fear: 0 });
  audioMoodRef.current = { phase: chase?.phase ?? null, fear: save.fear };

  useEffect(() => {
    if (tab !== 'explore' || !save.soundOn) return;
    let audio: AudioContext | null = null;
    let interval = 0;
    try {
      audio = new AudioContext();
      const filter = audio.createBiquadFilter();
      const master = audio.createGain();
      const low = audio.createOscillator();
      const high = audio.createOscillator();
      const lowGain = audio.createGain();
      const highGain = audio.createGain();
      filter.type = 'lowpass';
      filter.frequency.value = 260;
      master.gain.value = 0.0001;
      low.type = 'sine';
      high.type = 'triangle';
      low.frequency.value = 44;
      high.frequency.value = 67;
      lowGain.gain.value = 0.72;
      highGain.gain.value = 0.18;
      low.connect(lowGain);
      high.connect(highGain);
      lowGain.connect(filter);
      highGain.connect(filter);
      filter.connect(master);
      master.connect(audio.destination);
      low.start();
      high.start();
      void audio.resume();

      const adapt = () => {
        if (!audio) return;
        const mood = audioMoodRef.current;
        const now = audio.currentTime;
        const chasing = mood.phase === 'chase';
        const approaching = mood.phase === 'approach';
        const volume = chasing ? 0.042 : approaching ? 0.026 : 0.006 + mood.fear * 0.00009;
        const base = chasing ? 58 : approaching ? 51 : 42 + mood.fear * 0.07;
        master.gain.setTargetAtTime(volume, now, 0.7);
        low.frequency.setTargetAtTime(base, now, 0.8);
        high.frequency.setTargetAtTime(base * (chasing ? 1.72 : 1.53), now, 0.9);
        filter.frequency.setTargetAtTime(chasing ? 390 : approaching ? 310 : 220, now, 0.9);
      };
      adapt();
      interval = window.setInterval(adapt, 450);
    } catch {
      if (audio) void audio.close();
      return;
    }
    return () => {
      window.clearInterval(interval);
      if (audio) {
        try {
          const now = audio.currentTime;
          // Fade the ambience before releasing its audio graph.
          const destination = audio.destination;
          void destination;
          void now;
          void audio.close();
        } catch { /* Audio is optional. */ }
      }
    };
  }, [tab, save.soundOn]);


  useEffect(() => {
    if (!save.soundOn || !chase || (chase.phase !== 'approach' && chase.phase !== 'chase')) return;
    let beat = 0;
    const interval = window.setInterval(() => {
      beat += 1;
      const intensity = chase.phase === 'chase' ? 1.35 : 0.8;
      if (beat % 3 === 0) playHorrorCue('breath', intensity);
      else playHorrorCue('step', intensity);
    }, chase.phase === 'chase' ? 560 : 920);
    return () => window.clearInterval(interval);
  }, [chase?.phase, save.soundOn]);

  useEffect(() => {
    if (!save.soundOn || !chase) return;
    if (chase.phase === 'caught') playHorrorCue('caught');
    if (chase.phase === 'escaped') playHorrorCue('escaped');
  }, [chase?.phase, save.soundOn]);

  const room = rooms.find((item) => item.id === roomId) ?? rooms[0];
  const roomUnlocked = (item: typeof rooms[number]) => save.itemsFound.length >= item.requirement;
  const horrorEvents: Record<string, { title: string; body: string; titleAr: string; bodyAr: string; fear: number }> = {
    keycard: { title: 'FOOTSTEPS BEHIND YOU', body: 'A second set of footsteps stops when you stop. The room is empty when you turn around.', titleAr: 'خطوات خلفك', bodyAr: 'تتوقف خطوات ثانية عندما تتوقف أنت. وحين تلتفت، تكون الغرفة فارغة.', fear: 14 },
    recording: { title: 'LIVE FEEDBACK', body: 'The recorder clicks by itself. A voice matching yours whispers: “I can see your hands.”', titleAr: 'تسجيل مباشر', bodyAr: 'يعمل المسجل وحده. صوت يشبه صوتك يهمس: «أستطيع رؤية يديك».', fear: 20 },
    'incident-log': { title: 'NEW ENTRY', body: 'A fresh line appears beneath the report: SUBJECT IS READING THIS NOW.', titleAr: 'إضافة جديدة', bodyAr: 'يظهر سطر جديد أسفل التقرير: الشخص يقرأ هذا الآن.', fear: 18 },
    'camera-footage': { title: 'CAMERA 04', body: 'On the monitor, something stands directly behind your character. It is not in this room.', titleAr: 'الكاميرا 04', bodyAr: 'على الشاشة، يقف شيء خلف شخصيتك مباشرة. لكنه ليس موجوداً في هذه الغرفة.', fear: 24 },
    'subject-file': { title: 'THE MISSING PHOTO', body: 'The glossy surface reflects your face. The photograph was never removed.', titleAr: 'الصورة المفقودة', bodyAr: 'يعكس السطح اللامع وجهك. الصورة لم تُنزع من الملف أصلاً.', fear: 22 },
    'handwritten-note': { title: 'FRESH INK', body: 'The ink is still wet. A final sentence forms beneath your fingers: “Too late.”', titleAr: 'حبر طازج', bodyAr: 'الحبر لا يزال رطباً. تتشكل جملة تحت أصابعك: «لقد تأخرت».', fear: 16 },
    'override-switch': { title: 'SOMETHING IN THE SHAFT', body: 'Three knocks answer from inside the wall. Then your name is spoken from the other side.', titleAr: 'شيء داخل الممر', bodyAr: 'ثلاث طرقات تأتي من داخل الجدار. ثم ينطق صوت باسمك من الجهة الأخرى.', fear: 25 },
    'live-transmission': { title: 'YOUR VOICE', body: 'The speaker repeats your last words before you say them. The transmission is ahead of you.', titleAr: 'صوتك أنت', bodyAr: 'يكرر مكبر الصوت كلماتك قبل أن تنطق بها. البث يسبقك.', fear: 28 },
  };
  function inspectObject(object: typeof room.objects[number]) {
    setInspected(object.id);
    const event = horrorEvents[object.item];
    const firstEncounter = !save.horrorSeen.includes(object.item);
    const alreadyCollected = save.itemsFound.includes(object.item);
    const nextEvidenceCount = save.itemsFound.length + (alreadyCollected ? 0 : 1);
    const triggeredHazard = nextEvidenceCount === 2 && !save.hazardSeen.includes('blackout')
      ? 'blackout'
      : nextEvidenceCount === 4 && !save.hazardSeen.includes('lockdown') ? 'lockdown' : null;
    setSave((current) => ({
      ...current,
      itemsFound: current.itemsFound.includes(object.item) ? current.itemsFound : [...current.itemsFound, object.item],
      roomsVisited: current.roomsVisited.includes(room.id) ? current.roomsVisited : [...current.roomsVisited, room.id],
      fear: firstEncounter ? Math.min(100, current.fear + (event?.fear ?? 8)) : current.fear,
      horrorSeen: firstEncounter ? [...current.horrorSeen, object.item] : current.horrorSeen,
      hazardSeen: triggeredHazard ? [...current.hazardSeen, triggeredHazard] : current.hazardSeen,
    }));
    if (triggeredHazard) {
      setHazard(triggeredHazard);
      setEncounter(null);
    } else if (event && firstEncounter) {
      setEncounter({ title: isAr ? event.titleAr : event.title, body: isAr ? event.bodyAr : event.body });
    }
  }
  function faceEncounter(action: 'hide' | 'run') {
    setSave((current) => ({ ...current, fear: Math.max(0, Math.min(100, current.fear + (action === 'hide' ? -12 : 8))) }));
    setEncounter(null);
  }
  function resolveHazard(action: 'restore' | 'hide') {
    setSave((current) => ({ ...current, fear: Math.max(0, Math.min(100, current.fear + (action === 'restore' ? 5 : -10))) }));
    setHazard(null);
  }
  useEffect(() => {
    if (tab !== 'explore' || chase) return;
    if (roomId === 'reactor' && save.itemsFound.length >= 5 && !save.horrorSeen.includes('stalker')) {
      setSave((current) => ({ ...current, horrorSeen: [...current.horrorSeen, 'stalker'], fear: Math.min(100, current.fear + 10) }));
      setStalkerRoomsSeen((seen) => seen.includes(roomId) ? seen : [...seen, roomId]);
      setStalkerPosition(16);
      setStalkerDirection(1);
      setChase({ phase: 'approach', ticks: 4 });
      return;
    }
    if (save.horrorSeen.includes('stalker') && !stalkerRoomsSeen.includes(roomId)) {
      setStalkerRoomsSeen((seen) => [...seen, roomId]);
      setStalkerPosition(16);
      setStalkerDirection(1);
      setChase({ phase: 'approach', ticks: 3 });
    }
  }, [tab, roomId, save.itemsFound.length, save.horrorSeen, chase, stalkerRoomsSeen]);

  useEffect(() => {
    if (!chase || chase.phase === 'caught' || chase.phase === 'escaped') return;
    const timer = window.setInterval(() => {
      setStalkerPosition((position) => {
        const next = position + (chase.phase === 'approach' ? 8 : 14) * stalkerDirection;
        if (next >= 88) { setStalkerDirection(-1); return 88; }
        if (next <= 12) { setStalkerDirection(1); return 12; }
        return next;
      });
      setChase((current) => {
        if (!current || current.phase === 'caught' || current.phase === 'escaped') return current;
        if (current.ticks > 1) return { ...current, ticks: current.ticks - 1 };
        return current.phase === 'approach' ? { phase: 'chase', ticks: 6 } : { phase: 'caught', ticks: 0 };
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [chase?.phase]);

  const hidingSpots: Record<string, { id: string; en: string; ar: string; side: 'left' | 'right' }[]> = {
    control: [{ id: 'console', en: 'Crawl beneath the control console', ar: 'ازحف أسفل منصة التحكم', side: 'left' }, { id: 'door', en: 'Stand behind the security door', ar: 'اختبئ خلف باب الأمن', side: 'right' }],
    security: [{ id: 'servers', en: 'Squeeze behind the server rack', ar: 'تسلل خلف خزانة الخوادم', side: 'right' }, { id: 'chair', en: 'Hide beneath the warm chair', ar: 'اختبئ أسفل الكرسي الدافئ', side: 'left' }],
    archive: [{ id: 'shelves', en: 'Hide between the archive shelves', ar: 'اختبئ بين رفوف الأرشيف', side: 'left' }, { id: 'desk', en: 'Crouch behind the open desk', ar: 'انخفض خلف المكتب المفتوح', side: 'right' }],
    reactor: [{ id: 'generator', en: 'Press against the generator housing', ar: 'التصق خلف هيكل المولد', side: 'right' }, { id: 'shaft', en: 'Climb into the maintenance shaft', ar: 'ادخل فتحة الصيانة', side: 'left' }],
  };

  function respondToChase(action: 'hide' | 'run', spotId?: string) {
    if (action === 'run') {
      setSave((current) => ({ ...current, fear: Math.min(100, current.fear + 12) }));
      setChase({ phase: 'escaped', ticks: 0 });
      return;
    }
    const spot = (hidingSpots[roomId] ?? hidingSpots.control).find((item) => item.id === spotId);
    const stalkerSide = stalkerPosition < 50 ? 'left' : 'right';
    const isConcealed = Boolean(spot && spot.side !== stalkerSide);
    if (spot && isConcealed) {
      setSave((current) => ({ ...current, fear: Math.max(0, current.fear - 8) }));
      setChase({ phase: 'escaped', ticks: 0 });
    } else {
      setSave((current) => ({ ...current, fear: Math.min(100, current.fear + 18) }));
      setChase({ phase: 'caught', ticks: 0 });
    }
  }

  const [flash, setFlash] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const t = copy[language];
  const isAr = language === 'ar';

  useEffect(() => persistSave(save), [save]);
  useEffect(() => {
    try {
      localStorage.setItem('the-last-button-language', language);
    } catch {
      // Language preference is optional when browser storage is unavailable.
    }
  }, [language]);

  const chapter = getChapter(save.presses, save.clues.length);
  const level = getLevel(save.presses);
  const unlocked = useMemo(() => achievements.filter((a) => a.clueBased ? save.clues.length >= a.target : save.presses >= a.target).map((a) => a.id), [save]);
  const currentEvent = event ?? mysteryEvents.find((e) => e.id === save.lastEvent) ?? null;

  function pressButton() {
    const nextPress = save.presses + 1;
    const nextEvent = chooseEvent(nextPress, save.seenEvents);
    const nextClues = nextEvent.kind === 'clue' && !save.clues.includes(nextEvent.id) ? [...save.clues, nextEvent.id] : save.clues;
    const nextSave = {
      ...save,
      presses: nextPress,
      clues: nextClues,
      seenEvents: [...save.seenEvents, nextEvent.id],
      lastEvent: nextEvent.id,
    };
    setSave(nextSave);
    setEvent(nextEvent);
    setFlash(true);
    window.setTimeout(() => setFlash(false), 420);
    if (save.soundOn) {
      try {
        const audio = new AudioContext();
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(180, audio.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(75, audio.currentTime + 0.16);
        gain.gain.setValueAtTime(0.08, audio.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.18);
        oscillator.connect(gain);
        gain.connect(audio.destination);
        oscillator.start();
        oscillator.stop(audio.currentTime + 0.2);
        oscillator.onended = () => void audio.close();
      } catch { /* Audio is optional. */ }
    }
  }

  function resetGame() {
    setSave(emptySave);
    setEvent(null);
    setConfirmReset(false);
    setTab('play');
  }

  return (
    <main className={`app-shell ${isAr ? 'rtl' : ''} ${flash ? 'flash' : ''}`} dir={isAr ? 'rtl' : 'ltr'}>
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <header className="topbar">
        <button className="brand" onClick={() => setTab('play')} aria-label="Home">
          <span className="brand-mark"><span /></span>
          <span className="brand-name">THE LAST BUTTON<small>{t.subtitle}</small></span>
        </button>
        <div className="top-actions">
          <span className="signal"><i />{t.status}</span>
          <button className="icon-button" onClick={() => setSettingsOpen(true)} aria-label={t.settings}><Settings2 size={18} /></button>
        </div>
      </header>

      <section className="game-layout">
        <aside className="side-panel">
          <div className="side-label">{t.chapter} 0{chapter}</div>
          <div className="chapter-title">{t.chapterNames[chapter - 1]}</div>
          <p className="chapter-copy">{t.chapterDescriptions[chapter - 1]}</p>
          <div className="side-divider" />
          <div className="stat-row"><span>{t.level}</span><strong>{String(level).padStart(2,'0')}</strong></div>
          <div className="stat-row"><span>{t.presses}</span><strong>{String(save.presses).padStart(4,'0')}</strong></div>
          <div className="stat-row"><span>{t.clues}</span><strong>{String(save.clues.length).padStart(2,'0')}</strong></div>
          <div className="side-divider" />
          <div className="side-quote"><span>“</span><p>{save.presses === 0 ? 'The first press is always the easiest.' : 'The button remembers what you do.'}</p></div>
        </aside>

        <section className="center-stage">
          {tab === 'explore' ? <div className="exploration-stage">
            <div className="stage-topline"><span><i className="tiny-dot" />{isAr ? 'منشأة 09 / منطقة محظورة' : 'FACILITY 09 / RESTRICTED AREA'}</span><span>{isAr ? 'استكشاف' : 'EXPLORATION'}</span></div>
            <div className={"room-scene " + (chase && chase.phase !== "escaped" ? "stalker-visible " + chase.phase : "")}><div className="scene-grid"/><div className="scene-light"/><div className="scene-door"/>{chase && chase.phase !== "escaped" && <div className={"scene-stalker " + chase.phase} style={{ left: stalkerPosition + '%' }} role="img" aria-label={isAr ? "ظل كيان غامض يتحرك داخل الممر" : "A shadowy figure moving through the corridor"}><i/><i/></div>}<div className="scene-console"><i/><i/><i/></div><span className="scene-code">09 // {room.id.toUpperCase()}</span><span className="scene-warning">{isAr ? 'تحذير: لا يوجد إخلاء' : 'WARNING: NO EVACUATION'}</span></div>
            <div className="room-heading"><span>{isAr ? 'الموقع الحالي' : 'CURRENT LOCATION'}</span><h1>{isAr ? room.nameAr : room.name}</h1><p>{isAr ? room.descriptionAr : room.description}</p></div>
            <div className="fear-meter"><div><span>{isAr ? 'مستوى التوتر' : 'FEAR LEVEL'}</span><strong>{save.fear}%</strong></div><i><b style={{width: `${save.fear}%`}} /></i></div>
            <div className="object-list">{room.objects.map((object) => { const found = save.itemsFound.includes(object.item); return <button className={`object-card ${found ? 'found' : ''}`} key={object.id} onClick={() => inspectObject(object)}><span className="object-icon">{found ? '✓' : '⌕'}</span><span><strong>{isAr ? object.nameAr : object.name}</strong><small>{found ? (isAr ? 'تم فحصه' : 'INSPECTED') : (isAr ? 'افحص العنصر' : 'INSPECT OBJECT')}</small></span><b>›</b></button>; })}</div>
            {inspected && <div className="inspection-result"><span>{isAr ? 'نتيجة الفحص' : 'INSPECTION RESULT'}</span><p>{isAr ? room.objects.find((item) => item.id === inspected)?.detailAr : room.objects.find((item) => item.id === inspected)?.detail}</p></div>}
            {encounter && <div className="horror-encounter" role="alert"><span className="horror-kicker">{isAr ? 'تحذير / حدث غير معروف' : 'WARNING / UNKNOWN EVENT'}</span><h2>{encounter.title}</h2><p>{encounter.body}</p><div className="encounter-actions"><button onClick={() => faceEncounter('hide')}>{isAr ? 'اختبئ واحبس أنفاسك' : 'HIDE & HOLD BREATH'}</button><button onClick={() => faceEncounter('run')}>{isAr ? 'اهرب الآن' : 'RUN NOW'}</button></div></div>}
            {chase && <div className={`stalker-event ${chase.phase}`} role="alert">
              <span className="horror-kicker">{isAr ? 'تهديد متحرك / المنشأة 09' : 'MOBILE THREAT / FACILITY 09'}</span>
              {chase.phase === 'approach' && <>
                <h2>{isAr ? 'إنه يقترب...' : 'IT IS GETTING CLOSER...'}</h2>
                <p>{isAr ? `تسمع خطوات ثقيلة في الممر. شيء ما يبحث عنك. أمامك ${chase.ticks} ثوانٍ لتختبئ.` : `Heavy footsteps echo down the corridor. Something is searching for you. You have ${chase.ticks} seconds to hide.`}</p>
              </>}
              {chase.phase === 'chase' && <>
                <h2>{isAr ? 'لقد رآك! اهرب!' : 'IT HAS FOUND YOU. RUN!'}</h2>
                <p>{isAr ? `الكيان يركض نحوك. تحرك الآن، بقيت ${chase.ticks} ثوانٍ.` : `The figure is charging toward you. Move now. ${chase.ticks} seconds remain.`}</p>
              </>}
              {chase.phase === 'caught' && <>
                <h2>{isAr ? 'أمسك بك...' : 'IT CAUGHT YOU...'}</h2>
                <p>{isAr ? 'تستيقظ قرب باب المولد. لم يتركك تخرج، لكنه ابتعد للحظة.' : 'You wake beside the generator door. It did not let you leave—but it has moved away for now.'}</p>
                <div className="encounter-actions"><button onClick={() => { setStalkerPosition(16); setStalkerDirection(1); setChase({ phase: 'approach', ticks: 4 }); }}>{isAr ? 'حاول مرة أخرى' : 'TRY AGAIN'}</button></div>
              </>}
              {chase.phase === 'escaped' && <>
                <h2>{isAr ? 'نجوت... هذه المرة' : 'YOU SURVIVED. THIS TIME.'}</h2>
                <p>{isAr ? 'تبتعد الخطوات خلف الباب. لكنك تعرف الآن أنه يستطيع الوصول إليك.' : 'The footsteps fade beyond the door. Now you know it can reach you.'}</p>
                <div className="encounter-actions"><button onClick={() => setChase(null)}>{isAr ? 'تابع الاستكشاف' : 'CONTINUE EXPLORING'}</button></div>
              </>}
              {(chase.phase === 'approach' || chase.phase === 'chase') && <>
                <div className="hiding-choice-heading">{isAr ? 'اختر مكان اختبائك — ليس كل مكان آمن' : 'CHOOSE A HIDING PLACE — NOT EVERY SPOT IS SAFE'}</div>
                <div className="hiding-choices">
                  {(hidingSpots[roomId] ?? hidingSpots.control).map((spot) => <button key={spot.id} onClick={() => respondToChase('hide', spot.id)}>{isAr ? spot.ar : spot.en}</button>)}
                </div>
                <div className="encounter-actions"><button onClick={() => respondToChase('run')}>{isAr ? 'اترك المكان واركض' : 'ABANDON COVER & RUN'}</button></div>
              </>}
            </div>}
            {hazard && <div className={`environment-hazard ${hazard}`} role="alert">
              <span className="horror-kicker">{isAr ? 'خطر بيئي / منشأة 09' : 'FACILITY 09 / ENVIRONMENTAL HAZARD'}</span>
              <h2>{hazard === 'blackout' ? (isAr ? 'انقطاع كامل للكهرباء' : 'TOTAL POWER FAILURE') : (isAr ? 'إغلاق أمني طارئ' : 'EMERGENCY LOCKDOWN')}</h2>
              <p>{hazard === 'blackout' ? (isAr ? 'تنطفئ الأضواء دفعة واحدة. تسمع حركة سريعة قرب الباب، ثم يتوقف كل شيء.' : 'Every light dies at once. Something moves quickly near the door, then everything stops.') : (isAr ? 'تُغلق الأبواب تلقائياً. يعلن النظام أن شخصاً غير مصرح له يتحرك داخل المنشأة.' : 'The doors seal automatically. The system reports an unauthorized presence moving through the facility.')}</p>
              <div className="encounter-actions">
                <button onClick={() => resolveHazard('restore')}>{hazard === 'blackout' ? (isAr ? 'شغّل الطاقة الاحتياطية' : 'RESTORE BACKUP POWER') : (isAr ? 'فعّل تجاوز القفل' : 'OVERRIDE LOCKDOWN')}</button>
                <button onClick={() => resolveHazard('hide')}>{isAr ? 'اختبئ وانتظر' : 'HIDE & WAIT'}</button>
              </div>
            </div>}
            <button className="back-button" onClick={() => setTab('play')}>{isAr ? 'العودة إلى الزر' : 'RETURN TO THE BUTTON'}</button>
          </div> : <><div className="stage-topline"><span><i className="tiny-dot" />{t.status}</span><span>NO. {String(save.presses + 1).padStart(5,'0')}</span></div>
          <div className="button-zone">
            <div className="orbit orbit-a" /><div className="orbit orbit-b" />
            <div className="button-halo" />
            <button className="main-button" onClick={pressButton} aria-label={t.press}>
              <span className="button-inner"><span className="button-core" /><span className="button-word">{t.press}</span></span>
            </button>
            <div className="button-shadow" />
          </div>
          <div className="event-panel" aria-live="polite">
            <div className="event-kicker"><Sparkles size={12} />{currentEvent ? t.kinds[currentEvent.kind] : t.recent}</div>
            <h1 key={currentEvent?.id ?? 'start'}>{currentEvent ? currentEvent.title : t.begin}</h1>
            <p>{currentEvent ? currentEvent.body : t.beginBody}</p>
            {currentEvent?.kind === 'clue' && <span className="event-note"><Eye size={13} />{t.firstSecret}</span>}
          </div>
          <div className="stage-footer"><span>{t.footer}</span><span>{save.presses === 0 ? '— — —' : '● ● ●'}</span></div></>}
        </section>

        <aside className="right-panel">
          <div className="panel-tabs">
            <button className={tab === 'play' ? 'active' : ''} onClick={() => setTab('play')}><CircleHelp size={15}/>{t.play}</button>
            <button className={tab === 'explore' ? 'active' : ''} onClick={() => { setTab('explore'); setInspected(null); }}><Eye size={15}/>{isAr ? 'استكشف' : 'EXPLORE'}</button>
            <button className={tab === 'archive' ? 'active' : ''} onClick={() => setTab('archive')}><Archive size={15}/>{t.archive}</button>
            <button className={tab === 'records' ? 'active' : ''} onClick={() => setTab('records')}><Trophy size={15}/>{t.records}</button>
          </div>
          {tab === 'explore' && <div className="right-content explore-content">
            <div className="section-heading"><span>{isAr ? 'خريطة المنشأة 09' : 'FACILITY 09 MAP'}</span><Eye size={15}/></div>
            <p className="explore-hint">{isAr ? 'اختر موقعاً لاستكشافه. بعض الأبواب تحتاج إلى أدلة.' : 'Select a location to explore. Some doors require evidence.'}</p>
            {rooms.map((item, index) => { const open = roomUnlocked(item); return <button key={item.id} className={`room-select ${roomId === item.id ? 'selected' : ''} ${!open ? 'locked' : ''}`} disabled={!open} onClick={() => { setRoomId(item.id); setInspected(null); }}><span className="room-number">0{index + 1}</span><span className="room-label"><strong>{isAr ? item.nameAr : item.name}</strong><small>{open ? (save.roomsVisited.includes(item.id) ? (isAr ? 'تمت الزيارة' : 'VISITED') : (isAr ? 'متاح' : 'AVAILABLE')) : (isAr ? `مطلوب ${item.requirement} أدلة` : `NEED ${item.requirement} ITEMS`)}</small></span><span className="room-state">{open ? '›' : '⌑'}</span></button>; })}
            <div className="explore-count">{isAr ? 'الأدلة التي جمعتها' : 'EVIDENCE COLLECTED'} <strong>{save.itemsFound.length}/8</strong></div>
          </div>}
          {tab === 'play' && <div className="right-content">
            <div className="section-heading"><span>{t.recent}</span><AudioLines size={15}/></div>
            {currentEvent ? <div className="transmission-card"><span className={`rarity ${currentEvent.rarity}`}>{t.rarity[currentEvent.rarity]}</span><h3>{currentEvent.title}</h3><p>{currentEvent.body}</p><small>{String(save.presses).padStart(4,'0')} / {t.presses}</small></div> : <div className="empty-card"><LockKeyhole size={22}/><p>{t.empty}</p><small>{t.emptyHint}</small></div>}
            <div className="mini-progress"><div className="section-heading"><span>{t.achievements}</span><span>{unlocked.length}/{achievements.length}</span></div><div className="progress-track"><i style={{width:`${unlocked.length / achievements.length * 100}%`}} /></div></div>
          </div>}
          {tab === 'archive' && <div className="right-content">
            <div className="section-heading"><span>{t.archive}</span><BookOpen size={15}/></div>
            {save.clues.length ? save.clues.map((id,index) => { const clue = mysteryEvents.find((e) => e.id === id)!; return <article className="clue-card" key={id}><span>FRAGMENT 0{index+1}</span><h3>{clue.title}</h3><p>{clue.body}</p></article>; }) : <div className="empty-card"><LockKeyhole size={22}/><p>{t.empty}</p><small>{t.emptyHint}</small></div>}
          </div>}
          {tab === 'records' && <div className="right-content">
            <div className="section-heading"><span>{t.achievements}</span><Trophy size={15}/></div>
            {achievements.map((item) => { const done = unlocked.includes(item.id); return <article className={`achievement ${done ? 'done' : ''}`} key={item.id}><span className="achievement-icon"><Trophy size={15}/></span><div><h3>{item.title}</h3><p>{item.description}</p></div><span className="achievement-state">{done ? t.unlocked : t.locked}</span></article>; })}
          </div>}
        </aside>
      </section>

      <footer className="bottom-bar"><span>© THE LAST BUTTON</span><span>BUILD 0.1.0 <b>•</b> {t.footer}</span><span> <span className="online-dot" /> LOCAL SESSION</span></footer>

      {settingsOpen && <div className="modal-backdrop" onClick={() => setSettingsOpen(false)}>
        <section className="settings-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-heading"><div><span>CONTROL ROOM</span><h2>{t.settings}</h2></div><button className="icon-button" onClick={() => setSettingsOpen(false)}><X size={18}/></button></div>
          <div className="setting-line"><div><strong>{t.sound}</strong><small>Subtle atmospheric feedback</small></div><button className={`switch ${save.soundOn ? 'on' : ''}`} onClick={() => setSave((s) => ({...s,soundOn:!s.soundOn}))}>{save.soundOn ? <Volume2 size={15}/> : <VolumeX size={15}/>}</button></div>
          <div className="setting-line"><div><strong>{t.language}</strong><small>English / العربية</small></div><button className="language-toggle" onClick={() => setLanguage((l) => l === 'en' ? 'ar' : 'en')}>{language === 'en' ? 'EN' : 'عربي'}</button></div>
          <div className="setting-line"><div><strong>{t.reset}</strong><small>All clues and records will be erased</small></div><button className="reset-button" onClick={() => setConfirmReset(true)}><RotateCcw size={15}/></button></div>
          {confirmReset && <div className="confirm-box"><p>{t.resetConfirm}</p><div><button onClick={() => setConfirmReset(false)}>{t.cancel}</button><button className="danger-button" onClick={resetGame}>{t.confirm}</button></div></div>}
          <div className="modal-foot"><span><LockKeyhole size={12}/> SAVED ON THIS DEVICE</span><span>V 0.1.0</span></div>
        </section>
      </div>}
      <button className="mobile-archive" onClick={() => setTab(tab === 'archive' ? 'play' : 'archive')}><Archive size={17}/>{t.archive}<ChevronRight size={15}/></button>
    </main>
  );
}

export default App;
