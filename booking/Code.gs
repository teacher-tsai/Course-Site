// ============================================================
// Course Booking – Google Apps Script Backend
//
// 一次性設定步驟：
// 1. 開啟 https://script.google.com → 新增專案
// 2. 把這個檔案的內容貼進去
// 3. 編輯下方 CONFIG（尤其是 calendarIds）
// 4. 專案設定 (⚙️) → 時區改為「亞洲/台北」
// 5. 部署 → 新增部署作業 → 類型：網頁應用程式
//    • 執行身份：我（Me）
//    • 存取權限：所有人（Anyone）
// 6. 複製網頁應用程式 URL → 貼到 booking/index.html 的 GAS_URL
// ============================================================

const CONFIG = {
  // 要合併的行事曆 ID，'primary' 代表預設（主）行事曆
  // 其他曆的 ID 可在 Google Calendar → 設定 → 行事曆設定 → 整合行事曆 找到
  calendarIds: [
    'primary',
    '82ps86fvr1e2segjgdgia4l8epklej2p@import.calendar.google.com',
    'reenatsai@gmail.com',  // ← 把工作/教學曆 ID 填在這裡
  ],

  // 可預約時間範圍（24h，以腳本時區為準）
  workingHours: { start: 9, end: 21 },

  // 時段最小單位（分鐘）
  slotMinutes: 30,

  // 開放預約的天數範圍（今天起算）
  bookingWindowDays: 14,

  // 最少提前預約時數（避免學生預約當下就要上課的時段）
  minLeadHours: 2,

  // 預約事件要建立在哪個行事曆
  targetCalendarId: 'primary',

  // 新預約時寄通知信給老師的 Email
  notifyEmail: 'reena.tsai.swe@gmail.com',
};

// ── 對外端點 ─────────────────────────────────────────────────

function doGet(e) {
  try {
    return respond({ ok: true, slots: getAvailableSlots() });
  } catch (err) {
    return respond({ ok: false, error: err.message });
  }
}

function doPost(e) {
  try {
    const p = e.parameter;
    for (const k of ['date', 'time', 'durationMins', 'name', 'email']) {
      if (!p[k] || !String(p[k]).trim()) throw new Error('missing:' + k);
    }
    createBooking(p);
    return respond({ ok: true });
  } catch (err) {
    return respond({ ok: false, error: err.message });
  }
}

function respond(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── 空檔計算 ─────────────────────────────────────────────────

function getAvailableSlots() {
  const now = new Date();
  const minStart = new Date(now.getTime() + CONFIG.minLeadHours * 3600 * 1000);
  const slotMs = CONFIG.slotMinutes * 60 * 1000;
  const result = [];

  for (let d = 0; d < CONFIG.bookingWindowDays; d++) {
    const day = new Date(now);
    day.setDate(day.getDate() + d);

    const dateStr = fmtDate(day);
    const dayStart = makeLocalTime(dateStr, CONFIG.workingHours.start, 0);
    const dayEnd   = makeLocalTime(dateStr, CONFIG.workingHours.end,   0);

    const busy = getBusyIntervals(dayStart, dayEnd);
    const free = [];

    // 從 minStart 或 dayStart 兩者較晚者開始，對齊到 slot 邊界
    let cur = new Date(Math.max(dayStart.getTime(), minStart.getTime()));
    const offset = (cur.getTime() - dayStart.getTime()) % slotMs;
    if (offset > 0) cur = new Date(cur.getTime() + (slotMs - offset));

    while (cur.getTime() + slotMs <= dayEnd.getTime()) {
      const slotEnd = new Date(cur.getTime() + slotMs);
      if (!overlaps(cur, slotEnd, busy)) free.push(fmtTime(cur));
      cur = slotEnd;
    }

    if (free.length > 0) result.push({ date: dateStr, slots: free });
  }

  return result;
}

function getBusyIntervals(from, to) {
  const intervals = [];
  for (const calId of CONFIG.calendarIds) {
    const cal = calId === 'primary'
      ? CalendarApp.getDefaultCalendar()
      : CalendarApp.getCalendarById(calId);
    if (!cal) continue;
    for (const ev of cal.getEvents(from, to)) {
      if (!ev.isAllDayEvent()) {
        intervals.push({ s: ev.getStartTime(), e: ev.getEndTime() });
      }
    }
  }
  return intervals;
}

function overlaps(start, end, intervals) {
  return intervals.some(b => start < b.e && end > b.s);
}

// ── 建立預約 ─────────────────────────────────────────────────

function createBooking({ date, time, durationMins, name, email, topic }) {
  durationMins = parseInt(durationMins, 10);
  const [h, m] = time.split(':').map(Number);
  const startDate = makeLocalTime(date, h, m);
  const endDate   = new Date(startDate.getTime() + durationMins * 60 * 1000);

  // 再次確認時段仍為空閒（防止同時送出的 race condition）
  const busy = getBusyIntervals(startDate, endDate);
  if (overlaps(startDate, endDate, busy)) throw new Error('conflict');

  const cal = CONFIG.targetCalendarId === 'primary'
    ? CalendarApp.getDefaultCalendar()
    : CalendarApp.getCalendarById(CONFIG.targetCalendarId);

  const hrs = durationMins / 60;
  const endTimeStr = fmtTime(endDate);
  cal.createEvent(
    `課程預約 – ${name}（${hrs}h）`,
    startDate,
    endDate,
    {
      description: [
        `學生：${name}`,
        `Email：${email}`,
        `主題：${topic || '（未填寫）'}`,
        '',
        '此預約由課程網站自動建立。',
      ].join('\n'),
      guests: email,
      sendInvites: true,
    }
  );

  MailApp.sendEmail({
    to: CONFIG.notifyEmail,
    subject: `📅 新課程預約 – ${name}（${hrs}h）`,
    body: [
      '有新的課程預約！',
      '',
      `學生：${name}`,
      `Email：${email}`,
      `日期：${date}`,
      `時間：${time} – ${endTimeStr}`,
      `時長：${hrs} 小時`,
      `主題：${topic || '（未填寫）'}`,
      '',
      '行事曆事件已自動建立。',
    ].join('\n'),
  });
}

// ── 日期 / 時間工具 ──────────────────────────────────────────

// 在腳本時區建立特定日期時間（需在專案設定中將時區設為亞洲/台北）
function makeLocalTime(dateStr, hour, minute) {
  const [y, mo, d] = dateStr.split('-').map(Number);
  return new Date(y, mo - 1, d, hour, minute, 0, 0);
}

function fmtDate(d) {
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function fmtTime(d) {
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'HH:mm');
}
