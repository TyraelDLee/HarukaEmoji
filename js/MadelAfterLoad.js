c();
function c(){
    let e = document.createEvent("HTMLEvents");
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