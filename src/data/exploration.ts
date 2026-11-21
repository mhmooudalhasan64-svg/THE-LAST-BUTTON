export type Room = {
  id: string; name: string; nameAr: string; description: string; descriptionAr: string; requirement: number;
  objects: { id: string; name: string; nameAr: string; detail: string; detailAr: string; item: string }[];
};
export const rooms: Room[] = [
 { id:'control', name:'CONTROL ROOM', nameAr:'غرفة التحكم', description:'The button is here. Emergency lights pulse behind the glass. A door marked SECURITY is locked.', descriptionAr:'الزر هنا. أضواء الطوارئ تومض خلف الزجاج. باب الأمن مغلق.', requirement:0, objects:[
  {id:'keycard',name:'ACCESS CARD',nameAr:'بطاقة دخول',detail:'A cracked card reads: FACILITY 09 — SECURITY ACCESS.',detailAr:'بطاقة متشققة كُتب عليها: المنشأة 09 — تصريح دخول الأمن.',item:'keycard'},
  {id:'recorder',name:'VOICE RECORDER',nameAr:'مسجل صوتي',detail:'A whisper says: If the lights turn red, do not trust the person at the door.',detailAr:'همسة تقول: إذا تحولت الأضواء إلى الأحمر، فلا تثق بالشخص خلف الباب.',item:'recording'}
 ]},
 { id:'security',name:'SECURITY WING',nameAr:'جناح الأمن',description:'Dead monitors face a chair that is still warm. One screen shows the room you just left.',descriptionAr:'شاشات معطلة تواجه كرسياً لا يزال دافئاً. شاشة تعرض الغرفة التي غادرتها للتو.',requirement:1,objects:[
  {id:'log',name:'INCIDENT LOG 09',nameAr:'سجل الحوادث 09',detail:'SUBJECT AWAKENED. Memory wipe incomplete. Do not let the subject reach the archive.',detailAr:'استيقظ الشخص. محو الذاكرة غير مكتمل. لا تسمحوا له بالوصول إلى الأرشيف.',item:'incident-log'},
  {id:'monitor',name:'CAMERA 04',nameAr:'الكاميرا 04',detail:'The footage shows you entering this room eleven minutes before you woke up.',detailAr:'التسجيل يظهر دخولك إلى هذه الغرفة قبل استيقاظك بإحدى عشرة دقيقة.',item:'camera-footage'}
 ]},
 { id:'archive',name:'RESTRICTED ARCHIVE',nameAr:'الأرشيف المحظور',description:'Most files are burned. One folder is marked with your subject number.',descriptionAr:'معظم الملفات محترقة. ملف واحد يحمل رقمك التجريبي.',requirement:3,objects:[
  {id:'file',name:'SUBJECT 09',nameAr:'الشخص 09',detail:'The subject requested the experiment. The subject is the only survivor.',detailAr:'الشخص هو من طلب التجربة. وهو الناجي الوحيد.',item:'subject-file'},
  {id:'note',name:'HANDWRITTEN NOTE',nameAr:'ملاحظة بخط اليد',detail:'You did not come here to escape. You came here to finish what you started.',detailAr:'لم تأتِ إلى هنا لتهرب. أتيت لتُنهي ما بدأته.',item:'handwritten-note'}
 ]},
 { id:'reactor',name:'LOWER GENERATOR',nameAr:'المولد السفلي',description:'The generator runs without fuel. Something knocks from inside the maintenance shaft.',descriptionAr:'المولد يعمل بلا وقود. شيء ما يطرق من داخل فتحة الصيانة.',requirement:5,objects:[
  {id:'switch',name:'OVERRIDE SWITCH',nameAr:'مفتاح التجاوز',detail:'Wired to the central button. Warning: ONE FINAL CYCLE ONLY.',detailAr:'موصول بالزر المركزي. تحذير: دورة أخيرة واحدة فقط.',item:'override-switch'},
  {id:'voice',name:'LIVE TRANSMISSION',nameAr:'بث مباشر',detail:'Your own voice says: Whatever you do, do not press it for me.',detailAr:'صوتك أنت يقول: مهما فعلت، لا تضغطه نيابةً عني.',item:'live-transmission'}
 ]}
];