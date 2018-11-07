const {ipcRenderer} = require('electron')

const history = [""]
const formats = ["text", "image"]
const displayClass = "editor"


const Save = new Object()
const Editor = new Object()

// @auto-fold here
Save.save = function(event) {
    renderInput("Save")
    var historyPointer = history.length - 1
    document.getElementById("pathDialogInput").onkeydown = function(e){
        if(e.keyCode == 13) {
            history.push(document.getElementById("pathDialogInput").value)
            ipcRenderer.send(
                "save",
                history[history.length - 1],
                document.getElementById("editor").value
            )
            destroyInput()
        }
        switch(e.keyCode) {
            case 13:
                historyPush()
                ipcRenderer.send(
                    "save",
                    history[history.length - 1],
                    document.getElementById("editor").value
                )
            case 38:
                if(history[historyPointer - 1] != undefined) {
                    document.getElementById("pathDialogInput").value = history[--historyPointer]
                }
                break
            case 40:
                if(history[historyPointer + 1] != undefined) {
                    document.getElementById("pathDialogInput").value = history[++historyPointer]
                }
                break
            case 27:
                destroyInput()
                return
        }
    }
}

// @auto-fold here
Editor.open = function(event, content) {
    document.getElementById("image").classList.remove("flex")
    document.getElementById("editor").classList.remove("hide")
    document.getElementById("editor").value = content
}

// @auto-fold here
Editor.getPathToOpen = function(event) {
    renderInput("open")
    var historyPointer = history.length - 1
    document.getElementById("pathDialogInput").onkeydown = function(e) {
        switch(e.keyCode) {
            case 13:
                historyPush()
                Editor.handlePath(history[history.length - 1].split(": "))
                destroyInput()
                break;
            case 38:
                if(history[historyPointer - 1] != undefined) {
                    document.getElementById("pathDialogInput").value = history[--historyPointer]
                }
                break
            case 40:
                if(history[historyPointer + 1] != undefined) {
                    document.getElementById("pathDialogInput").value = history[++historyPointer]
                }
                break
            case 27:
                destroyInput()
                return
        }
    }
}

// @auto-fold here
Editor.handlePath = function(path) {
    if(!formats.includes(path[0])) {
        ipcRenderer.send(
            "open",
            path[0]
        )
    }
    console.log("fullpath: ", path[0], path[1])
    ipcRenderer.send(
        path[0],
        path[1]
    )
}

// @auto-fold here
Editor.openImage = function(event, type, image) {
    var imageObject = new Image()
    var target = document.getElementById("image")
    if(type == "binary") {
        imageObject.src = `data:image/png;base64, ${btoa(image)}`
    }
    imageObject.onload = function() {
        console.log("sending aspect ratio for ", image)
        ipcRenderer.send("setAspectRatio", imageObject.width/imageObject.height)
        target.src = imageObject.src
        document.getElementById("editor").classList.add("hide")
        target.classList.add("flex")
    }
}

// @auto-fold here
Editor.changeFontSize = function(factor) {
    var target = document.getElementById("editor")
    var computedSize = parseFloat(window.getComputedStyle(target).fontSize)
    target.style.fontSize = `${computedSize * factor}`
}

// @auto-fold here
function renderInput(message) {
    var historyIndex = history.length - 1
    document.getElementById("pathDialogPrefix").innerHTML = message
    document.getElementById("pathDialog").classList.add("flex")
    document.getElementById("pathDialogInput").innerHTML = history[historyIndex]
    document.getElementById("pathDialogInput").focus()
}

// @auto-fold here
function destroyInput() {
    setTimeout(function() {
        document.getElementById("editor").focus()
    }, 1)
    document.getElementById("pathDialog").classList.remove("flex")
    document.getElementById("pathDialogInput").onkeydown = null
}

// @auto-fold here
function showError(event, error) {
    var message
    var input = document.getElementById("pathDialogInput").value
    switch (error["code"]) {
        case "ENOENT":
            message = `Can't find the file "${input}"`
            break
        case "EISDIR":
            message = `"${input}" is a directory`
            break
        default:
            message = error
            break

    }
    var target = document.getElementById("info")
    target.style.background = "#ff9bbe"
    target.innerHTML = message
    target.classList.add("flex")
    target.addEventListener("mousedown", function(){
        target.style.visibility = "none"
        target.classList.remove("flex")
        target.innerHTML = ""
    })
    setTimeout(function() {
        target.classList.remove("flex")
        target.innerHTML = ""
    }, 2000)
}

// @auto-fold here
function toggleFloat() {
    ipcRenderer.send(
        "float",
        document.getElementById("editor").value,
        history
    )
}

// @auto-fold here
function historyPush(path) {
    if(path == undefined) {
        path = document.getElementById("pathDialogInput").value
    }
    if(path.length > 0) {
        history.push(path)
    }
}

// @auto-fold here
function listeners() {
    document.getElementById("editor").focus()
    ipcRenderer.on("save", Save.save)
    ipcRenderer.on("open", Editor.open)
    ipcRenderer.on("openImage", Editor.openImage)
    ipcRenderer.on("getPathToOpen", Editor.getPathToOpen)
    ipcRenderer.on("error", showError)
    ipcRenderer.on("floatingIndicator", function(event, isFloating) {
        document.getElementById("floater").style.background = ["#71a4f7", "#ff9bbe"][~~isFloating]
    }),
    ipcRenderer.on("changeSize", function(event, factor) {
        switch(displayClass) {
            case "editor":
                Editor.changeFontSize(factor)
                break;
            default:
                ipcRenderer.send("changeSize", displayClass, factor)
        }
    })
    ipcRenderer.once("float", toggleFloat)
    ipcRenderer.once("restore", function(event, stash) {
        document.getElementById("editor").value = stash[0]
        for(
            var i = 0;
            i < stash[1].length;
            i++
        ) {
            historyPush(stash[1][i])
        }
    })
    document.getElementById("editor").addEventListener("focus", function() {
        destroyInput()
    })
}
