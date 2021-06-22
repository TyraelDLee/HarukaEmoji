console.log("injecting")
var parent = document.body
var popup = document.createElement("div");
popup.setAttribute("id", "emoji-popup");
popup.innerHTML = "<!---->";
parent.appendChild(popup);
document.body.style.backgroundColor = 'red';

window.onload = function() {
    var div1 = document.getElementById("emoji-popup");
    div1.onmousedown = function (ev) {
        var oevent = ev || event;

        var distanceX = oevent.clientX - div1.offsetLeft;
        var distanceY = oevent.clientY - div1.offsetTop;

        document.onmousemove = function (ev) {
            var oevent = ev || event;
            div1.style.left = oevent.clientX - distanceX + 'px';
            div1.style.top = oevent.clientY - distanceY + 'px';
        };
        document.onmouseup = function () {
            document.onmousemove = null;
            document.onmouseup = null;
        };
        ;
    };
}