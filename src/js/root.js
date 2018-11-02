const {ipcRenderer} = require('electron')

workingPath = null

const Save = new Object()
const Editor = new Object()

Save.showInput = function() {
}

Save.save = function(event, force) {
    if(!force) {
        ipcRenderer.send("save", workingPath, document.getElementById("editor").value)
        return
    }
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
    console.log("odd flex but ok")
    document.getElementById("pathDialogInput").focus()
    document.getElementById("pathDialogInput").onkeydown = function(e) {
        if(e.keyCode == 13) {
            workingPath = document.getElementById("pathDialogInput").value
            ipcRenderer.send("open", workingPath)
            document.getElementById("pathDialog").classList.remove("flex")
        }
    }
}

function showError(event, message) {
    var target = document.getElementById("error")
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

function listeners() {
    ipcRenderer.on("save", Save.save)
    ipcRenderer.on("open", Editor.open)
    ipcRenderer.on("getPathToOpen", Editor.getPathToOpen)
    ipcRenderer.on("error", showError)
}

function saveSubmit(e) {
    console.log(e)
}
