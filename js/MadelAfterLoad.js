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
