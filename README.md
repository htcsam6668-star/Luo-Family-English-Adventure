# 羅家英文冒險島

手機、平板、電腦自適應網頁＋可加入主畫面的 PWA。已包含《龍蛋守護者：星空龍族傳說》50話圖片、姊姊3～6年級教材與片語/句型/文法、弟弟25類圖像題、獨立集點、魔王挑戰與家長獎勵兌換。

## 開啟網站

本專案為純靜態網站，不需編譯。首頁為根目錄 `index.html`，請保留 `stories/` 和其他檔案的相對位置。不要只上傳 ZIP 本身。

GitHub Pages：儲存庫 Settings → Pages → Deploy from a branch → main → /(root) → Save。`.nojekyll` 已包含。若已由協作者設定，直接使用 Pages 顯示的網址即可。

官方說明：https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## 安裝 App

- iPhone/iPad：Safari開啟網站→分享→加入主畫面；如有「作為網頁App開啟」請開啟。
- Android：Chrome開啟網站→選單→安裝應用程式／新增至主畫面。
- 電腦：Chrome/Edge網址列安裝圖示或選單安裝。
- 網站右上角也提供「安裝到主畫面」說明。這是 PWA，不是 App Store IPA 或 Android APK。
- 首次請連網完整開啟，待Service Worker與教材/圖片下載完成；之後可離線使用。離線語音取決於裝置是否已備妥英文語音。

官方說明：https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios ，https://support.google.com/chrome/answer/9658361

## 獎勵

家長專區首次設定4～8位數密碼，新增獎勵及點數。孩子在獎勵小舖申請，先保留點數；家長確認已發放後扣除，拒絕則退回。花點不會降低冒險關卡。相同孩子同一獎勵不可同時有兩筆待核對。兩孩紀錄與點數各自計算。

## 資料範圍

**此版本為本機資料版，尚未整合先前D1雲端正式版。** GitHub Pages僅託管靜態網站，不會讓不同裝置自動共用集點。瀏覽器、裝置及網站網域不同，資料各自獨立；從舊Sites網址移到GitHub Pages不會自動搬移舊點數。清除網站資料或使用無痕模式可能丟失本機進度。此包不包含真實孩子資料、家長密碼、憑證或雲端資料庫。

本機家長密碼為PBKDF2雜湊；它是家庭裝置操作門檻，不是雲端伺服器權限。多人共用進度需另外整合後端，本版未聲稱已完成。

## 本機測試與開發

Node.js 22以上：

```
npm install
npm test
npm start
```

瀏覽 `http://127.0.0.1:4174/`。網頁程式與教材內嵌於index.html，不依賴Node運行；Node只用於測試/本機伺服器。修改網頁或資產後，更新sw.js的CACHE版本；若有意變更資產，需同步tests/assets.json的SHA-256。

50話對應：1～45為stories/panel_01.png～panel_45.png；46～50為stories/episode_46.png～episode_50.png，按使用者提供編號配置，圖片未加工。片語及原創補充資料不冒稱官方逐課內容，資料內仍保留分流/來源欄位。

## 驗證範圍

開發環境原23項回歸、文法112次作答、獎勵/魔王/分類測試均通過。此儲存庫 `npm test` 驗證資產校驗碼、50張故事圖、年級按鍵、兌換保留/扣點、弟弟分類/紀錄、安裝引導及離線資產/子路徑。響應式CSS覆蓋手機、平板、桌面；尚未完成實體iPhone/Android/平板的視覺、音訊與安裝驗收。
