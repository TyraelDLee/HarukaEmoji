/***
 * Copyright (c) 2021 Tyrael, Y. LI
 * */
const qn_table = {"原画":10000, "蓝光":400,"超清":250,"高清":150,"流畅":80};
var qn;
var qnv = "原画";
var room_id = window.location["pathname"].replaceAll("/", "").replace("blanc","");
var exp =new RegExp("^[0-9]*$");
chrome.storage.sync.get(["qn"], function(result){qn = result.qn});
chrome.storage.sync.get(["qnvalue"], function(result){qnv = result.qnvalue});

if(document.getElementsByTagName("article").length === 0) {
    c();
    setFullscreen();
    setTimeout(function (){
        if(qn && exp.test(room_id))q(qnv);
    },20);
}

function c(){
    let e = document.createEvent("MouseEvents");
    e.initEvent("click", false, true);
    if(document.getElementsByClassName("medal-section").length === 0 || document.getElementsByClassName("medal-section")[0].getElementsByTagName("span").length === 0 || document.getElementsByClassName("medal-section")[0].getElementsByTagName("span")[0].getElementsByTagName("span").length === 0)
        setTimeout(c,200);
    else{
        let m = document.getElementsByClassName("medal-section")[0].getElementsByTagName("span")[0];
        m.dispatchEvent(e);
        setTimeout(function (){
            let i =  document.getElementById("control-panel-ctnr-box").getElementsByClassName("medal")[0];
            if(i!==undefined) i.style.display = "none";
            let s = document.getElementById("control-panel-ctnr-box").getElementsByClassName("fans-medal-content")[0].innerText;
            if(s===undefined || s !== medalName && medalName !== "none")
                setTimeout(c, 1000);
        },20);
    }
}

function q(qn){
    let e = document.createEvent("MouseEvents");
    e.initEvent("mousemove", false, false);
    if(document.getElementById("live-player") === undefined || document.getElementById("live-player").getElementsByClassName("web-player-controller-wrap").length===undefined||document.getElementById("live-player").getElementsByClassName("web-player-controller-wrap").length===0)
        setTimeout(q,200);
    else{
        let v = document.getElementById("live-player");
        let s = v.getElementsByClassName("web-player-controller-wrap");
        if(s!==undefined){
            s[0].style.visibility = "hidden";
            s[1].style.visibility = "hidden";
        }
        v.dispatchEvent(e);
        setTimeout(function (){
            e.initEvent("mouseenter", false, true);
            let vp = v.getElementsByClassName("quality-wrap")[0];
            if(vp !== undefined){
                vp.dispatchEvent(e);
                e.initEvent("click", false, true);
                setTimeout(function (){
                    let vps = vp.getElementsByClassName("panel")[0].getElementsByClassName("quality-it");
                    if(vps.length>1){
                        let obj=[];
                        for (let i = 0; i < vps.length; i++)
                            obj.push(vps[i].innerHTML.replaceAll(" ",""));
                        vps[getAvailableQN(qn,obj)].dispatchEvent(e);
                        e.initEvent("mouseleave",false,false);
                        v.dispatchEvent(e);
                    }
                },100);
            }
            setTimeout(()=>{
                if(s!==undefined){
                    s[0].style.visibility = "visible";
                    s[1].style.visibility = "visible";
                }
            },250);
        },100);
    }
}

function getAvailableQN(qn, obj){
    let index = 0;
    for (let i = 0; i < obj.length; i++) {
        if (qn_table[obj[i]]>=qn_table[qn]) index=i;
    }
    return index;
}

