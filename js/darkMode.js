!function (){
    let zhuanlan =new RegExp("https://www.bilibili.com/read/cv\\d*");

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setDark()
    }
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
        event.matches ? setDark() : document.documentElement.removeAttribute("theme");
    });
    chrome.storage.onChanged.addListener(function (changes, namespace) {

        for (let [key, {oldValue, newValue}] of Object.entries(changes)) {
            switch (key) {
                case "darkMode":

                    break;
                case "lightMode":

                    break;
                case "systemMode":

                    break;
            }
        }
    });

    function setDark(){
        document.documentElement.setAttribute("theme", "dark");
        if (window.location.href.includes('t.bilibili.com/pages/nav/index_new') || window.location.href.includes('www.bilibili.com/page-proxy/game-nav.html') || window.location.href.includes('manga.bilibili.com/eden/bilibili-nav-panel.html')){
            document.documentElement.style.backgroundColor = "transparent";
            document.body.style.backgroundColor = "transparent";
        }
    }

}();

// {
//     "all_frames": true,
//     "css": ["css/colors.min.css"],
//     "js": ["js/darkMode.min.js"],
//     "matches": ["*://*.bilibili.com/*"],
//     "run_at": "document_start"
// },