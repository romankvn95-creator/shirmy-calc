// Google Apps Script — бэкенд для Калькулятора ширм
// Развернуть как веб-приложение: «Все» могут обращаться, выполнять как «Я»
//
// Структура таблицы (строки 2+):
// A: Имя  B: Токен  C: Активен  D: Телефон  E: Добавлен
// F: Ссылка  G: Комментарий  H: Последний вход  I: Посещений  J: Онлайн до

var SHEET_INDEX = 0

// Проверка токена — вызывается фронтендом через GET ?token=XXX
// Таблица остаётся приватной, снаружи не видна
function doGet(e) {
  var token = String((e && e.parameter && e.parameter.token) || '').trim()
  if (!token) return json({ ok: false, error: 'no token' })
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[SHEET_INDEX]
  var rows  = sheet.getDataRange().getValues()
  for (var i = 1; i < rows.length; i++) {
    var rowToken   = String(rows[i][1]).trim()
    var rowEnabled = String(rows[i][2]).toUpperCase()
    if (rowToken !== token) continue
    if (rowEnabled !== 'TRUE') return json({ ok: false, error: 'disabled' })
    var now    = new Date()
    var today  = Utilities.formatDate(now, 'Europe/Moscow', 'dd.MM.yyyy HH:mm')
    var visits = parseInt(rows[i][8]) || 0
    sheet.getRange(i + 1, 8).setValue(today)      // H: Последний вход
    sheet.getRange(i + 1, 9).setValue(visits + 1) // I: Посещений
    sheet.getRange(i + 1, 10).setValue(now)        // J: Онлайн до
    return json({ ok: true, name: rows[i][0], token: rows[i][1], phone: rows[i][3], link: rows[i][5], comment: rows[i][6] })
  }
  return json({ ok: false, error: 'not found' })
}

// Heartbeat-пинг — вызывается каждые 2 минуты через POST
function doPost(e) {
  try {
    var data  = JSON.parse(e.postData.contents)
    var token = String(data.token || '').trim()
    if (!token) return json({ error: 'no token' })
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[SHEET_INDEX]
    var rows  = sheet.getDataRange().getValues()
    var now   = new Date()
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][1]).trim() !== token) continue
      sheet.getRange(i + 1, 10).setValue(now) // J: Онлайн до
      return json({ done: true })
    }
    return json({ error: 'not found' })
  } catch (err) {
    return json({ error: String(err) })
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
}
