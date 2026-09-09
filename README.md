# Page Key & Mouse Blocker for Microsoft Edge

A Manifest V3 Edge/Chromium extension that blocks selected keyboard keys and mouse buttons on a specific page or an entire site.

**Typing-safe Backspace:** if Backspace is on the blocked-key list, it is still allowed inside normal text inputs, search boxes, textareas, password fields, and content-editable editors. It is only blocked when focus is outside an editable field.

## Install in Edge

1. Extract the ZIP.
2. Open `edge://extensions`.
3. Turn on **Developer mode**.
4. Click **Load unpacked**.
5. Select the extracted `edge-key-mouse-blocker` folder.
6. Pin the extension if you want quick access.

## Usage

1. Open the page you want to control.
2. Click the extension icon.
3. Choose **This exact page** or **Entire site**.
4. Turn on **Block controls here**.
5. Add keyboard keys with **Press a key to add**.
6. Check any mouse buttons you want blocked. For accidental browser Back navigation, choose **Back / Mouse 4**.
7. Click **Save**.

An exact-page rule overrides a whole-site rule. This means you can enable a rule for an entire site and then create a disabled exact-page rule as an exception.

## Browser limitations

Content scripts can block input delivered to a webpage, but they cannot reliably disable browser/OS-level shortcuts or controls handled before the page sees them. Examples can include `Ctrl+L`, `Ctrl+T`, `Alt+F4`, the Windows key, some function keys, and hardware mouse Back/Forward behavior depending on Edge/driver behavior.

The extension also cannot run on protected Edge pages such as `edge://settings` or the extension store.
