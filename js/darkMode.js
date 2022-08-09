!function (){
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute("theme", "dark")
    }
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
        event.matches ? document.documentElement.setAttribute("theme", "dark") : document.documentElement.removeAttribute("theme");
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


}();

// {
//     "all_frames": true,
//     "css": ["css/colors.min.css"],
//     "js": ["js/darkMode.min.js"],
//     "matches": ["*://*.bilibili.com/*"],
//     "run_at": "document_start"
// },