# GitHub Pages 部署（最穩定版本）

## 1) 建立 GitHub Repo 並推上去

```bash
git init
git add .
git commit -m "init fatigue web app"
git branch -M main
git remote add origin https://github.com/<你的帳號>/<你的repo>.git
git push -u origin main
```

## 2) 開啟 GitHub Pages 與 Actions 權限

1. 到 Repo -> Settings -> Pages
2. Build and deployment 選 `GitHub Actions`
3. 到 Repo -> Actions，確認 workflow `Deploy Web To GitHub Pages` 成功

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

## 5) 注意事項

1. GitHub Pages 是靜態網站，不會直接存資料庫
2. 若要長期集中管理，仍建議串接你的 API
3. API 若跨網域，需要在後端加 CORS
