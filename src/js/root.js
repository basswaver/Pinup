const {ipcRenderer} = require('electron')

const history = [""]


const Save = new Object()
const Editor = new Object()

Save.save = function(event) {
    renderInput("save")
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
                history.push(document.getElementById("pathDialogInput").value)
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
        }
    }
}

Editor.open = function(event, content) {
    document.getElementById("editor").value = content
}

Editor.getPathToOpen = function(event) {
    renderInput("open")
    var historyPointer = history.length - 1
    document.getElementById("pathDialogInput").onkeydown = function(e) {
        switch(e.keyCode) {
            case 13:
                history.push(document.getElementById("pathDialogInput").value)
                ipcRenderer.send(
                    "open",
                    history[history.length - 1]
                )
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
        }
    }
}

function renderInput(message) {
    var historyIndex = history.length - 1
    document.getElementById("pathDialogPrefix").innerHTML = message
    document.getElementById("pathDialog").classList.add("flex")
    document.getElementById("pathDialogInput").innerHTML = history[historyIndex]
    document.getElementById("pathDialogInput").focus()
}

function destroyInput() {
    document.getElementById("editor").focus()
    document.getElementById("pathDialog").classList.remove("flex")
    document.getElementById("pathDialogInput").onkeydown = null
}

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
            message = "There was some error"
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

function purgeClass(className) {
    while(true) {
        try{
            document.getElementsByClassName("flex")[0].classList.remove("flex")
        }
        catch {
            break
        }
    }
}

function toggleFloat() {
    ipcRenderer.send(
        "float",
        document.getElementById("editor").value,
        history
    )
}

function listeners() {
    document.getElementById("editor").focus()
    ipcRenderer.on("save", Save.save)
    ipcRenderer.on("open", Editor.open)
    ipcRenderer.on("getPathToOpen", Editor.getPathToOpen)
    ipcRenderer.on("error", showError)
    ipcRenderer.once("float", toggleFloat)
    ipcRenderer.on("floatingIndicator", function(event, isFloating) {
        document.getElementById("floater").style.background = ["#71a4f7", "#ff9bbe"][~~isFloating]
    }),
    ipcRenderer.once("restore", function(event, stash) {
        document.getElementById("editor").value = stash[0]
        for(
            var i = 0;
            i < stash[1].length;
            i++
        ) {
            history.push(stash[1][i])
        }
    })
    document.getElementById("editor").addEventListener("focus", function() {
        if(document.getElementsByClassName("flex").length != 0){
            purgeClass("flex")
        }
    })
}
