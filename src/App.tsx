import { useEffect, useMemo, useState } from 'react';
import { Archive, AudioLines, BookOpen, ChevronRight, CircleHelp, Eye, LockKeyhole, RotateCcw, Settings2, Sparkles, Trophy, Volume2, VolumeX, X } from 'lucide-react';
import { mysteryEvents, chooseEvent, type MysteryEvent } from './data/events';
import { achievements, getChapter, getLevel } from './engine/progression';
import { emptySave, loadSave, persistSave, type GameSave } from './engine/save';
import { rooms } from './data/exploration';

type Tab = 'play' | 'explore' | 'archive' | 'records';
type Language = 'en' | 'ar';

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
  const room = rooms.find((item) => item.id === roomId) ?? rooms[0];
  const roomUnlocked = (item: typeof rooms[number]) => save.itemsFound.length >= item.requirement;
  function inspectObject(object: typeof room.objects[number]) {
    setInspected(object.id);
    if (!save.itemsFound.includes(object.item)) setSave((current) => ({ ...current, itemsFound: [...current.itemsFound, object.item] }));
    if (!save.roomsVisited.includes(room.id)) setSave((current) => ({ ...current, roomsVisited: [...current.roomsVisited, room.id] }));
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
            <div className="room-scene"><div className="scene-grid"/><div className="scene-light"/><div className="scene-door"/><div className="scene-console"><i/><i/><i/></div><span className="scene-code">09 // {room.id.toUpperCase()}</span><span className="scene-warning">{isAr ? 'تحذير: لا يوجد إخلاء' : 'WARNING: NO EVACUATION'}</span></div>
            <div className="room-heading"><span>{isAr ? 'الموقع الحالي' : 'CURRENT LOCATION'}</span><h1>{isAr ? room.nameAr : room.name}</h1><p>{isAr ? room.descriptionAr : room.description}</p></div>
            <div className="object-list">{room.objects.map((object) => { const found = save.itemsFound.includes(object.item); return <button className={`object-card ${found ? 'found' : ''}`} key={object.id} onClick={() => inspectObject(object)}><span className="object-icon">{found ? '✓' : '⌕'}</span><span><strong>{isAr ? object.nameAr : object.name}</strong><small>{found ? (isAr ? 'تم فحصه' : 'INSPECTED') : (isAr ? 'افحص العنصر' : 'INSPECT OBJECT')}</small></span><b>›</b></button>; })}</div>
            {inspected && <div className="inspection-result"><span>{isAr ? 'نتيجة الفحص' : 'INSPECTION RESULT'}</span><p>{isAr ? room.objects.find((item) => item.id === inspected)?.detailAr : room.objects.find((item) => item.id === inspected)?.detail}</p></div>}
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
