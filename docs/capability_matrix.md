# Nothing Desk — Hardware & Device Capability Matrix

| Hardware Category | Subsystem / Protocol | Supported State | Notes & Boundaries |
| :--- | :--- | :---: | :--- |
| **Phone Screen (Handheld)** | Portrait / Landscape | 🟢 Full Support | Responsive canvas, window clamping, touch hit targets |
| **Bluetooth Mouse** | Bluetooth HID | 🟢 Full Support | Hover effects, pointer capture, right-click context menu |
| **Bluetooth Keyboard** | Bluetooth HID / USB-OTG | 🟢 Full Support | Windows-inspired shortcuts (`Ctrl+Space`, `Meta+D`, `Alt+Tab`, `Alt+F4`, `Meta+I`, etc.) |
| **External Monitor (Mirror)** | USB-C / DisplayPort Alt-Mode | 🟢 Full Support | Accurately labeled mirror screen with status pill |
| **External Monitor (Extended Desktop)**| Android Presentation Surface | 🟡 Native Dependent | Enabled on devices with native secondary display output support (API 29+) |
| **App Windowing** | Built-in Tool Suite | 🟢 Full Support | First-class floating windows (Settings, Help, Files, About) |
| **Android Apps** | Intent Activity Launch | 🟢 Full Support | Launches external apps via native `PackageManager` |
| **File Storage** | Storage Access Framework (SAF) | 🟢 Full Support | Scoped access only; zero broad file system intrusion |

---
*Reference: Nothing Desk MVP Product & Technical Specification.*
