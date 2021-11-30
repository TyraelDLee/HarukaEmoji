/***
 * Copyright (c) 2021 Tyrael, Y. LI
 * */
const qn_table = {"原画":10000, "蓝光":400,"超清":250,"高清":150,"流畅":80};
var qn;
var qnv = "原画";
var medalSwitch;
var room_id = window.location["pathname"].replaceAll("/", "").replace("blanc","");
var exp =new RegExp("^[0-9]*$");
chrome.storage.sync.get(["qn"], function(result){qn = result.qn});
chrome.storage.sync.get(["qnvalue"], function(result){qnv = result.qnvalue});
chrome.storage.sync.get(["medal"], (result)=>{medalSwitch = result.medal});

if(document.getElementsByTagName("article").length === 0) {
    setTimeout(function (){
        if(medalSwitch) c();
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
