// Browser API polyfill for Chrome compatibility
if (typeof browser === "undefined") {
  var browser = chrome;
}

function saveOptions(e) {
    e.preventDefault();
    var trackers = [];
    var fields = document.querySelectorAll(".field_input");

    for (i = 0; i < fields.length; ++i) {
        if (fields[i].value.length > 0) {
            trackers.push(fields[i].value);
        }
    }
    browser.storage.local.set({
        "trackers": trackers
    });
}

function resetOptions(e) {
    e.preventDefault();
    var trackers = [];
    var fields = document.querySelectorAll(".field_input");

    for (i = 0; i < fields.length; ++i) {
        fields[i].value = '';
    }

    browser.storage.local.set({
        "trackers": trackers
    });
}

function addField(e) {
    e.preventDefault();
    var field_parent = document.getElementById('tracker_fields');
    var s = '<input type="text" value="" class="field_input" /><button class="remove_tracker danger">x</button>'; // HTML string

    var div = document.createElement('div');
    div.innerHTML = s;
    div.className += " panel-formElements-item";
    div.getElementsByTagName("button")[0].addEventListener("click", removeField);

    field_parent.appendChild(div);
}

function removeField(e) {
    e.preventDefault();
    this.parentNode.parentNode.removeChild(this.parentNode);
}

function restoreOptions() {

    function setCurrentChoice(result) {
        var field_parent = document.getElementById('tracker_fields');

        if (typeof result.trackers !== "undefined" && result.trackers.length > 0) {
            field_parent.innerHTML = '';
            result.trackers.forEach(function (element) {
                var s = '<input type="text" value="' + element + '" class="field_input" /><button class="remove_tracker danger">x</button>'; // HTML string

                var div = document.createElement('div');
                div.innerHTML = s;
                div.className += " panel-formElements-item";
                div.getElementsByTagName("button")[0].addEventListener("click", removeField);
                field_parent.appendChild(div);
            });
        }
    }

    function onError(error) {
        console.log(`Error: ${error}`);
    }

    var getting = browser.storage.local.get("trackers");
    getting.then(setCurrentChoice, onError);
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("#save_trackers").addEventListener("click", saveOptions);
document.querySelector("#reset_trackers").addEventListener("click", resetOptions);
document.querySelector("#add_tracker").addEventListener("click", addField);
var remove_buttons = document.querySelectorAll(".remove_tracker");
for (i = 0; i < remove_buttons.length; ++i) {
    remove_buttons[i].addEventListener("click", removeField);
}