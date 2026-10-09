import Cocoa
import WebKit

// Native shell for The Lost Fisherman: a window hosting the HTML5 game,
// plus a tiny bridge so the game can save, quit, and toggle full screen.

final class GameWebView: WKWebView {
    override var acceptsFirstResponder: Bool { true }
}

final class AppDelegate: NSObject, NSApplicationDelegate, NSWindowDelegate, WKScriptMessageHandler, WKNavigationDelegate {
    var window: NSWindow!
    var webView: GameWebView!

    lazy var saveURL: URL = {
        let fm = FileManager.default
        let base = fm.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        let dir = base.appendingPathComponent("The Lost Fisherman", isDirectory: true)
        try? fm.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir.appendingPathComponent("save.json")
    }()

    func applicationDidFinishLaunching(_ notification: Notification) {
        buildMenu()

        let controller = WKUserContentController()
        controller.addUserScript(WKUserScript(source: saveInjection(), injectionTime: .atDocumentStart, forMainFrameOnly: true))
        for name in ["save", "quit", "fullscreen"] { controller.add(self, name: name) }

        let config = WKWebViewConfiguration()
        config.userContentController = controller
        config.mediaTypesRequiringUserActionForPlayback = []

        webView = GameWebView(frame: .zero, configuration: config)
        webView.autoresizingMask = [.width, .height]
        webView.navigationDelegate = self

        var size = NSSize(width: 1440, height: 810)
        if let vf = NSScreen.main?.visibleFrame {
            let w = min(size.width, floor(vf.width * 0.92))
            size = NSSize(width: w, height: floor(w * 9 / 16))
            if size.height > vf.height * 0.92 {
                size.height = floor(vf.height * 0.92)
                size.width = floor(size.height * 16 / 9)
            }
        }
        window = NSWindow(contentRect: NSRect(origin: .zero, size: size),
                          styleMask: [.titled, .closable, .miniaturizable, .resizable],
                          backing: .buffered, defer: false)
        window.title = "The Lost Fisherman"
        window.backgroundColor = .black
        window.collectionBehavior = [.fullScreenPrimary]
        window.contentMinSize = NSSize(width: 480, height: 270)
        window.contentView = webView
        window.delegate = self
        window.center()
        window.makeKeyAndOrderFront(nil)
        window.makeFirstResponder(webView)

        if let res = Bundle.main.resourceURL?.appendingPathComponent("game", isDirectory: true) {
            webView.loadFileURL(res.appendingPathComponent("index.html"), allowingReadAccessTo: res)
        }
        NSApp.activate(ignoringOtherApps: true)
    }

    // Hand the saved game to the page before any game script runs.
    func saveInjection() -> String {
        guard let data = try? Data(contentsOf: saveURL),
              let text = String(data: data, encoding: .utf8),
              let literal = try? JSONSerialization.data(withJSONObject: [text]),
              let literalText = String(data: literal, encoding: .utf8) else {
            return "window.__SAVE_DATA__ = '';"
        }
        return "window.__SAVE_DATA__ = \(literalText)[0];"
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        switch message.name {
        case "save":
            guard let text = message.body as? String else { return }
            if text.isEmpty {
                try? FileManager.default.removeItem(at: saveURL)
            } else {
                try? text.data(using: .utf8)?.write(to: saveURL, options: .atomic)
            }
        case "quit":
            NSApp.terminate(nil)
        case "fullscreen":
            window.toggleFullScreen(nil)
        default:
            break
        }
    }

    // Developer self-test: LF_SELFTEST=/path/prefix writes a status JSON and a snapshot PNG, then quits.
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        guard let prefix = ProcessInfo.processInfo.environment["LF_SELFTEST"] else { return }
        let script = ProcessInfo.processInfo.environment["LF_SELFTEST_JS"] ?? ""
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            webView.evaluateJavaScript(script + ";1") { _, _ in
                DispatchQueue.main.asyncAfter(deadline: .now() + 2.5) {
                    webView.evaluateJavaScript("JSON.stringify({scene: Game.sceneId, error: Game.error, w: innerWidth, h: innerHeight, audio: !!(window.AudioContext||window.webkitAudioContext)})") { result, err in
                        let text = (result as? String) ?? "js error: \(String(describing: err))"
                        try? text.write(toFile: prefix + ".json", atomically: true, encoding: .utf8)
                        webView.takeSnapshot(with: nil) { image, _ in
                            if let tiff = image?.tiffRepresentation, let rep = NSBitmapImageRep(data: tiff),
                               let png = rep.representation(using: .png, properties: [:]) {
                                try? png.write(to: URL(fileURLWithPath: prefix + ".png"))
                            }
                            NSApp.terminate(nil)
                        }
                    }
                }
            }
        }
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }

    func buildMenu() {
        let main = NSMenu()

        let appItem = NSMenuItem()
        main.addItem(appItem)
        let appMenu = NSMenu()
        appMenu.addItem(withTitle: "About The Lost Fisherman", action: #selector(NSApplication.orderFrontStandardAboutPanel(_:)), keyEquivalent: "")
        appMenu.addItem(.separator())
        appMenu.addItem(withTitle: "Hide The Lost Fisherman", action: #selector(NSApplication.hide(_:)), keyEquivalent: "h")
        appMenu.addItem(.separator())
        appMenu.addItem(withTitle: "Quit The Lost Fisherman", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        appItem.submenu = appMenu

        let viewItem = NSMenuItem()
        main.addItem(viewItem)
        let viewMenu = NSMenu(title: "View")
        let fs = NSMenuItem(title: "Toggle Full Screen", action: #selector(NSWindow.toggleFullScreen(_:)), keyEquivalent: "f")
        fs.keyEquivalentModifierMask = [.command, .control]
        viewMenu.addItem(fs)
        viewItem.submenu = viewMenu

        let windowItem = NSMenuItem()
        main.addItem(windowItem)
        let windowMenu = NSMenu(title: "Window")
        windowMenu.addItem(withTitle: "Minimize", action: #selector(NSWindow.performMiniaturize(_:)), keyEquivalent: "m")
        windowItem.submenu = windowMenu

        NSApp.mainMenu = main
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.regular)
app.run()
