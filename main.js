
const electron = require("electron")
const {ipcMain} = require("electron")
const fs = require("fs")
const localShortcut = require("electron-localshortcut")
const os = require("os")

const Calls = new Object()

var newContent = null
var settings = null
var flag = false

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

function open(window, path) {
    fs.readFile(path, function read (error, data) {
        if(error) {
            Calls.error(electron.BrowserWindow.getFocusedWindow(), error)
        }
        try {
            Calls.open(window, data)
        }
        catch(e) {
            Calls.error(electron.BrowserWindow.getFocusedWindow(), e)
        }
    })
}

function save(path, content) {
    workingPath = parsePath(path)
    if(workingPath == null) {
        Calls.save(electron.BrowserWindow.getFocusedWindow(), true)
        return
    }
    fs.writeFile(workingPath, content, function(error) {
        if(error) {
            Calls.error(electron.BrowserWindow.getFocusedWindow(), error)
            return
        }
    })
}

function toggleFloating() {
    flag = true
    window = electron.BrowserWindow.getFocusedWindow()
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
    setTimeout(renderNew, 1)
    flag = false
}

function renderNew() {
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
    // Toggle floating
    ipcMain.once("float", function(event) {
        toggleFloating()
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
      { role: "about" },
      { type: "separator" },
      { type: "separator" },
      { role: "hide" },
      { role: "hideothers" },
      { role: "unhide" },
      { type: "separator" },
      { role: "quit" }
    ]
},
    {
    label: "Edit",
    submenu: [
      { role: "undo"},
      { role: "redo" },
      { type: "separator" },
      { role: "cut" },
      { role: "copy" },
      { role: "paste" },
      { role: "pasteandmatchstyle" },
      { role: "delete" },
      { role: "selectall" }
    ]
    },
    {
    label: "View",
    submenu: [
        { role: "toggleDevTools"},
        { role: "close" },
        { role: "minimize" },
        { type: "separator" },
    ]
    },
    {
    role: "window",
    submenu: [
      { role: "minimize" },
      { role: "close" }
    ]
    },
    {
    role: "help",
    submenu: [
      {
        label: "Learn More",
        click () { require("electron").shell.openExternal("https://electronjs.org") }
      }
    ]
    }
    ]
        menu = new electron.Menu.buildFromTemplate(template)
        electron.Menu.setApplicationMenu(menu)
    }

electron.app.on("ready", function() {
    console.log(electron.app.getName())
    buildMenu()
    appHandles()
    renderNew()
})