function setFullscreen(){
    if(document.getElementById("live-player")===undefined || document.getElementById("live-player")===null)
        setTimeout(setFullscreen, 200);
    else{
        let text = "网页全屏(无侧边栏)";
        $("#live-player").on("mousemove", function (){
            if($(".right-area .tip-wrap").length < 5)
                $(".danmaku").before("<div class=\"tip-wrap svelte-1fgqxfc\" id='rua_fs'><div class=\"tip panel svelte-1fgqxfc\" id=\"rua_tip\" style=\"display: none\">"+text+"</div><div><span class=\"icon\"><!--?xml version=\"1.0\" encoding=\"UTF-8\"?--><svg viewBox=\"0 0 36 36\" xmlns=\"http://www.w3.org/2000/svg\"><g id=\"终稿\" stroke=\"none\" stroke-width=\"1\" fill-rule=\"evenodd\" opacity=\"0.9\" transform=\"matrix(0.833333, 0, 0, 0.833333, 3.000015, 2.605011)\" style=\"\"><g id=\"图标切图\" transform=\"translate(-439.000000, -166.000000)\"><g id=\"编组-3\" transform=\"translate(421.000000, 56.000000)\"><g id=\"编组-4\" transform=\"translate(18.000000, 110.000000)\"><g id=\"icon_全屏\" transform=\"translate(7.000000, 7.000000)\"><g id=\"player_fullscreen\"><path d=\"M11,14 C11.8082096,14 12.5417733,13.6804031 13.0812046,13.160696 L15.805943,18.6107695 C14.4154537,19.4906588 12.7672084,20 11,20 C9.23279163,20 7.58454627,19.4906588 6.19405697,18.6107695 L8.91879538,13.160696 C9.45822673,13.6804031 10.1917904,14 11,14 Z M11,10 C11.5522847,10 12,10.4477153 12,11 L12,11 L12,11.001 L11.9932723,11.1166211 C11.9355072,11.6139598 11.5128358,12 11,12 C10.4477153,12 10,11.5522847 10,11 C10,10.4477153 10.4477153,10 11,10 Z M20,11 L14,11 L14,11 C14,9.8257911 13.3254017,8.80914308 12.3426283,8.31647923 L15.0261034,2.94854495 C17.9753898,4.42620082 20,7.47666388 20,11 Z M6.97389656,2.94854495 L9.65737173,8.31647923 C8.67459834,8.80914308 8,9.8257911 8,11 L2,11 L2,11 C2,7.47666388 4.02461023,4.42620082 6.97389656,2.94854495 Z\" id=\"Combined-Shape\" fill-rule=\"nonzero\" style=\"\"></path><path fill-rule=\"evenodd\" opacity=\"0.9\" id=\"svg_1\" d=\"M -2.2 13.875 L 1.4 13.875 L 1.4 17.475 L 5 17.475 L 5 21.074 L -2.2 21.074 L -2.2 13.875 Z\" style=\"\"></path><path fill-rule=\"evenodd\" opacity=\"0.9\" id=\"path-1\" d=\"M -2.2 1.874 L 1.4 1.874 L 1.4 5.474 L 5 5.474 L 5 9.074 L -2.2 9.074 L -2.2 1.874 Z\" style=\"\" transform=\"matrix(0, 1, -1, 0, 6.874, 4.074)\"></path><path fill-rule=\"evenodd\" opacity=\"0.9\" id=\"path-2\" d=\"M 17 13.874 L 20.6 13.874 L 20.6 17.474 L 24.2 17.474 L 24.2 21.074 L 17 21.074 L 17 13.874 Z\" style=\"\" transform=\"matrix(0, -1, 1, 0, 3.126001, 38.074)\"></path><path fill-rule=\"evenodd\" opacity=\"0.9\" id=\"path-3\" d=\"M 17 1.874 L 20.6 1.874 L 20.6 5.473 L 24.2 5.473 L 24.2 9.073 L 17 9.073 L 17 1.874 Z\" style=\"stroke-width: 0px;\" transform=\"matrix(-1, 0, 0, -1, 41.200001, 10.947)\"></path></g></g></g></g></g></g></svg></span></div></div>");
        });
        $("#live-player").on("mouseenter", "#rua_fs", function (e){
            document.getElementById("rua_tip").style.display = "block";
            document.getElementById("rua_tip").classList.add("rua_tips");
        });
        $("#live-player").on("mouseleave", "#rua_fs", function (e){
            document.getElementById("rua_tip").style.display = "none";
            document.getElementById("rua_tip").classList.remove("rua_tips");
        });
        let e = document.createEvent("MouseEvents");
        e.initEvent("click", false, false);
        $("#live-player").on("click", "#rua_fs", function (ev){
            if(document.body.classList.contains("fullscreen-fix")){
                document.getElementsByClassName("right-area")[0].getElementsByClassName("tip-wrap")[0].getElementsByTagName("span")[0].dispatchEvent(e);
            }
            if(document.body.classList.contains("player-full-win")){
                if(document.getElementById("aside-area-vm").style.display !== "none"){
                    document.getElementById("aside-area-vm").setAttribute("style","display: none;");
                    document.getElementsByClassName("player-section")[0].setAttribute("style","width: 100% !important;");
                    text = "退出网页全屏(无侧边栏)"
                    document.getElementById("rua_tip").innerText = text;
                }else{
                    document.body.classList.remove("player-full-win");
                    document.body.classList.remove("over-hidden");
                    document.getElementsByClassName("player-section")[0].removeAttribute("style");
                    document.getElementById("aside-area-vm").setAttribute("style","display: block;");
                    document.getElementsByClassName("danmaku-item-container")[0].style.width=window.innerWidth+"px";
                    document.getElementsByClassName("danmaku-item-container")[0].style.width=window.innerWidth+"px";
                    text = "网页全屏(无侧边栏)"
                    document.getElementById("rua_tip").innerText = text;
                    if(document.getElementsByClassName("right-area")[0].getElementsByClassName("tip-wrap")[1].getElementsByTagName("span")[0].getElementsByTagName("g").length===0){
                        document.getElementsByClassName("right-area")[0].getElementsByClassName("tip-wrap")[1].getElementsByTagName("span")[0].dispatchEvent(e);
                    }
                }
            }else{
                document.body.classList.add("player-full-win");
                document.body.classList.add("over-hidden");
                document.getElementsByClassName("player-section")[0].setAttribute("style","width: 100% !important;");
                document.getElementById("aside-area-vm").setAttribute("style","display: none;");
                text = "退出网页全屏(无侧边栏)"
                document.getElementById("rua_tip").innerText = text;
            }
        });
        $("#live-player").on("click", ".tip-wrap", function (e){
            if($(this).index() <= 1){
                document.getElementsByClassName("player-section")[0].removeAttribute("style");
                document.getElementById("aside-area-vm").setAttribute("style","display: block;");
                text = "网页全屏(无侧边栏)"
                document.getElementById("rua_tip").innerText = text;
            }
        });
    }
}
