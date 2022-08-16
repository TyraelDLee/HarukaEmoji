!function (){
    let systemDark = false;

    //for new page.
    chrome.storage.sync.get(["darkMode", "darkModeSystem"], (result)=>{
        if(result.darkMode)
            setDark();
        if (result.darkModeSystem){//if following system, then check the system scheme instantly for new page.
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
                setDark();
        }
        systemDark = result.darkModeSystem;
    });
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches && systemDark) {
        setDark();
    }

    //for existed pages.
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
        if(systemDark){
            event.matches ? setDark() : setLight();
        }
    });
    chrome.storage.onChanged.addListener(function (changes, namespace) {
        for (let [key, {oldValue, newValue}] of Object.entries(changes)) {
            switch (key) {
                case "darkMode":
                    console.log(newValue)
                    if(newValue) setDark();
                    else setLight();
                    break;
                case "darkModeSystem":
                    systemDark = newValue;
                    if (!newValue)
                        setLight();
                    else{
                        //if following system, then check the system scheme instantly for existed pages.
                        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
                            setDark();
                    }
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
        if (window.location.href.includes('message.bilibili.com')){
            document.body.style.background = `url(${chrome.runtime.getURL("../images/misc/infocenterbg.dark.webp")}) top/cover no-repeat fixed`;
        }
    }

    function setLight(){
        document.documentElement.removeAttribute("theme");
        if (window.location.href.includes('message.bilibili.com')){
            document.body.style.background = `url(${chrome.runtime.getURL("../images/misc/infocenterbg.light.webp")}) top/cover no-repeat fixed`;
        }
    }
}();
