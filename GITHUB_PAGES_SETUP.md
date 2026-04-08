# GitHub Pages 部署（最穩定版本）

## 1) 建立 GitHub Repo 並推上去

```bash
git init
git add .
git commit -m "init fatigue web app"
git branch -M main
git remote add origin https://github.com/GIN1127tama/website_for_BIA_exp.git
git push -u origin main
```

## 2) 開啟 GitHub Pages 與 Actions 權限

1. 到 Repo -> Settings -> Pages
2. Build and deployment 選 `GitHub Actions`
3. 到 Repo -> Actions，確認 workflow `Deploy Web To GitHub Pages` 成功
5
完成後網址通常是：

`https://<你的帳號>.github.io/<你的repo>/`

## 3) 發給受測者前的驗證清單

1. 手機與電腦都能打開網址
2. 第一次填基本資料後重新整理，資料還在
3. 送出一筆採集資料可看到 JSON Preview
4. 關網路後仍可開啟頁面（PWA 離線）
5. 再恢復網路可手動重送待送出資料

## 4) 建議現場流程（降低事故）

1. 請受測者第一天先開網頁並加入主畫面
2. 每次採集都先存本機備份（系統已內建）
3. 每週請一次匯出 JSON 備份
4. 若後端短暫故障，等恢復後按重送待送出資料

## 5) 串接 Google Sheets（集中收資料）

### Apps Script 設定步驟

1. 開 Google Sheets，建一個新試算表
2. 點選 擴充功能 -> Apps Script
3. 將 `google-apps-script.js` 的全部內容貼上，覆蓋原本的內容
4. 點選 部署 -> 新增部署項目
   - 類型：網頁應用程式
   - 執行身分：我 (你的帳號)
   - 誰可以存取：所有人（含未登入者）
5. 授權後複製部署 URL（格式為 `https://script.google.com/macros/s/xxx/exec`）

### 設定前端 API URL

開啟 `web/app.js`，第一行改為：

```js
const API_URL = "https://script.google.com/macros/s/你的ID/exec";
```

儲存後推送到 GitHub，Actions 自動重新部署。

### 資料會出現在哪裡

Google Sheets 的 `fatigue_data` 工作表，每筆採集一列，欄位：

| 欄位 | 說明 |
|------|------|
| timestamp | Unix 時間（受測者裝置） |
| server_time | Google 收到的時間（可驗證） |
| name | 姓名 |
| gender / age / height_cm / weight_kg | 基本資料 |
| sport_type | 運動專項 |
| device_id | 綁帶編號 |
| sleep_quality | 睡眠品質 1-5 |
| phase | 當下情境 |
| body_part | 量測部位 |
| fatigue_score | RPE 1-10 |
| notes | 備註 |

## 6) 注意事項

1. GitHub Pages 是靜態網站，資料不會存在 GitHub 上
2. Apps Script 免費配額：每天 20,000 次寫入，實驗規模完全夠用
3. Google Sheets URL 仍可被看見，但無法讀取他人資料（只能寫入）
