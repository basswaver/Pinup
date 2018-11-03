
const electron = require("electron")
const {ipcMain} = require("electron")
const fs = require("fs")
const localShortcut = require("electron-localshortcut")
const os = require("os")

const Calls = new Object()

var newContent = null
var settings = null
var flag = false
var isFloating = false

function parsePath(path) {
    if(path == null || path == "") {
        return null
    }
    path = path.replace("~", os.homedir())
    return path
}

Calls.save = function(window, force) {
    window.webContents.send("save", force)
}

Calls.open = function(window, data){
    window.webContents.send("open", data)
}

Calls.getPathToOpen = function(window) {
    window.webContents.send("getPathToOpen")
}

Calls.error = function(window, error) {
    window.webContents.send("error", error)
}

Calls.float = function(window) {
    window.webContents.send("float")
}

Calls.fontSize = function(window, type) {
    window.webContents.send("fontSize", type)
}

Calls.showPath = function(window, path) {
    window.webContents.send("showPath", path)
}

Calls.popHistory = function(window) {
    window.webContents.send("popHistory")
}

Calls.stash = function(window) {
    window.webContents.send("stash")
}

Calls.restore = function(window, stash) {
    window.webContents.send("restore", stash)
}

Calls.floatingIndicator = function(window) {
    window.webContents.send("floatingIndicator", isFloating)
}

function open(window, path) {
    path = parsePath(path)
    fs.readFile(path, function read (error, data) {
        if(error) {
            Calls.error(electron.BrowserWindow.getFocusedWindow(), error)
            return
        }
        try {
            Calls.open(window, data)
            return
        }
        catch(e) {
            Calls.error(electron.BrowserWindow.getFocusedWindow(), e)
            return
        }
    })
}

function save(path, content) {
    path = parsePath(path)
    Calls.showPath(electron.BrowserWindow.getFocusedWindow(), path)
    if(path == null) {
        Calls.save(electron.BrowserWindow.getFocusedWindow(), true)
        return
    }
    fs.writeFile(path, content, function(error) {
        if(error) {
            Calls.error(electron.BrowserWindow.getFocusedWindow(), error)
            return
        }
    })
}

function toggleFloating(content, history) {
    flag = true
    isFloating = !isFloating
    window = electron.BrowserWindow.getFocusedWindow()
    Calls.stash(window)
    if (window == null) {
        return
    }
    if(electron.app.dock.isVisible()) {
        electron.app.dock.hide()
    }
    else{
        electron.app.dock.show()
    }
    window.close()
    setTimeout(function() {
        renderNew(true, [content, history])
    }, 1)
    flag = false
}

function renderNew(restoring, stash) {
    let window = new electron.BrowserWindow({
        width: 200,
        height: 200,
        frame: false,
    })
    window.loadFile("src/root.html")
    window.setAlwaysOnTop(true, "floating", 1)
    window.setVisibleOnAllWorkspaces(true)
    window.setFullScreenable(false)
    handles(window)
    if(restoring) {
        window.webContents.on("did-finish-load", function() {
            Calls.restore(window, stash)
        })
    }
    window.webContents.on("did-finish-load", function() {
        Calls.floatingIndicator(window)
        if(restoring) {
            Calls.restore(window, stash)
        }
    })
    window.show()
}

function renderSettings(width = 200, height = 800) {
    if(settings) {
        return
    }
    var window = new electron.BrowserWindow({
        width: width,
        height: height,
        frame: true,
    })
    window.loadFile("src/settings.html")
    window.setVisibleOnAllWorkspaces(true)
    window.setFullScreenable(false)
    settings = window
}

function handles(window) {
    localShortcut.register(window, "Cmd+S", function() {
        Calls.save(window)
    })
    localShortcut.register(window, "Cmd+O", function() {
        Calls.getPathToOpen(window)
    })
    localShortcut.register(window, "Cmd+,", function() {
        // this is a placeholder, will open settings
    })
    localShortcut.register(window, "Cmd+N", function() {
        renderNew()
    })
    localShortcut.register(window, "Cmd+F", function() {
        Calls.float(window)
    })
    localShortcut.register(window, "Cmd+=", function() {
        Calls.fontSize(window, "+")
    })
    localShortcut.register(window, "Cmd+-", function() {
        Calls.fontSize(window, "-")
    })
    // Save from render
    ipcMain.on("save", function(event, path, content) {
        save(path, content)
    })
    // Open from render
    ipcMain.on("open", function(event, path) {
        open(electron.BrowserWindow.getFocusedWindow(), path)
    })
    // Stash window content before page destruction
    ipcMain.on("stash", function(event, editor, history) {
        stash["editor"] = editor
        stash["history"] = history
    })
    // Toggle floating
    ipcMain.once("float", function(event, content, history) {
        toggleFloating(content, history)
    })
    // Log before page destruction
    ipcMain.on("log", function(event, message) {
        console.log(message);
    })
}

function appHandles() {
    electron.app.on("window-all-closed", function() {
        if(!flag) {
            electron.app.quit()
        }
    })
    electron.app.on("close", function() {

    })
}

function buildMenu() {
    template = [
        {
            label: electron.app.getName(),
            submenu: [
                {
                    label: `About ${electron.app.getName()}`,
                    click() {
                        // TODO redirect to an about page
                    }
                },
                {
                    label: "Quit",
                    click() {
                        electron.app.quit()
                    },
                    accelerator: "Cmd+Q"
                },
            ]
        },
        {
            label: "Edit",
            submenu: [
                {
                    role: "undo"
                },
                {
                    role: "redo"
                },
                {
                    role: "cut"
                },
                {
                    role: "copy"
                },
                {
                    role: "paste"
                },
                {
                    role: "delete"
                },
                {
                    role: "selectall"
                },
            ]
        },
        {
            label: "View",
            submenu: [
                {
                    role: "toggleDevTools"
                },
                {
                    role: "close"
                },
                {
                    role: "minimize"
                }
            ]
        }
    ]
    menu = new electron.Menu.buildFromTemplate(template)
    electron.Menu.setApplicationMenu(menu)
}

electron.app.on("ready", function() {
    buildMenu()
    appHandles()
    renderNew()
})
