# 日日好食：Safari／主畫面 App 雲端同步設定

這份設定只要建立一次 Supabase 專案；Safari 和主畫面 App 都使用同一個專案、同一組登入帳號。

## A. 先保護舊資料
1. **請在原本還看得到紀錄的 Safari 中開啟** https://sally198307-cloud.github.io/diet-tracker/food-journal/
2. 進入 **週報 → 下載 JSON 備份**，存進 iPhone「檔案」，並確認有存好。
3. 暫時不要刪除主畫面圖示、清除網站資料，也不要用空白資料覆蓋舊備份。

## B. 建立私人的 Supabase 專案
1. 開啟 https://supabase.com/dashboard ，登入或註冊後建立新專案。
2. 在 **SQL Editor** 建立查詢，貼上同資料夾 [SUPABASE_SETUP.sql](./SUPABASE_SETUP.sql) 的完整內容並執行。它會建立 `food_journal_entries`、啟用 Row Level Security，限制每人只能讀寫自己登入帳號的資料。
3. 到 **Authentication → URL Configuration**，把 **Site URL** 設成：
   `https://sally198307-cloud.github.io/diet-tracker/food-journal/`
   也把這個網址加入允許的 Redirect URLs。
4. 到 **Project Settings → API Keys**，找到 **Project URL** 與 **publishable key**（或舊版 anon key）。**不要使用 secret key、service_role key，也不要把密碼貼給任何人。**

## C. 先從有舊資料的 Safari 啟用
1. Safari 開啟網站 → **週報 → 雲端同步**。
2. 貼上 Supabase Project URL 和 **publishable/anon key** → 儲存連線設定。
3. 用自己的電子郵件註冊帳號與密碼；如有驗證信，先驗證郵件，再回來登入。
4. 再次確認已下載 JSON 備份，按 **合併並啟用同步**。
5. 應顯示「同步成功」；若有錯誤，先不要繼續建立新的空資料。

## D. 在主畫面 App 使用相同帳號
1. 從 iPhone 主畫面開啟網站 → 週報 → 雲端同步。
2. 輸入同一個 **Project URL 與 publishable/anon key**，用同一組電子郵件和密碼登入。
3. 點 **合併並啟用同步**。這裡會將兩邊按餐點 ID、喝水紀錄 ID、每日回報日期和資料庫項目 ID 合併，而非直接用主畫面空白頁蓋掉 Safari 舊紀錄。
4. 在 Safari 新增一筆測試紀錄，再回主畫面 App 開啟「週報 → 立即同步」確認有出現。

## 資料安全與限制
- 兩端的手機儲存空間仍獨立。雲端才是跨兩端合併的來源。
- 只有通過 Supabase Auth 登入的使用者，且符合 RLS 限制，才能存取各自資料。
- 網站不會把你的餐點、照片或 Supabase 密碼提交到公開 GitHub。
- 現階段照片會隨餐點資料（base64）存成資料庫 JSONB。大量照片可能碰到 Supabase 資料庫配額或請求限制；請保留 JSON 備份。
- 當網路離線時可以繼續記錄，但需待連線恢復並同步成功才能在其他裝置看到。
- 盡量不要兩端同時修改**同一筆**紀錄。不同筆以 ID 合併，對同筆衝突主要使用時間戳記，不能完全保證跨裝置並行編輯的結果。
- 如果提示同步失敗，**本機資料不會主動刪除**；先下載 JSON 備份，再檢查帳號、SQL、權限與網路。
