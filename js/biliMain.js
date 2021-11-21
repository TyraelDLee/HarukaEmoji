const ZONEKV = {
    "直播": "rua_live", "动画": "rua_douga", "番剧": "rua_anime", "国创": "rua_guochuang",
    "音乐": "rua_music", "舞蹈": "rua_dance", "游戏": "rua_game",
    "知识": "rua_knowledge", "课堂": "rua_cheese", "科技": "rua_tech",
    "运动": "rua_sports", "汽车": "rua_car", "生活": "rua_life",
    "美食": "rua_food", "动物圈": "rua_animal", "鬼畜": "rua_kichiku",
    "时尚": "rua_fashion", "资讯": "rua_information", "娱乐": "rua_ent",
    "电影": "rua_movie", "TV剧": "rua_teleplay", "专栏": "rua_read",
    "影视": "rua_cinephile", "纪录片": "rua_documentary", "漫画": "rua_manga"};
const ZONEVK = {
    "rua_live":"直播","rua_douga":"动画","rua_anime":"番剧","rua_guochuang":"国创",
    "rua_music":"音乐","rua_dance":"舞蹈","rua_game":"游戏",
    "rua_knowledge":"知识","rua_cheese":"课堂","rua_tech":"科技",
    "rua_sports":"运动","rua_car":"汽车","rua_life":"生活",
    "rua_food":"美食","rua_animal":"动物圈","rua_kichiku":"鬼畜",
    "rua_fashion":"时尚","rua_information":"资讯","rua_ent":"娱乐",
    "rua_movie":"电影","rua_teleplay":"TV剧","rua_read":"专栏",
    "rua_cinephile":"影视","rua_documentary":"纪录片","rua_manga":"漫画"};
const LIST_HOST = document.createElement("div");
const ZONE_LIST = document.getElementById("elevator").getElementsByClassName("list-box")[0].getElementsByClassName("sortable");
const sortButton = document.getElementsByClassName("sort")[0];
const bg = document.getElementsByClassName("bg23")[0];
const banIcon = "<svg class=\"rua-ban-ic rua-on\" version=\"1.1\" baseProfile=\"full\" width=\"18\" height=\"18\" xmlns=\" http://www.w3.org/2000/svg\" style=\"margin: 3px\"><circle cx=\"50%\" cy=\"50%\" r=\"50%\" fill=\"#FB7299\"></circle><rect x=\"3\" y=\"7\" width=\"12\" height=\"4\" fill=\"white\"></rect><rect x=\"3\" y=\"7\" width=\"12\" height=\"4\" fill=\"white\"></rect></svg>";

LIST_HOST.style.position = "absolute";
LIST_HOST.style.left = "-24px";
LIST_HOST.style.width = "24px";
document.getElementById("elevator").getElementsByClassName("list-box")[0].getElementsByTagName("div")[0].appendChild(LIST_HOST);
bg.style.width = "160px";

setTimeout(loadSetting,200);
setTimeout(()=>{
    var obs = new MutationObserver(function (m){
        m.forEach(function(mutation) {
            if (mutation.type === "attributes") {
                let o = JSON.parse(localStorage.getItem("rua_main_hidden"));
                if(document.getElementById("elevator").classList.contains("edit")){
                    hideElevator("all", false);
                }else{
                    for (let i = 0; i < Object.keys(o).length; i++) {
                        hideElevator(Object.keys(o)[i], true);
                        hideBlock(o[Object.keys(o)[i]].replace("rua_","bili_"));
                    }
                }
            }
        });
    });
    obs.observe(document.getElementById("elevator"),{attributes: true});
},300);


document.getElementById("elevator").getElementsByClassName("list-box")[0].getElementsByTagName("div")[0].addEventListener("mouseenter", () => {
    if (document.getElementById("elevator").classList.contains("edit")) {
        LIST_HOST.classList.remove("rua-ban-close");
        LIST_HOST.classList.add("rua-ban-open");
        for (let i = 0; i < ZONE_LIST.length; i++) {
            if (ZONEKV[ZONE_LIST[i].innerText.replace(" ", "")] !== undefined) {
                let b = document.createElement("div");
                b.setAttribute("id", ZONEKV[ZONE_LIST[i].innerText.replace(" ", "")]);
                b.setAttribute("class", "rua-ban");
                b.innerHTML = banIcon;
                LIST_HOST.appendChild(b);
                b.addEventListener("click", clickHandler);
            }
        }
    }
});
document.getElementById("elevator").getElementsByClassName("list-box")[0].getElementsByTagName("div")[0].addEventListener("mouseleave", () => {
    if (document.getElementById("elevator").classList.contains("edit")) {
        LIST_HOST.classList.remove("rua-ban-open");
        LIST_HOST.classList.add("rua-ban-close");
        setTimeout(() => {
            for (let i = 0; i < LIST_HOST.getElementsByClassName("rua-ban").length; i++) {
                LIST_HOST.getElementsByClassName("rua-ban")[i].removeEventListener("click", clickHandler);
                LIST_HOST.removeChild(LIST_HOST.getElementsByClassName("rua-ban")[i]);
            }
            LIST_HOST.innerHTML = "";
        }, 200);
    }
});

function clickHandler() {
    hideBlock(this.id.replace("rua_","bili_"));
    setSeting(ZONEVK[this.id], this.id);
}

function loadSetting(){
    if(localStorage.getItem("rua_main_hidden")===null){
        localStorage.setItem("rua_main_hidden", "{}");
    }else{
        let o = JSON.parse(localStorage.getItem("rua_main_hidden"));
        for (let i = 0; i < Object.keys(o).length; i++) {
            hideBlock(o[Object.keys(o)[i]].replace("rua_","bili_"));
            hideElevator(Object.keys(o)[i],true);
            setDisable(Object.keys(o)[i],true);
        }
    }
}

function setSeting(k,v){
    let ob = JSON.parse(localStorage.getItem("rua_main_hidden"));
    if(Object.keys(ob).includes(k)){
        delete ob[k];
        showBlock(v.replace("rua_","bili_"));
        setDisable(k,false);
    }else{
        ob[k] = v
        setDisable(k,true);
    }
    localStorage.setItem("rua_main_hidden",JSON.stringify(ob));
}

function hideBlock(id){
    document.getElementById(id).classList.remove("rua-display");
    document.getElementById(id).classList.add("rua-hidden");
}

function showBlock(id){
    document.getElementById(id).classList.remove("rua-hidden");
    document.getElementById(id).classList.add("rua-display");
}

function hideElevator(context, off){
    for (let i = 0; i < ZONE_LIST.length; i++) {
        if(ZONE_LIST[i].innerText.replace(" ", "")===context || context==="all")
            ZONE_LIST[i].style.display=off?"none":"block";
    }
}

function setDisable(k,d){
    if(d){
        for (let i = 0; i < ZONE_LIST.length; i++) {
            if (ZONE_LIST[i].innerText.replace(" ", "").includes(k)) {
                ZONE_LIST[i].classList.remove("rua-elv-enable");
                ZONE_LIST[i].classList.add("rua-elv-disable");
            }
        }
    }else{
        for (let i = 0; i < ZONE_LIST.length; i++) {
            if (ZONE_LIST[i].innerText.replace(" ", "")===k) {
                ZONE_LIST[i].classList.remove("rua-elv-disable");
                ZONE_LIST[i].classList.add("rua-elv-enable");
            }
        }
    }
}
