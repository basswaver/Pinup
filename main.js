const electron = require("electron")
const {ipcMain} = require("electron")
const fs = require("fs")
const localShortcut = require("electron-localshortcut")
const os = require("os")
const request = require("request")

const Calls = new Object()

var newContent = null
var settings = null
var flag = false
var isFloating = false

// @auto-fold here
function parsePath(path) {
    if(path == null || path == "") {
        return null
    }
    path = path.replace("~", os.homedir())
    return path
}

// @auto-fold here
Calls.save = function(window, force) {
    window.webContents.send("save", force)
}

// @auto-fold here
Calls.open = function(window, data){
    window.webContents.send("open", data)
}

// @auto-fold here
Calls.getPathToOpen = function(window) {
    window.webContents.send("getPathToOpen")
}

// @auto-fold here
Calls.error = function(window, error) {
    window.webContents.send("error", error)
}

// @auto-fold here
Calls.float = function(window) {
    window.webContents.send("float")
}

// @auto-fold here
Calls.changeSize = function(window, type) {
    window.webContents.send("changeSize", type)
}

// @auto-fold here
Calls.showPath = function(window, path) {
    window.webContents.send("showPath", path)
}

// @auto-fold here
Calls.popHistory = function(window) {
    window.webContents.send("popHistory")
}

// @auto-fold here
Calls.stash = function(window) {
    window.webContents.send("stash")
}

// @auto-fold here
Calls.restore = function(window, stash) {
    window.webContents.send("restore", stash)
}

// @auto-fold here
Calls.floatingIndicator = function(window) {
    window.webContents.send("floatingIndicator", isFloating)
}

// @auto-fold here
Calls.openImage = function(window, type, image) {
    window.webContents.send("openImage", type, image)
}

// @auto-fold here
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

// @auto-fold here
function openImage(window, path) {
    if(path.slice(0, 4) == "http") {
        format = {
            url: path,
            method: "GET",
            encoding: "binary"
        }
        request(format, function(error, response, body) {
            if(error) {
                Calls.error(window, `Can't find the url ${format.url}`)
                return
            }
            Calls.openImage(window, "binary", body)
        })
    }
}

// @auto-fold here
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

// @auto-fold here
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

// @auto-fold here
function renderNew(restoring, stash) {
    let window = new electron.BrowserWindow({
        width: 250,
        height: 150,
        frame: false,
    })
    window.loadFile("src/root.html")
    window.setAlwaysOnTop(true, "floating", 1)
    window.setVisibleOnAllWorkspaces(true)
    window.setFullScreenable(false)
    handles()
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

// @auto-fold here
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

// @auto-fold here
function handles() {
    // Save from render
    ipcMain.on("save", function(event, path, content) {
        save(path, content)
    })
    // Open from render
    ipcMain.on("open", function(event, path) {
        open(window, path)
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
    // Load image
    ipcMain.on("image", function(event, path) {
        frame = electron.BrowserWindow.getFocusedWindow()
        openImage(frame, path)
    })
    // Set window aspect ratio
    ipcMain.on("setAspectRatio", function(event, ratio) {
        frame = electron.BrowserWindow.getFocusedWindow()
        frame.setSize(parseInt(200*ratio), 200)
        frame.setAspectRatio(ratio)
    })
}

// @auto-fold here
function appHandles() {
    electron.app.on("window-all-closed", function() {
        if(!flag) {
            electron.app.quit()
        }
    })
    electron.app.on("close", function() {

    })
}

// @auto-fold here
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
            label: "File",
            submenu: [
                {
                    label: "Open",
                    accelerator: "Cmd+O",
                    click() {
                        Calls.getPathToOpen(electron.BrowserWindow.getFocusedWindow())
                    }
                },
                {
                    label: "Save",
                    accelerator: "Cmd+S",
                    click() {
                        Calls.save(electron.BrowserWindow.getFocusedWindow())
                    }
                }
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
                    role: "selectall"
                },
            ]
        },
        {
            label: "View",
            submenu: [
                {
                    label: "Grow Font",
                    accelerator: "Cmd+=",
                    click() {
                        Calls.changeSize(electron.BrowserWindow.getFocusedWindow(), 1.25)
                    }
                },
                {
                    label: "Shrink Font",
                    accelerator: "Cmd+-",
                    click() {
                        Calls.changeSize(electron.BrowserWindow.getFocusedWindow(), .8)
                    }
                },
                {
                    label: "Settings",
                    accelerator: "Cmd+,",
                    click() {
                        renderSettings()
                    }
                },
                {
                    type: "separator"
                },
                {
                    role: "toggleDevTools"
                },
            ]
        },
        {
            label: "Window",
            submenu: [
                {
                    label: "Float",
                    accelerator: "Cmd+F",
                    click() {
                        Calls.float(electron.BrowserWindow.getFocusedWindow())
                    }
                },
                {
                    label: "New",
                    accelerator: "Cmd+N",
                    click() {
                        renderNew()
                    }
                },
                {
                    role: "minimize"
                },
                {
                    role: "close"
                }
            ]
        }
    ]
    menu = new electron.Menu.buildFromTemplate(template)
    electron.Menu.setApplicationMenu(menu)
}

// @auto-fold here
electron.app.on("ready", function() {
    buildMenu()
    appHandles()
    renderNew()
})
