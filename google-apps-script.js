// ============================================================
// 運動員疲勞採集 — Google Apps Script 後端
// ============================================================
// 使用方式：
//   1. 開啟 Google Sheets，建一個新試算表
//   2. 點選 擴充功能 -> Apps Script
//   3. 將這段程式碼全部貼上，覆蓋原本的內容
//   4. 點選 部署 -> 新增部署項目
//      - 類型：網頁應用程式
//      - 執行身分：我 (your account)
//      - 誰可以存取：所有人（含未登入者）
//   5. 授權後複製部署 URL
//   6. 貼到 web/app.js 的 API_URL 常數
// ============================================================

const SHEET_NAME = "fatigue_data";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = getOrCreateSheet();

    if (sheet.getLastRow() === 0) {
      writeHeader(sheet);
    }

    sheet.appendRow([
      data.timestamp        || "",
      new Date().toISOString(),   // server_time
      data.name             || "",
      data.gender           || "",
      data.age              || "",
      data.height_cm        || "",
      data.weight_kg        || "",
      data.sport_type       || "",
      data.device_id        || "",
      data.sleep_quality    || "",
      data.phase            || "",
      data.body_part        || "",
      data.fatigue_score    || "",
      data.notes            || "",
      data.test_type        || "",
      data.jump_cm_1        || "",
      data.jump_cm_2        || "",
      data.jump_cm_3        || "",
      data.best_height_cm   || "",
      data.baseline_height_cm || "",
      data.baseline_ratio   || "",
      data.rsi              || ""
    ]);

    return respond({ status: "ok" });

  } catch (err) {
    return respond({ status: "error", message: err.message });
  }
}

// ---- helpers ----

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  return sheet;
}

function writeHeader(sheet) {
  sheet.appendRow([
    "timestamp",
    "server_time",
    "name",
    "gender",
    "age",
    "height_cm",
    "weight_kg",
    "sport_type",
    "device_id",
    "sleep_quality",
    "phase",
    "body_part",
    "fatigue_score",
    "notes",
    "test_type",
    "jump_cm_1",
    "jump_cm_2",
    "jump_cm_3",
    "best_height_cm",
    "baseline_height_cm",
    "baseline_ratio",
    "rsi"
  ]);

  // 凍結標題列
  sheet.setFrozenRows(1);

  // 標題列加底色
  sheet.getRange(1, 1, 1, 23)
    .setBackground("#005f3a")
    .setFontColor("#ffffff")
    .setFontWeight("bold");
}

function respond(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
