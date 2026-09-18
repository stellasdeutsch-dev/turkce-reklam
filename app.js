/* REKLAM · Alterna Timur — interactions, no dependencies */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- toast ---------- */
  let toastT;
  function toast(msg, ms = 2600) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), ms);
  }

  /* ---------- speech (tr-TR) ---------- */
  let trVoice = null, warned = false;
  const loadVoices = () => {
    if (!('speechSynthesis' in window)) return;
    const vs = speechSynthesis.getVoices();
    trVoice = vs.find(v => /^tr(-|_|$)/i.test(v.lang)) || null;
  };
  if ('speechSynthesis' in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
  function speak(text, btn) {
    if (!('speechSynthesis' in window)) { toast('Озвучка не поддерживается в этом браузере'); return; }
    const t = String(text).replace(/%\s?(\d+)/g, 'yüzde $1');
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    u.lang = 'tr-TR'; u.rate = .88; if (trVoice) u.voice = trVoice;
    speechSynthesis.speak(u);
    if (!trVoice && !warned) { warned = true; toast('На устройстве нет турецкого голоса. Читаю как могу'); }
    if (btn) { btn.classList.remove('on'); void btn.offsetWidth; btn.classList.add('on'); }
  }
  const sayBtn = (t, label = 'Озвучить') => `<button class="say" data-say="${esc(t)}" aria-label="${label}: ${esc(t)}">🔊</button>`;
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-say],[data-say-el]');
    if (!b) return;
    e.stopPropagation();
    const text = b.dataset.say || ($('#' + b.dataset.sayEl) || {}).textContent || '';
    speak(text, b);
  });

  function card(el, w, dark) {
    el.innerHTML = `
      <p class="wc-tr">${esc(w.tr)} ${sayBtn(w.say || w.tr)}</p>
      <p class="wc-pr">[${esc(w.pr)}]</p>
      <p class="wc-ru">${esc(w.ru)}</p>
      ${w.ex ? `<p class="wc-ex"><b>${esc(w.ex)}</b> ${sayBtn(w.ex, 'Пример')}<br>${esc(w.exRu)}</p>` : ''}
      ${w.note ? `<p class="wc-note">${esc(w.note)}</p>` : ''}`;
    el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
  }
  const mini = w => `<div class="mini"><b>${esc(w.tr)}</b><span>[${esc(w.pr)}] ${esc(w.ru)}</span>${sayBtn(w.say || w.tr)}${w.note ? `<i>${esc(w.note)}</i>` : ''}</div>`;

  /* =========================================================
     DATA
     ========================================================= */
  const LIVERY = [
    { tr: 'reklam', pr: 'рекла́м', ru: 'реклама', ex: 'Bu reklam çok komik.', exRu: 'Эта реклама очень смешная.', note: '(Редкий случай. Запиши дату.)',
      d: { x: 420, y: 146, w: 200, h: 30, r: 0, bg: '#D7EA1A', fg: '#00362F', fs: 22, t: 'REKLAM' } },
    { tr: 'marka', pr: 'ма́рка', ru: 'бренд', ex: 'Telefonun markası ne?', exRu: 'Какой марки твой телефон?', note: '(Почтовая марка это pul. Не перепутай на почте.)',
      d: { x: 250, y: 126, w: 96, h: 22, r: -6, bg: '#fff', fg: '#00594F', fs: 14, t: 'MARKA' } },
    { tr: 'logo', pr: 'ло́го', ru: 'логотип', ex: 'Logoyu kaputa koyalım.', exRu: 'Давай поставим лого на капот.', note: '(Турки тоже говорят kaput. Но у них это капот, а не конец.)',
      d: { x: 104, y: 63, w: 100, h: 16, r: 0, bg: '#fff', fg: '#111', fs: 12, t: 'LOGO' } },
    { tr: 'sponsor', pr: 'спонсо́р', ru: 'спонсор', ex: 'Takımın ana sponsoru kim?', exRu: 'Кто главный спонсор команды?', note: '(ana значит «главный». И ещё «мама». Логично.)',
      d: { x: 640, y: 150, w: 130, h: 20, r: 10, bg: '#111', fg: '#D7EA1A', fs: 13, t: 'SPONSOR' } },
    { tr: 'slogan', pr: 'слога́н', ru: 'слоган', ex: 'Bu slogan akılda kalıcı.', exRu: 'Этот слоган запоминается.', note: '(akılda kalıcı дословно «остающийся в уме».)',
      d: { x: 705, y: 175, w: 140, h: 10, r: 0, bg: '#D7EA1A', fg: '#111', fs: 8, t: 'SLOGAN' } },
    { tr: 'tanıtım', pr: 'таныты́м', ru: 'продвижение, презентация', ex: 'Yeni ürünün tanıtımı yarın.', exRu: 'Презентация нового продукта завтра.', note: '(Корень tanı-, как в tanışmak. Реклама это знакомство, на которое тебя не спросили.)',
      d: { x: 362, y: 90, w: 68, h: 18, r: 0, bg: '#fff', fg: '#111', fs: 10, t: 'TANITIM' } },
    { tr: 'hedef kitle', pr: 'хеде́ф китле́', ru: 'целевая аудитория', ex: 'Hedef kitlemiz gençler.', exRu: 'Наша целевая аудитория молодёжь.', note: '(hedef цель, kitle масса. Масса, в которую целятся.)',
      d: { x: 410, y: 181, w: 170, h: 10, r: 0, bg: '#fff', fg: '#111', fs: 8, t: 'HEDEF KİTLE' } },
    { tr: 'reklam panosu', pr: 'рекла́м пано́су', ru: 'билборд, рекламный щит', ex: 'Yolda dev bir reklam panosu var.', exRu: 'На дороге огромный билборд.', note: '(pano это щит. -su потому что «щит чего». Щит рекламы.)',
      d: { x: 84, y: 108, w: 84, h: 16, r: 82, bg: '#D7EA1A', fg: '#111', fs: 9, t: 'PANO' } },
  ];
  const BOX = [
    { tr: 'reklam ajansı', pr: 'рекла́м ажансы́', ru: 'рекламное агентство' },
    { tr: 'reklamcı', pr: 'рекламджы́', ru: 'рекламщик', note: '-cı значит профессию. Как kahveci, продавец кофе.' },
    { tr: 'reklam filmi', pr: 'рекла́м фильми́', ru: 'рекламный ролик', note: 'Фильм на 30 секунд. Оскар не дают.' },
    { tr: 'müşteri', pr: 'мюштери́', ru: 'клиент', note: 'Müşteri her zaman haklıdır. Клиент всегда прав.' },
    { tr: 'tüketici', pr: 'тюкетиджи́', ru: 'потребитель', note: 'От tüketmek, потреблять.' },
    { tr: 'pazarlama', pr: 'пазарлама́', ru: 'маркетинг', note: 'pazar это рынок. И воскресенье. Турки маркетят даже в выходной.' },
  ];
  const SIGNS = [
    { f: 'İNDİRİM!', v: 1, tr: 'İndirim', pr: 'индири́м', ru: 'скидка', nt: 'Büyük indirim! Маленькую так не пишут.' },
    { f: 'KAMPANYA', v: 2, tr: 'Kampanya', pr: 'кампа́нья', ru: 'акция', nt: 'Kampanyalı ürünler: товары по акции. Не военная кампания.' },
    { f: '%50', v: 3, tr: '%50', say: 'yüzde elli', pr: 'юзде́ элли́', ru: '50 процентов', nt: 'Процент пишут перед числом. И читают так же.' },
    { f: '1 ALANA<br>1 BEDAVA', v: 4, tr: '1 alana 1 bedava', say: 'bir alana bir bedava', pr: 'бир ала́на бир бедава́', ru: 'купи один, второй даром', nt: 'Дословно: берущему один, один даром.' },
    { f: 'SON GÜN!', v: 5, tr: 'Son gün', pr: 'сон гюн', ru: 'последний день', nt: 'Может висеть три недели. Лично проверял.' },
    { f: 'STOKLARLA SINIRLIDIR', v: 6, tr: 'Stoklarla sınırlıdır', pr: 'стокларла́ сынырлыды́р', ru: 'количество ограничено', nt: 'Дословно: «ограничено запасами».' },
    { f: 'PEŞİN FİYATINA<br>12 TAKSİT', v: 1, tr: 'Peşin fiyatına 12 taksit', say: 'Peşin fiyatına on iki taksit', pr: 'пеши́н фиятына́ он ики́ такси́т', ru: '12 платежей по цене наличных', nt: 'Taksit не такси. Это рассрочка. В Турции так берут даже кроссовки.' },
    { f: 'ÜCRETSİZ<br>KARGO', v: 2, tr: 'Ücretsiz kargo', pr: 'юджретси́з карго́', ru: 'бесплатная доставка', nt: 'kargo это посылка, а не корабль с контейнерами.' },
    { f: 'YENİ', v: 3, tr: 'Yeni', pr: 'ени́', ru: 'новинка, новый', nt: 'Yeni sezon: новый сезон.' },
    { f: 'SEZON<br>SONU', v: 4, tr: 'Sezon sonu', pr: 'сезо́н сону́', ru: 'конец сезона, распродажа', nt: 'Sezon sonu indirimi: распродажа в конце сезона.' },
    { f: 'HEDİYE', v: 5, tr: 'Hediye', pr: 'хедийе́', ru: 'подарок', nt: 'Her alışverişte hediye! Подарок при каждой покупке.' },
    { f: 'FIRSAT!', v: 6, tr: 'Fırsat', pr: 'фырса́т', ru: 'выгодное предложение', nt: 'Kaçırılmayacak fırsat: предложение, которое нельзя упустить.' },
  ];
  const WHERE = [
    { tr: 'vitrin', pr: 'витри́н', ru: 'витрина' },
    { tr: 'tabela', pr: 'табе́ла', ru: 'вывеска', note: 'Первое, что читаешь на улице.' },
    { tr: 'afiş', pr: 'афи́ш', ru: 'плакат, афиша' },
    { tr: 'el ilanı', pr: 'эль иланы́', ru: 'листовка', note: 'el это рука. Объявление, которое суют в руку.' },
    { tr: 'broşür', pr: 'брошю́р', ru: 'буклет' },
    { tr: 'ilan panosu', pr: 'ила́н пано́су', ru: 'доска объявлений' },
  ];
  const FF = [
    { w: 'kampanya', think: 'избирательная кампания', real: 'в магазине это <b>акция</b>', ex: 'Bu hafta kampanya var.', exRu: 'На этой неделе акция.' },
    { w: 'fırsat', think: 'возможность, шанс', real: 'в рекламе это <b>выгодное предложение</b>', ex: 'Günün fırsatı!', exRu: 'Предложение дня!' },
    { w: 'ilan', think: 'реклама', real: '<b>объявление</b>. Kiralık сдаётся, satılık продаётся, iş ilanı вакансия', ex: 'Kiralık daire ilanı', exRu: 'Объявление о сдаче квартиры. (Искал жильё в Анталье. Слово kiralık знаю лучше, чем своё имя.)' },
    { w: 'marka', think: 'почтовая марка', real: '<b>бренд</b>. Почтовая марка это pul', ex: 'Hangi marka?', exRu: 'Какой бренд? (Первый вопрос любого турка про твои кроссовки.)' },
    { w: 'taksit', think: 'что-то про такси', real: '<b>рассрочка, платёж</b>', ex: 'Kaç taksit olsun?', exRu: 'На сколько платежей разбить? (Спрашивают на кассе. Даже за кофеварку.)' },
    { w: 'bedava / ücretsiz', think: 'одно и то же', real: '<b>bedava</b> разговорное «даром», <b>ücretsiz</b> официальное «бесплатно»', ex: 'Çay bedava!', exRu: 'Чай даром! На упаковке будет ücretsiz, на базаре bedava.' },
    { w: 'afiş / el ilanı', think: 'и то и то «афиша»', real: '<b>afiş</b> висит на стене, <b>el ilanı</b> суют в руку', ex: 'Metroda el ilanı dağıtıyorlar.', exRu: 'В метро раздают листовки.' },
    { w: 'reklam arası', think: '«между рекламой»', real: '<b>рекламная пауза</b>. arası это промежуток', ex: 'Reklam arasında çay koy.', exRu: 'В рекламную паузу поставь чай. (Главное правило турецкого футбола.)' },
  ];
  const ONLINE = [
    { tr: 'Sponsorlu', pr: 'спонсорлу́', ru: 'спонсорский пост', note: 'Реклама, которая притворяется другом.' },
    { tr: 'Reklamı atla', pr: 'рекламы́ атла́', ru: 'пропустить рекламу', note: 'atlamak значит прыгать. Перепрыгни рекламу.' },
    { tr: 'Abone ol', pr: 'абоне́ ол', ru: 'подпишись (на канал)' },
    { tr: 'Takip et', pr: 'таки́п эт', ru: 'подпишись (на аккаунт)', note: 'Дословно «следи». Инстаграм честнее, чем кажется.' },
    { tr: 'Beğen', pr: 'бээ́н', ru: 'лайкни', note: 'ğ не читается, только тянет гласную.' },
    { tr: 'Paylaş', pr: 'пайла́ш', ru: 'поделись' },
    { tr: 'Kaydet', pr: 'кайдэ́т', ru: 'сохрани' },
    { tr: 'Yorum yap', pr: 'йору́м яп', ru: 'оставь комментарий' },
    { tr: 'Bildirimleri aç', pr: 'бильдиримлери́ ач', ru: 'включи уведомления' },
    { tr: 'Sepete ekle', pr: 'сепете́ экле́', ru: 'добавь в корзину', note: 'sepet это корзина.' },
    { tr: 'Hemen satın al', pr: 'хеме́н саты́н ал', ru: 'купи прямо сейчас', note: 'hemen значит «сразу». Любимое слово рекламщиков.' },
    { tr: 'Kaydır', pr: 'кайды́р', ru: 'листай, свайпни' },
  ];
  const TV = [
    ['Al', 'Al', 'ın', 'бери / берите'], ['Gel', 'Gel', 'in', 'приходи / приходите'],
    ['Dene', 'Dene', 'yin', 'попробуй / попробуйте'], ['Kaçırma', 'Kaçırma', 'yın', 'не упусти / не упустите'],
    ['Tıkla', 'Tıkla', 'yın', 'кликни / кликните'], ['Abone ol', 'Abone ol', 'un', 'подпишись / подпишитесь'],
    ['Takip et', 'Takip e', 'din', 'подпишись / подпишитесь'], ['Keşfet', 'Keşfe', 'din', 'открой / откройте'],
  ];
  const SLOGAN = {
    u: [{ tr: 'Kaçırma!', ru: 'Не упусти!' }, { tr: 'Sadece bugün!', ru: 'Только сегодня!' }, { tr: 'Son 3 gün!', say: 'Son üç gün!', ru: 'Последние 3 дня!' }, { tr: 'Acele et!', ru: 'Поторопись!' }],
    p: [{ b: 'ayakkabı', s: 'larda', v: 'ı', ru: 'На всю обувь' }, { b: 'telefon', s: 'larda', v: 'o', ru: 'На все телефоны' }, { b: 'kitap', s: 'larda', v: 'a', ru: 'На все книги' }, { b: 'simit', s: 'lerde', v: 'i', ru: 'На все симиты' }, { b: 'kahve', s: 'lerde', v: 'e', ru: 'На весь кофе' }],
    o: [{ tr: '%30 indirim', say: 'yüzde otuz indirim', ru: 'скидка 30%' }, { tr: '1 alana 1 bedava', say: 'bir alana bir bedava', ru: 'купи один, второй даром' }, { tr: 'ücretsiz kargo', ru: 'бесплатная доставка' }, { tr: 'peşin fiyatına 6 taksit', say: 'peşin fiyatına altı taksit', ru: '6 платежей по цене наличных' }],
  };
  const QUIZ = [
    { q: 'На витрине написано İNDİRİM. Это…', o: ['скидка', 'новинка', 'закрыто', 'название магазина'], fb: 'indirim это скидка. Не сеть магазинов. Проверено мной.' },
    { q: 'Как прочитать %40?', o: ['yüzde kırk', 'kırk yüzde', 'kırk yüz', 'yüz kırk'], fb: 'Процент впереди: yüzde kırk.' },
    { q: 'В объявлении о квартире: «Kiralık». Это…', o: ['сдаётся', 'продаётся', 'вакансия', 'скидка'], fb: 'Kiralık сдаётся. Satılık продаётся.' },
    { q: '«1 alana 1 bedava» значит…', o: ['купи один, второй даром', 'скидка на первый товар', 'один товар в одни руки', 'бесплатная доставка'], fb: 'alana это «берущему». Берущему один, один даром.' },
    { q: 'Кнопка «пропустить рекламу» на YouTube:', o: ['Reklamı atla', 'Reklam ver', 'Reklam yap', 'Abone ol'], fb: 'atlamak значит прыгать. Перепрыгиваешь рекламу.' },
    { q: 'Вежливая форма от «Kaçırma!»:', o: ['Kaçırmayın!', 'Kaçırmasın!', 'Kaçırmıyor!', 'Kaçırdın!'], fb: '-yın это вежливое «вы». Так говорит банк.' },
    { q: '«Ücretsiz kargo» это…', o: ['бесплатная доставка', 'грузовой корабль', 'бесплатная упаковка', 'платная доставка'], fb: 'kargo это доставка посылок.' },
    { q: 'Про друга: «Yine kendi reklamını yapıyor». Он…', o: ['хвастается', 'дал объявление', 'работает в агентстве', 'смотрит рекламу'], fb: 'kendi reklamını yapmak значит пиарить себя.' },
    { q: 'Листовка, которую суют в руку:', o: ['el ilanı', 'afiş', 'tabela', 'vitrin'], fb: 'el это рука. Объявление в руку.' },
    { q: 'В магазине «kampanya» это…', o: ['акция', 'избирательная кампания', 'военный поход', 'касса'], fb: 'В магазине kampanya значит акция.' },
  ];
  const VIDEOS = [
    { id: 'cizgi', t: 'Мультики', cap: '<b>Alterna Çizgi</b>Каталог мультфильмов по уровням: уровень, жанр, где смотреть, кнопка «случайный мультик».' },
    { id: 'podcasts', t: 'Подкасты', cap: '<b>Alterna Podcasts</b>Подкасты A1–C1 и схема «как слушать, чтобы это работало».' },
    { id: 'uygulama', t: 'Приложения', cap: '<b>Alterna Uygulama</b>143 проверенных сервиса с фильтрами. Как собрать связку, а не зоопарк.' },
    { id: 'unsuz', t: 'Ünsüz yumuşaması', cap: '<b>Гайд по грамматике</b>Чередование p‑b, ç‑c, t‑d, k‑ğ. Разбор, таблицы, тренажёр.' },
    { id: 'tampon', t: 'Буфер -y-', cap: '<b>Гайд по грамматике</b>Слово кончилось на гласную, аффикс начинается с гласной. Что делать.' },
    { id: 'ikileme', t: 'İkileme', cap: '<b>Гайд по лексике</b>Парные слова: yavaş yavaş, adım adım. Шесть механик на одной схеме.' },
    { id: 'detoks', t: 'Диалог‑симулятор', cap: '<b>Интерактив</b>Тема «Цифровой детокс»: словарь, история, диалоги, тест и симулятор разговора.' },
  ];
  const REEL = [
    ['ph-route-map', 'Маршрут: Стамбул → Анкара'], ['ph-yt-hero', 'YouTube по уровням'], ['ph-route-levels', 'Лестница A1 → C1'],
    ['ph-yt-week', 'Видео на каждый день'], ['ph-yt-cabinet', 'Кабинет без регистрации'], ['ph-yt-heatmap', 'Уровень × жанр'],
    ['ph-cizgi-hero', '138 мультиков'], ['ph-cizgi-card', 'Где смотреть + уровень'], ['ph-cizgi-club', 'Клуб мультиманов'],
    ['ph-kitap', 'Книжная полка'], ['ph-pod-hero', 'Подкасты'], ['ph-pod-card', 'Случайный подкаст'], ['ph-apps', '143 сервиса'],
    ['ph-yt-charts', 'Каталог в цифрах'],
    ['nt-a0a2', 'База A0–A2 в Notion', 1], ['nt-b1c1', 'База B1–C1', 1], ['nt-themes', 'Темы с картинками', 1], ['nt-lexika', 'Лексика по темам', 1],
    ['nt-progress', 'Прогресс по темам', 1], ['nt-web-dir', 'Интерактивные разборы', 1], ['nt-web-kino', 'Кино по уровню', 1], ['nt-web-podcasts', 'Подкасты на сайте', 1],
  ];
  const ARGS = [
    ['4 города', 'Уровни стали маршрутом', 'Стамбул, Измир, Анталья, Анкара. Travel-quest вместо скучной лестницы.'],
    ['0', 'Регистраций', 'Прогресс, минуты и фразы сохраняются прямо в браузере.'],
    ['20 мин', 'Цель на день', 'Таймер считает минуты. 20 минут каждый день лучше трёх часов раз в месяц.'],
    ['7 дней', 'Готовый план', 'Видео на каждый день недели. Открыл и смотришь.'],
    ['138', 'Мультфильмов', 'С уровнем, жанром и ссылкой, где смотреть.'],
    ['143', 'Сервиса', 'Проверены вручную. 72 полностью бесплатные.'],
    ['28', 'YouTube-каналов', 'Отобраны под уровни CEFR, от первых слов до носителей.'],
    ['1 клик', 'Фильтры', 'Уровень, жанр, формат. Тепловая карта показывает, где сколько материалов.'],
  ];
  const PLAN = {
    lvl: [['A0', 0], ['A1', 0], ['A2', 1], ['B1', 2], ['B2', 2], ['C1', 3]],
    city: ['<b>Стамбул</b>. Первые фразы, алфавит, гармония гласных', '<b>Измир</b>. Быт, магазины, соседи', '<b>Анталья</b>. Свободный разговор на любую тему', '<b>Анкара</b>. Учёба и работа по-турецки'],
    goal: [
      ['Переезд', 'лексика по темам (дом, больница, транспорт, еда) и мультики под твой уровень'],
      ['Учёба в Турции', '32 блока по экзаменам и 128 гайдов по грамматике'],
      ['Работа', '36 гайдов по работе и лексика по профессиям'],
      ['Путешествие', 'лексика: еда, отель, транспорт. Плюс подкасты в дорогу'],
      ['Сериалы и кайф', '1716 материалов: фильмы, мультики, книги под твой уровень'],
    ],
    tyre: [
      ['SOFT · 10 мин', '#ff2a2a', '10 минут: один гайд или один блок лексики'],
      ['MEDIUM · 20 мин', '#FFD500', '20 минут: 10 минут гайд, 10 минут слушание'],
      ['HARD · 40 мин', '#ffffff', '40 минут: гайд, лексика и серия мультика или подкаст'],
    ],
  };
  const FAQ = [
    ['Я полный ноль. Мне подойдёт?', 'Да. Есть уровень A0. Алфавит, звуки, гармония гласных. С нуля и без паники.'],
    ['Всё это есть бесплатно на YouTube. Зачем платить?', 'Есть. Разбросано по тысяче каналов. Ты платишь не за контент. Ты платишь за порядок. Открыл свой уровень и учишь, а не ищешь.'],
    ['Сколько времени нужно в день?', '20 минут. Серьёзно. 20 минут каждый день работают лучше, чем три часа в воскресенье раз в месяц.'],
    ['Доступ правда навсегда?', 'Да. $30 один раз. Без подписки и без автосписаний.'],
    ['Это только грамматика?', 'Нет. Грамматика, лексика, экзамены A1–C1, гайды по работе, интерактив и 1716 материалов по уровням: фильмы, книги, мультики, подкасты, приложения.'],
    ['Как оплатить?', 'Оплата проходит на lava.top. Жмёшь кнопку «Приобрести доступ», там же вся информация о доступе.'],
  ];

  /* =========================================================
     LAP 1 · livery
     ========================================================= */
  const decalG = $('#decals'), chips = $('#decal-chips'), livCard = $('#liv-card'), garage = $('.garage');
  const stuck = new Set();
  const NS = 'http://www.w3.org/2000/svg';
  LIVERY.forEach((w, i) => {
    const d = w.d, g = document.createElementNS(NS, 'g');
    g.setAttribute('transform', `translate(${d.x} ${d.y}) rotate(${d.r})`);
    g.innerHTML = `<g class="decal" data-i="${i}"><rect x="${-d.w / 2}" y="${-d.h / 2}" width="${d.w}" height="${d.h}" rx="${Math.min(4, d.h / 3)}" fill="${d.bg}"/><text x="0" y="1" font-size="${d.fs}" fill="${d.fg}" textLength="${d.w * .82}" lengthAdjust="spacingAndGlyphs">${esc(d.t)}</text></g>`;
    g.style.cursor = 'pointer';
    g.addEventListener('click', () => pick(i));
    decalG.appendChild(g);
    const b = document.createElement('button');
    b.className = 'chip'; b.textContent = w.tr; b.dataset.i = i;
    b.addEventListener('click', () => pick(i));
    chips.appendChild(b);
  });
  function pick(i) {
    const w = LIVERY[i];
    $(`.decal[data-i="${i}"]`).classList.add('on');
    chips.children[i].classList.add('on');
    card(livCard, w);
    speak(w.tr);
    if (!stuck.has(i)) {
      stuck.add(i); $('#liv-n').textContent = stuck.size;
      if (stuck.size === LIVERY.length) { garage.classList.add('done'); toast('Ливрея готова! Болид продан спонсорам 🏁'); }
    }
  }
  $('#box-words').innerHTML = BOX.map(mini).join('');

  /* ---------- LAP 2 · signs ---------- */
  $('#signs').innerHTML = SIGNS.map((s, i) => `
    <button class="sign v${s.v}" data-r aria-label="Табличка ${esc(s.tr)}. Нажми, чтобы перевернуть">
      <span class="sign-in">
        <span class="sf" lang="tr">${s.f}</span>
        <span class="sb"><b>${esc(s.tr)}</b><span class="pr">[${esc(s.pr)}]</span><span class="ru">${esc(s.ru)}</span><span class="nt">${esc(s.nt)}</span>
        <span class="say" data-say="${esc(s.say || s.tr)}" role="button" aria-label="Озвучить">🔊</span></span>
      </span>
    </button>`).join('');
  $$('.sign').forEach((b, i) => b.addEventListener('click', e => {
    if (e.target.closest('[data-say]')) return;
    const was = b.classList.toggle('flipped');
    if (was) speak(SIGNS[i].say || SIGNS[i].tr);
  }));
  $('#where').innerHTML = WHERE.map(mini).join('');

  /* ---------- LAP 3 · false friends ---------- */
  $('#ff').innerHTML = FF.map((f, i) => `
    <article class="ffc" data-r>
      <h3>${esc(f.w)} ${sayBtn(f.w.replace(' / ', ', '))}</h3>
      <div class="ff-sw"><button class="on" data-ff="0">Кажется</button><button data-ff="1">На деле</button></div>
      <div class="ff-body">
        <p class="ff-think">🤔 <s>${esc(f.think)}</s></p>
        <p class="ff-real">✅ ${f.real}</p>
      </div>
      <p class="ff-ex"><b>${esc(f.ex)}</b> ${sayBtn(f.ex, 'Пример')}<br>${esc(f.exRu)}</p>
    </article>`).join('');
  $$('.ffc').forEach(c => c.addEventListener('click', e => {
    const b = e.target.closest('[data-ff]'); if (!b) return;
    const real = b.dataset.ff === '1';
    c.classList.toggle('real', real);
    $$('[data-ff]', c).forEach(x => x.classList.toggle('on', x === b));
  }));

  /* ---------- LAP 4 · phone ---------- */
  const phCard = $('#ph-card');
  $('#online-words').innerHTML = ONLINE.map(mini).join('');
  const ACT = ['Abone ol', 'Beğen', 'Paylaş', 'Kaydet', 'Yorum yap'];
  $('#ph-actions').innerHTML = ACT.map((a, i) => `<button class="${i === 0 ? 'sub' : ''}" data-act="${esc(a)}">${esc(a)}</button>`).join('');
  $('#ph-actions').addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const w = ONLINE.find(o => o.tr === b.dataset.act);
    b.classList.add('on'); card(phCard, w, true); speak(w.tr);
  });
  let phStarted = false, phTimer;
  function startAd() {
    if (phStarted) return; phStarted = true;
    let n = 5; const t = $('#ph-t'), sn = $('#ph-skip-n'), skip = $('#ph-skip');
    phTimer = setInterval(() => {
      n--; t.textContent = String(Math.max(n, 0)).padStart(2, '0'); sn.textContent = n;
      if (n <= 0) { clearInterval(phTimer); skip.disabled = false; skip.innerHTML = 'Reklamı atla ⏭'; }
    }, 1000);
  }
  $('#ph-skip').addEventListener('click', () => {
    $('#ph-ad').hidden = true; $('#ph-video').hidden = false;
    card(phCard, ONLINE[1], true); speak('Reklamı atla');
  });

  /* ---------- PIT · percent ---------- */
  const TENS = { 10: ['on', 'он'], 20: ['yirmi', 'йирми́'], 30: ['otuz', 'оту́з'], 40: ['kırk', 'кырк'], 50: ['elli', 'элли́'], 60: ['altmış', 'алтмы́ш'], 70: ['yetmiş', 'етми́ш'], 80: ['seksen', 'сексе́н'], 90: ['doksan', 'докса́н'], 100: ['yüz', 'юз'] };
  function pctRead(n) {
    const t = Math.floor(n / 10) * 10, o = n % 10;
    const tr = [], ru = [];
    if (t) { tr.push(TENS[t][0]); ru.push(TENS[t][1]); }
    if (o === 5) { tr.push('beş'); ru.push('беш'); }
    return ['yüzde ' + tr.join(' '), '[юзде́ ' + ru.join(' ') + ']'];
  }
  const range = $('#pct-range');
  const updPct = () => {
    const n = +range.value, [tr, ru] = pctRead(n);
    $('#pct-num').textContent = n; $('#pct-tr').textContent = tr; $('#pct-ru').textContent = ru;
  };
  range.addEventListener('input', updPct); updPct();

  /* ---------- PIT · sen/siz ---------- */
  let tvMode = 'sen';
  const renderTV = () => {
    $('#tv-list').innerHTML = TV.map(([sen, stem, suf, ru]) => {
      const word = tvMode === 'sen' ? esc(sen) : `${esc(stem)}<em>${esc(suf)}</em>`;
      const plain = tvMode === 'sen' ? sen : stem + suf;
      return `<li class="flash"><span><b>${word}!</b>${esc(ru.split(' / ')[tvMode === 'sen' ? 0 : 1])}</span>${sayBtn(plain + '!')}</li>`;
    }).join('');
  };
  $$('.tg').forEach(b => b.addEventListener('click', () => {
    tvMode = b.dataset.tv; $$('.tg').forEach(x => x.classList.toggle('on', x === b)); renderTV();
  }));
  renderTV();

  /* ---------- LAP 5 · slogan ---------- */
  const sel = { u: 1, p: 0, o: 0 };
  $$('.b-opts').forEach(box => {
    const part = box.dataset.part;
    box.innerHTML = SLOGAN[part].map((x, i) => `<button class="opt${i === sel[part] ? ' on' : ''}" data-i="${i}">${esc(part === 'p' ? x.b : x.tr)}</button>`).join('');
    box.addEventListener('click', e => {
      const b = e.target.closest('.opt'); if (!b) return;
      sel[part] = +b.dataset.i; $$('.opt', box).forEach(x => x.classList.toggle('on', x === b)); renderSlogan(true);
    });
  });
  let sloganSay = '';
  function renderSlogan(anim) {
    const u = SLOGAN.u[sel.u], p = SLOGAN.p[sel.p], o = SLOGAN.o[sel.o];
    $('#bb-tr').innerHTML = `${esc(u.tr)}<br>Tüm ${esc(p.b)}<span class="suf">${esc(p.s)}</span> ${esc(o.tr)}!`;
    $('#bb-ru').textContent = `${u.ru} ${p.ru}: ${o.ru}.`;
    sloganSay = `${u.say || u.tr} Tüm ${p.b}${p.s} ${o.say || o.tr}!`;
    const back = /[aıou]/.test(p.v);
    $('#bb-gram').innerHTML = `<b>${esc(p.b)}</b> + <b>${back ? 'lar' : 'ler'}</b> (много) + <b>${back ? 'da' : 'de'}</b> (на). Последняя гласная <b>${esc(p.v)}</b>, поэтому ${back ? 'a' : 'e'}. Гармония гласных, ничего личного.`;
    if (anim) { const bb = $('#billboard'); bb.classList.remove('swap'); void bb.offsetWidth; bb.classList.add('swap'); }
  }
  renderSlogan(false);
  $('#bb-say').addEventListener('click', e => speak(sloganSay, e.currentTarget));
  $('#bb-rand').addEventListener('click', () => {
    ['u', 'p', 'o'].forEach(k => { sel[k] = Math.floor(Math.random() * SLOGAN[k].length); $$(`.b-opts[data-part="${k}"] .opt`).forEach((x, i) => x.classList.toggle('on', i === sel[k])); });
    renderSlogan(true); speak(sloganSay);
  });

  /* ---------- QUALI ---------- */
  const lights = $('#lights');
  let qi = 0, score = 0, t0 = 0, raf, order = [], locked = false;
  const shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  function runLights(el, done) {
    const ls = $$('i', el); el.classList.remove('go'); ls.forEach(l => l.classList.remove('on'));
    if (reduce) { el.classList.add('go'); done(); return; }
    ls.forEach((l, i) => setTimeout(() => l.classList.add('on'), 450 * (i + 1)));
    setTimeout(() => { ls.forEach(l => l.classList.remove('on')); el.classList.add('go'); done(); }, 450 * 5 + 500 + Math.random() * 500);
  }
  function tick() { $('#q-time').textContent = ((performance.now() - t0) / 1000).toFixed(1); raf = requestAnimationFrame(tick); }
  function startQuiz() {
    $('#q-start').hidden = true; $('#q-res').hidden = true; $('#q-body').hidden = true;
    qi = 0; score = 0; order = shuffle(QUIZ.map((_, i) => i));
    runLights(lights, () => { $('#q-body').hidden = false; t0 = performance.now(); cancelAnimationFrame(raf); tick(); showQ(); });
  }
  function showQ() {
    locked = false;
    const q = QUIZ[order[qi]];
    $('#q-idx').textContent = `${qi + 1}/${QUIZ.length}`;
    $('#q-bar').style.width = (qi / QUIZ.length * 100) + '%';
    $('#q-text').textContent = q.q; $('#q-fb').textContent = '';
    $('#q-opts').innerHTML = shuffle(q.o.map((o, i) => [o, i])).map(([o, i]) => `<button data-ok="${i === 0 ? 1 : 0}">${esc(o)}</button>`).join('');
  }
  $('#q-opts').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || locked) return; locked = true;
    const ok = b.dataset.ok === '1', q = QUIZ[order[qi]];
    b.classList.add(ok ? 'ok' : 'bad');
    if (!ok) $$('#q-opts button').find(x => x.dataset.ok === '1').classList.add('ok');
    if (ok) score++;
    $('#q-fb').textContent = (ok ? '✅ ' : '❌ ') + q.fb;
    setTimeout(() => { qi++; qi < QUIZ.length ? showQ() : finish(); }, ok ? 900 : 1700);
  });
  function finish() {
    cancelAnimationFrame(raf);
    const time = ((performance.now() - t0) / 1000).toFixed(1), pos = QUIZ.length + 1 - score;
    $('#q-bar').style.width = '100%';
    $('#q-body').hidden = true; $('#q-res').hidden = false;
    $('#q-pos').textContent = 'P' + pos;
    $('#q-sum').textContent = `${score} из ${QUIZ.length} · ${time} сек`;
    $('#q-msg').textContent = pos === 1 ? 'Поул-позишн! Турецкая витрина тебе больше не страшна.'
      : pos <= 3 ? 'Первый ряд. Пара слов потерялась в повороте.'
      : pos <= 6 ? 'В очках. Перечитай шпаргалку и ещё заезд.'
      : 'Сход с трассы. Не страшно. Повтори круги 02 и 03.';
  }
  $('#q-go').addEventListener('click', startQuiz);
  $('#q-again').addEventListener('click', startQuiz);

  /* ---------- AD · skip joke ---------- */
  $('#skip-joke').addEventListener('click', e => {
    e.currentTarget.textContent = 'Atlandı ✓';
    $('#skip-msg').textContent = 'Ха. Ты только что применил atlamak. Засчитано. Но эту рекламу я сделал полезной. Листай.';
    setTimeout(() => $('.nope').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }), 1600);
  });

  /* ---------- videos ---------- */
  const vp = $('#vplayer');
  $('#vtabs').innerHTML = VIDEOS.map((v, i) => `<button class="vtab${i ? '' : ' on'}" role="tab" aria-selected="${!i}" data-v="${i}">${esc(v.t)}</button>`).join('');
  function setVideo(i, play) {
    const v = VIDEOS[i];
    vp.poster = `media/v-${v.id}.webp`; vp.src = `media/v-${v.id}.mp4`;
    $('#vcap').innerHTML = v.cap + '<p class="script">Запись экрана. Без монтажа.</p>';
    $$('.vtab').forEach((b, k) => { b.classList.toggle('on', k === i); b.setAttribute('aria-selected', k === i); });
    if (play) vp.play().catch(() => {});
  }
  $('#vtabs').addEventListener('click', e => { const b = e.target.closest('.vtab'); if (b) setVideo(+b.dataset.v, true); });
  setVideo(0, false);
  $('#vfull').addEventListener('click', () => {
    vp.play().catch(() => {});
    if (vp.requestFullscreen) vp.requestFullscreen().catch(() => {});
    else if (vp.webkitEnterFullscreen) vp.webkitEnterFullscreen();
  });

  /* ---------- reel + lightbox ---------- */
  $('#reel').innerHTML = REEL.map(([f, c, wide], i) => `
    <button class="pol${wide ? ' wide' : ''}" style="--r:${[-3, 2, -1.5, 3, -2.5, 1.5][i % 6]}deg" data-src="media/${f}.webp" data-cap="${esc(c)}">
      <img src="media/${f}.webp" alt="${esc(c)}" loading="lazy" decoding="async"><figcaption>${esc(c)}</figcaption>
    </button>`).join('');
  const lb = $('#lightbox');
  $('#reel').addEventListener('click', e => {
    const p = e.target.closest('.pol'); if (!p) return;
    $('#lb-img').src = p.dataset.src; $('#lb-img').alt = p.dataset.cap; $('#lb-cap').textContent = p.dataset.cap;
    lb.showModal ? lb.showModal() : lb.setAttribute('open', '');
  });
  $('#lb-x').addEventListener('click', () => lb.close());
  lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });
  $('#args').innerHTML = ARGS.map(([n, h, t]) => `<div class="arg" data-r><span class="ai">${esc(n)}</span><div><b>${esc(h)}</b><span>${esc(t)}</span></div></div>`).join('');

  /* ---------- plan ---------- */
  const plan = { lvl: 1, goal: 0, tyre: 1 };
  $('[data-plan="lvl"]').innerHTML = PLAN.lvl.map(([l], i) => `<button data-i="${i}">${l}</button>`).join('');
  $('[data-plan="goal"]').innerHTML = PLAN.goal.map(([g], i) => `<button data-i="${i}">${esc(g)}</button>`).join('');
  $('[data-plan="tyre"]').innerHTML = PLAN.tyre.map(([t, c], i) => `<button data-i="${i}"><span class="tyre" style="--tc:${c}"></span>${esc(t)}</button>`).join('');
  $$('[data-plan]').forEach(box => box.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    plan[box.dataset.plan] = +b.dataset.i; renderPlan(true);
  }));
  function renderPlan(anim) {
    $$('[data-plan]').forEach(box => $$('button', box).forEach((b, i) => b.classList.toggle('on', i === plan[box.dataset.plan])));
    const lvl = PLAN.lvl[plan.lvl], goal = PLAN.goal[plan.goal], tyre = PLAN.tyre[plan.tyre];
    $('#strat-body').innerHTML = `
      <p class="strat-line"><i>📍</i><span>Старт: ${PLAN.city[lvl[1]]}. Уровень ${lvl[0]}.</span></p>
      <p class="strat-line"><i>🎯</i><span>Первые две недели: ${esc(goal[1])}.</span></p>
      <p class="strat-line"><i>🛞</i><span>Каждый день: ${esc(tyre[2])}.</span></p>
      <p class="strat-line"><i>🏁</i><span>Всё это уже лежит внутри. Искать не надо.</span></p>`;
    if (anim) { const s = $('#strategy'); s.classList.remove('swap'); void s.offsetWidth; s.classList.add('swap'); }
  }
  renderPlan(false);

  /* ---------- faq ---------- */
  $('#faq').innerHTML = FAQ.map(([q, a]) => `<details data-r><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('');

  /* =========================================================
     SCROLL FX
     ========================================================= */
  // reveal
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  $$('[data-r]').forEach(el => io.observe(el));

  // one-shot section triggers
  const once = (el, fn, th = .35) => {
    if (!el) return;
    const o = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { fn(); o.disconnect(); } }), { threshold: th });
    o.observe(el);
  };
  once($('.phone'), startAd, .5);

  // counters
  $$('.cnt').forEach(el => once(el, () => {
    const to = +el.dataset.to;
    if (reduce) { el.textContent = to; return; }
    const d = 1400, s = performance.now();
    const step = now => { const p = Math.min(1, (now - s) / d), e = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(to * e); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }, .6));

  // route car
  once($('.route-map'), () => {
    const path = $('#rpath'), car = $('#rcar'), stops = $$('.stops li'), L = path.getTotalLength();
    const marks = [0, .38, .66, 1];
    const d = reduce ? 1 : 4200, s = performance.now();
    const step = now => {
      const p = Math.min(1, (now - s) / d), pt = path.getPointAtLength(L * p), pt2 = path.getPointAtLength(Math.min(L, L * p + 1));
      const ang = Math.atan2(pt2.y - pt.y, pt2.x - pt.x) * 180 / Math.PI;
      car.setAttribute('transform', `translate(${pt.x} ${pt.y}) rotate(${ang})`);
      stops.forEach((li, i) => li.classList.toggle('on', p >= marks[i] - .02));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, .4);

  // final lights
  once($('#final'), () => runLights($('#final-lights'), () => $('#final-go').classList.add('go')), .45);

  // parallax + progress + sticky
  const track = $('.track'), sticky = $('#sticky'), hero = $('.hero'), fin = $('#final');
  const par = $$('[data-par]');
  let ticking = false;
  function onScroll() {
    ticking = false;
    const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
    track.style.setProperty('--prog', h > 0 ? (y / h).toFixed(4) : 0);
    if (!reduce && y < innerHeight * 1.2) par.forEach(el => { el.style.transform = `translate3d(0,${(y * +el.dataset.par).toFixed(1)}px,0)`; });
    const finTop = fin.getBoundingClientRect().top;
    const show = y > hero.offsetHeight * .8 && finTop > innerHeight * .6;
    sticky.classList.toggle('show', show);
    sticky.setAttribute('aria-hidden', String(!show));
    $('a', sticky).tabIndex = show ? 0 : -1;
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  // autoplay proof video only while visible
  const vo = new IntersectionObserver(es => es.forEach(e => { e.isIntersecting ? vp.play().catch(() => {}) : vp.pause(); }), { threshold: .4 });
  vo.observe(vp);
})();
