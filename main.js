const electron = require("electron")
const {ipcMain} = require("electron")
const fs = require("fs")
const localShortcut = require("electron-localshortcut")
const os = require("os")

const Calls = new Object()

var workingPath = null
var newContent = null
var windows = []
var settings = null
var flag = false

function open(window, path) {
    fs.readFile(path, function read (error, data) {
        if(error) {
            throw "Error reading file"
        }
        Calls.open(window, data)
    })
}

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
    window.webContents.send(error)
}

function remove(item, array) {
    for(
        var i = 0;
        i < array.length;
        i++
    ) {
        if(array[i] == item) {
            array.splice(i, 1)
        }
    }
    return array
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
        }
    })
    workingPath = null
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
    setTimeout(renderNew, 100)
    flag = false
}

function renderNew() {
    let window = new electron.BrowserWindow({
        width: 200,
        height: 200,
        frame: true,
    })
    window.loadFile("src/root.html")
    window.setAlwaysOnTop(true, "floating", 1)
    window.setVisibleOnAllWorkspaces(true)
    window.setFullScreenable(false)
    handles(window)
    windows.push(window)
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
    localShortcut.register(window, "CmdOrCtrl+S", function() {
        Calls.save(electron.BrowserWindow.getFocusedWindow(), (workingPath == null || workingPath == ""))
    })
    localShortcut.register(window, "CommandOrControl+Shift+S", function() {
        Calls.save(electron.BrowserWindow.getFocusedWindow(), true)
    })
    localShortcut.register(window, "CmdOrCtrl+O", function() {
        Calls.getPathToOpen(electron.BrowserWindow.getFocusedWindow())
    })
    localShortcut.register(window, "CmdOrCtrl+,", function() {

    })
    localShortcut.register(window, "CmdOrCtrl+N", function() {
        renderNew()
    })
    localShortcut.register(window, "CmdOrCtrl+Alt+N", function() {

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
        setTimeout(toggleFloating, 100)
    })
}

function appHandles() {
    electron.app.on("window-all-closed", function() {
        if(!flag) {
            electron.app.quit()
        }
    })

    electron.app.on("activate", function() {
        if(electron.BrowserWindow.getAllWindows().length == 0) {
            renderNew()
        }
    })
}

appHandles()
electron.app.on("ready", renderNew)
