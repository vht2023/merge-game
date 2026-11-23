# Merge Garden - React Native (Android First)

Trò chơi Hợp Nhất (Merge Game) phong cách chữa lành (Healing Garden), tối ưu 60fps trên React Native / Expo với kiến trúc Data-Driven.

---

## 🛠️ Tech Stack & Thư viện

- **Framework:** React Native + Expo SDK 58 + TypeScript
- **Kéo - Thả & Hoạt Họa 60fps:** `react-native-reanimated` + `react-native-gesture-handler`
- **Quản lý State:** `zustand` (v5)
- **Lưu trữ Cực Nhanh (Local Persistence):** `react-native-mmkv` (kèm fallback in-memory)
- **Âm thanh & Rung:** `expo-av` + `expo-haptics`
- **Kiếm tiền (Monetization):** `react-native-google-mobile-ads` (Google AdMob với Test IDs)
- **Đóng gói Phát hành:** EAS Build (`eas.json`) / Android Studio (`android/`)

---

## 📁 Cấu Trúc Thư Mục

```text
merge-game/
├── android/                     # Mã nguồn Native Android sinh ra từ Expo Prebuild
├── assets/
│   ├── themes/garden/           # Cấu hình hình ảnh chủ đề khu vườn
│   └── sounds/                  # pop.wav, merge.wav, coin.wav, levelup.wav, bgm_lofi.wav
├── src/
│   ├── config/
│   │   ├── gameConfig.ts        # Kích thước lưới 5x5, năng lượng, tỷ lệ offline
│   │   └── itemsConfig.ts       # Định nghĩa 15 cấp độ cây (Hạt mầm -> Cây Thế Giới)
│   ├── core/
│   │   ├── gridLogic.ts         # Pure functions: spawnItem, handleDrop (MOVE, MERGE, SWAP)
│   │   └── mathUtils.ts         # Tính toán tọa độ kéo-thả, định dạng số xu, thời gian
│   ├── store/
│   │   ├── useGameStore.ts      # Zustand Store quản lý toàn bộ trạng thái game
│   │   └── storage.ts           # MMKV StateStorage adapter cho Zustand
│   ├── services/
│   │   ├── soundService.ts      # Quản lý SFX & BGM (tự động pause khi background/ad)
│   │   ├── hapticService.ts     # Phản hồi rung nhẹ, vừa, mạnh khi kéo/ghép
│   │   └── adService.ts         # Khởi tạo, preload và hiển thị Google AdMob Rewarded Ads
│   ├── components/
│   │   ├── Board/
│   │   │   ├── GameBoard.tsx    # Lưới bàn cờ 5x5 tự co giãn theo màn hình
│   │   │   ├── GridCell.tsx     # Ô lưới nền cố định
│   │   │   └── DraggableItem.tsx# Vật phẩm kéo-thả 60fps trên UI thread (Reanimated)
│   │   ├── HUD/
│   │   │   ├── TopBar.tsx       # Hiển thị Xu, Năng lượng, nút Cài Đặt
│   │   │   ├── BottomBar.tsx    # Nút Gieo Hạt (Spawner), Sổ Tay, Nạp Năng Lượng
│   │   │   └── FlyingGift.tsx   # Hộp quà bay ngang màn hình nhận cây cấp cao
│   │   └── Modals/
│   │       ├── OfflineRewardModal.tsx # Nhận xu offline + nút x2 xem Ads
│   │       ├── CollectionModal.tsx    # Sổ tay khám phá 15 loài cây
│   │       ├── SettingsModal.tsx      # Tùy chỉnh SFX, Nhạc BGM, Rung, Reset game
│   │       └── NewDiscoveryModal.tsx  # Chúc mừng khi lần đầu ghép ra loài cây mới
│   └── screens/
│       └── GameScreen.tsx       # Màn hình chính điều phối vòng lặp game
├── __tests__/                   # Unit tests cho Grid Logic và Math Utils
├── App.tsx                      # Root component bọc GestureHandler & SafeArea
├── app.json                     # Cấu hình Expo, Orientation portrait, AdMob Plugin
└── eas.json                     # Cấu hình EAS Build (Development, Preview APK, Production AAB)
```

---

## 🎮 Các Tính Năng Đã Triển Khai (Dựa Theo Plan)

1. **Hệ Thống Lưới & Kéo Thả 60fps:**
   - Sử dụng `Gesture.Pan()` chạy trên UI Thread, phóng to khi nhấc lên và tăng `zIndex`.
   - Snap-back mượt mà bằng `withSpring()` khi thả ra ngoài.
   - Nhận diện chính xác 4 trạng thái: `NOOP`, `MOVE` (ô trống), `MERGE` (cùng cấp < 15), `SWAP` (khác cấp hoặc max level).
   - `React.memo` cho từng item và cell tránh re-render thừa.

2. **Vòng Lặp Kinh Tế & Thu Nhập Thụ Động (Idle Mechanics):**
   - Tự động sinh xu thụ động mỗi giây dựa trên tổng số cây trên bàn cờ.
   - Tính toán xu offline khi người chơi mở lại game (tối đa 4 giờ).
   - Năng lượng tự hồi (1 điểm mỗi 15 giây, tối đa 30 điểm).

3. **3 Điểm Chạm Quảng Cáo Rewarded Ads (AdMob):**
   - **Điểm 1 (BottomBar):** Hết năng lượng -> Xem video để hồi đầy 30 năng lượng ngay lập tức.
   - **Điểm 2 (OfflineRewardModal):** Mở lại app -> Nút "Nhận x2 Xu" khi xem video.
   - **Điểm 3 (FlyingGift):** Khinh khí cầu quà tặng bay ngang màn hình -> Xem video để nhận ngay 1 cây cấp cao (`unlockedMaxLevel - 2`).
   - Sử dụng AdMob Test IDs của Google và cơ chế Fallback an toàn (không bị crash nếu offline).

4. **Sổ Tay Sưu Tầm & Cài Đặt:**
   - Theo dõi tiến độ mở khóa 15 loài cây trong `CollectionModal`.
   - Bảng `SettingsModal` cho phép bật/tắt độc lập SFX, Nhạc Lofi nền và Rung (Haptics), kèm thống kê số lần merge/spawn và nút reset game.
   - Tự động tạm dừng nhạc nền khi app chuyển sang chế độ nền (`AppState` listener) hoặc khi xem video quảng cáo.

---

## 🚀 Lệnh Khởi Chạy & Kiểm Thử

```bash
# Di chuyển vào thư mục dự án
cd merge-game

# Kiểm tra TypeScript
npm run typecheck

# Chạy Unit Tests cho logic bàn cờ
npm test

# Khởi chạy Metro Bundler (Development)
npm start

# Chạy trực tiếp trên thiết bị Android
npm run android

# Sinh mã nguồn native Android
npm run prebuild:android

# Đóng gói file .aab phát hành lên Google Play Store (EAS Build)
npm run build:aab
```
