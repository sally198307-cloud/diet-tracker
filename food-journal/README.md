# 日日好食 · 飲食手帳

這裡存放飲食手帳網站程式碼。**本儲存庫是公開的，只能放網站程式，不要上傳個人照片、飲食紀錄、每日回報、GitHub Token 或未加密 JSON。**

## 網頁功能
- 每日主食／蛋白質／蔬菜目標 3／3／4，首頁顯示剩餘量
- 新增餐點：自由輸入名稱、餐次、主食／蛋白質／蔬菜三個份量、可多張照片
- 右上角歷史餐點帶入上次份量
- 獨立喝水記錄及每日十項回報
- 七天直接排列的列印 PDF（沒有封面）
- IndexedDB 本機保存、JSON 匯出／匯入
- 選用私人 GitHub 儲存庫的 AES-GCM 加密備份、還原，連線期間更動自動上傳

## 如何啟用真正的 GitHub 長期備份
1. 在你的 GitHub 帳號下，建立**另一個 Private 儲存庫**，例如 `my-food-journal-private`。不要使用現在公開的 `diet-tracker` 作為日記備份庫。
2. 在 GitHub Settings → Developer settings → Personal access tokens → Fine-grained tokens 建立限用於該私人儲存庫的 Token，授權 Repository permissions → Contents: Read and write。Token 期限到期需更新。
3. 在 HTTPS 網址打開食物手帳，進入「週報」 → 「GitHub 私人雲端同步」。輸入 `使用者名稱/my-food-journal-private`、Token、至少 12 字元的**加密密碼**，點「連線」。
4. 第一次點「立即加密備份」。同一個網頁工作階段內的更動，會自動嘗試加密同步。GitHub 內只保存 `private-backups/journal.enc.json` 密文。跨裝置時重新連線，點「從 GitHub 還原」。
5. 記下**加密密碼**：忘記後即使有 GitHub 資料也無法解密。請另外定期下載 JSON 離線備份，妥善保管。

## 注意
- 請勿把 Token、密碼貼到對話、截圖或公開 Issue。
- Token 和密碼不保存到日記資料；重新開啟頁面需重新連線。自動備份僅在已連線且頁面仍開啟時進行。切換裝置前務必完成同步，否則可能產生覆蓋衝突。
- GitHub 是版本控制系統，並非適合不限量照片的雲端相簿。大量照片會使儲存庫快速膨脹，後續建議改用專用的私人資料庫與照片儲存。
- 本工具尚未完成 iPhone 實機驗證。GitHub Pages 若未開啟，要到 Settings → Pages 設定部署；不要以公開 Pages 網址直接傳送私人 Token，務必確認 HTTPS 與網站來源可信。
