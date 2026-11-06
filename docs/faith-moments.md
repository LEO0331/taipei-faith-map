# Faith Moments / 信仰片刻

Faith Moments is the V1.5a solo layer inside the existing Faith Spaces. An original SVG visitor can walk, sit, wave, observe or rest while the map, cultural artwork, numbered hotspots, guided tour, verified profiles and reflection timer keep their existing roles. It needs no backend, account, network connection or Supabase configuration.

## Interaction and motion

Selecting a cultural hotspot shows its text immediately. The optional visitor movement follows the selection without delaying reading, changing the topic or locking another action. The character stays on the illustrative foreground rather than climbing an architectural object. Starting another action cancels the earlier sequence; closing Faith Space clears scheduled callbacks. Sitting can remain a quiet static pose. These gestures do not simulate prayer or a religious ceremony.

The initial timing targets are a 600 ms walk, 500 ms wave, 350 ms sit transition and 500 ms observation. Movement is brief and does not repeat to attract attention. There is no opening sequence, sound, score, tutorial requirement or game-style movement control. The character is decorative; named text buttons provide the accessible interaction.

**Animation On / Animation Off** applies across Faith Spaces. The operating system's `prefers-reduced-motion: reduce` request suppresses animation, including when the saved preference says on. Explicitly turning animation off takes effect immediately; **Skip movement** cancels an optional action. With motion disabled, actions update directly without a transition. Information and keyboard interaction remain available in every state.

The only locally stored item introduced here is `taipei-faith-map-motion`, with `on` or `off`. It stores the motion preference, not the selected religion, organization, hotspot, position, gestures or reflection activity. Storage failure leaves the controls usable for the current session. The existing application language preference remains separate.

## Code and verification scope

`src/features/faith-moments/VisitorAvatar.tsx` draws the original vector character. `useVisitorMotion.ts` owns action state, brief timers, cancellation, media-preference listeners and local preference synchronization. `AvatarActions.tsx` supplies bilingual controls, with styles in `faith-moments.css`. The feature is controlled by `VITE_FAITH_MOMENTS_ENABLED`; setting it to `false` removes the solo avatar layer without affecting the existing cultural content.

Useful local checks are `npm test`, `npm run build` and `npm run content:audit`. Verify immediate hotspot text, rapid repeated selections, cancellation on exit, language changes, motion off, operating-system reduced motion and keyboard control. The release summary records which checks actually ran; this document does not claim successful real-device or screen-reader testing.

The three V1.5 phases have separate flags and focused pull requests. Quiet Presence and Quiet Corner are optional later layers; the solo character must continue to work if they are disabled or unavailable. Details for those integrations belong in their own guides.

## 繁體中文

信仰片刻是 V1.5a 在既有信仰空間中的單人互動層。原創 SVG 訪客可走動、坐下、揮手、觀察或停留，原有地圖、文化插圖、編號熱點、導覽、經查證場所介紹與靜心計時器仍可使用，不需要後端、帳號、連線或 Supabase 設定。

點選熱點會立即顯示文化文字，再視偏好播放訪客動作，不等待動畫、不鎖住下一次操作。訪客停留於插圖前景，不走上建築物件。新動作會取消前一段流程，關閉信仰空間會清除排程；坐姿可維持靜態。這些中性動作不模擬祈禱或宗教儀式。

初始動作目標為走動600毫秒、揮手500毫秒、坐下轉換350毫秒、觀察500毫秒，沒有反覆吸引注意的自動動作、開場流程、聲音、分數或教學要求。角色屬於裝飾圖像，操作由具文字名稱的按鈕提供。

「開啟動畫／關閉動畫」跨場景套用；作業系統要求減少動態時優先停用動畫，即使先前儲存為開啟。手動關閉立即生效，「略過動作」可取消流程。動畫關閉時直接更新狀態，文字閱讀與鍵盤操作仍可使用。

本功能只新增本機 `taipei-faith-map-motion` 的 `on`／`off` 偏好，不儲存教別、場所、熱點、座標、動作或靜心紀錄。儲存不可用時，當次控制仍可操作；原有語言偏好另行管理。`VisitorAvatar.tsx`、`useVisitorMotion.ts`、`AvatarActions.tsx` 與 `faith-moments.css` 分別負責繪圖、狀態／取消、雙語控制與樣式。`VITE_FAITH_MOMENTS_ENABLED=false` 可移除角色層，不影響文化內容。

本機可執行測試、建置與內容稽核，並檢查熱點文字立即顯示、快速連續操作、離開清理、語言切換、關閉動畫、減少動態及鍵盤控制。實際完成的檢查以發版紀錄為準，此文件不宣稱已做實機或螢幕閱讀器驗證。V1.5的三個階段使用獨立旗標與PR；共享功能停用或失效時，單人角色仍須可用。
