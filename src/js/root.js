const {ipcRenderer} = require('electron')

workingPath = null

const Save = new Object()
const Editor = new Object()

Save.showInput = function() {
}

Save.save = function(event) {
    document.getElementById("pathDialogPrefix").innerHTML = "save"
    document.getElementById("pathDialog").classList.add("flex")
    document.getElementById("pathDialogInput").focus()
    document.getElementById("pathDialogInput").onkeydown = function(e){
        if(e.keyCode == 13) {
            workingPath = document.getElementById("pathDialogInput").value
            ipcRenderer.send("save", workingPath, document.getElementById("editor").value)
            document.getElementById("pathDialog").classList.remove("flex")
        }
    }
}

Editor.open = function(event, content) {
    document.getElementById("editor").value = content
}

Editor.getPathToOpen = function(event) {
    document.getElementById("pathDialogPrefix").innerHTML = "open"
    document.getElementById("pathDialog").classList.add("flex")
    document.getElementById("pathDialogInput").focus()
    document.getElementById("pathDialogInput").onkeydown = function(e) {
        if(e.keyCode == 13) {
            workingPath = document.getElementById("pathDialogInput").value
            ipcRenderer.send("open", workingPath)
            document.getElementById("pathDialog").classList.remove("flex")
        }
    }
}

Editor.changeFontSize = function(event, type) {
    editor = document.getElementById("editor")
    switch (type) {
        case "+":
            console.log(editor.style.fontSize)
            break;
        default:
            console.log(editor.style.fontSize)

    }
}

function showError(event, error) {
    var message
    var input = document.getElementById("pathDialogInput").value
    console.log(error)
    switch (error["code"]) {
        case "ENOENT":
            message = `Can't find the file "${input}"`
            break
        case "EISDIR":
            message = `"${input}" is a directory`
            break
        default:
            message = "There was some error"

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

function listeners() {
    document.getElementById("editor").focus()
    ipcRenderer.on("save", Save.save)
    ipcRenderer.on("open", Editor.open)
    ipcRenderer.on("getPathToOpen", Editor.getPathToOpen)
    ipcRenderer.on("error", showError)
    ipcRenderer.once("float", function(event) {
        ipcRenderer.send("float")
    })
    document.getElementById("editor").addEventListener("focus", function() {
        if(document.getElementsByClassName("flex").length != 0){
            purgeClass("flex")
        }
    })
}
