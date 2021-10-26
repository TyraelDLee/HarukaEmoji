const qn_table = {"原画":10000, "蓝光":400,"超清":250,"高清":150,"流畅":80};
var qn;
var qnv = "原画";
var room_id = window.location["pathname"].replaceAll("/", "").replace("blanc","");
var exp =new RegExp("^[0-9]*$");
chrome.storage.sync.get(["qn"], function(result){qn = result.qn});
chrome.storage.sync.get(["qnvalue"], function(result){qnv = result.qnvalue});

c();
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
            i.style.display = "none";
        },20);
    }
}
setTimeout(function (){
    if(qn && exp.test(room_id))q(qnv);
},20);


function q(qn){
    let e = document.createEvent("MouseEvents");
    e.initEvent("mousemove", false, false);
    if(document.getElementById("live-player") === null)
        setTimeout(q,200);
    else{
        let v = document.getElementById("live-player");
        v.dispatchEvent(e);
        let s = v.getElementsByClassName("web-player-controller-wrap");
        s[0].style.visibility = "hidden";
        s[1].style.visibility = "hidden";
        setTimeout(function (){
            // let e = document.createEvent("MouseEvents");
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
                    }
                },100);
            }

        },100);
        setTimeout(function (){
            s[0].style.visibility = "visible";
            s[1].style.visibility = "visible";
        },2000);
    }
}

function getAvailableQN(qn, obj){
    let index = 0;
    for (let i = 0; i < obj.length; i++) {
        if (qn_table[obj[i]]>=qn_table[qn]) index=i;
    }
    return index;
}

//
// chrome.storage.onChanged.addListener(function (changes, namespace) {
//     for (let [key, {oldValue, newValue}] of Object.entries(changes)) {
//         if(key === "dark")dark(newValue);
//     }
// });
// const labStyle = document.documentElement;
// function dark(on){
//     let atr=[];
//     if(labStyle.getAttribute("lab-style")!==undefined)atr=labStyle.getAttribute("lab-style").split(",");
//     if(on)
//         if (atr.indexOf("dark")===-1)atr.push("dark");
//     else{
//         if (atr.indexOf("dark")!==-1) atr.splice(atr.indexOf("dark"),1);
//     }
//     let a = "";
//     for (let i = 0; i < atr.length-1; i++)
//         a += atr[i]+",";
//     if(atr.length>=1)a+=atr[atr.length-1];
//     labStyle.setAttribute("lab-style",a);
// }