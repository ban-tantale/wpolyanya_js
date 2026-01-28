function debug_message(s) {
    const div = document.getElementById('debug');
    div.innerHTML += "<p>" + s + "</p>";
}

function debug_warning(s) {
    const div = document.getElementById('debug');
    div.innerHTML += "<p style=\"background-color:#FFbbbb;\">" + s + "</p>";
}