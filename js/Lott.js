var JOIN = reloadComponent("particitation-btn");
var CLOSE = reloadComponent("close-btn");

setListener();
function reloadComponent(className){
    let obj = document.getElementsByClassName(className)[0];
    if(obj === undefined) {setTimeout(()=>{reloadComponent(className)}, 100); return undefined;}
    else return obj;
}

function setListener(){
    if(JOIN !== undefined && CLOSE !== undefined){
        JOIN.addEventListener("click", ()=>{
            let e = document.createEvent("MouseEvents");
            e.initEvent("click", false, true);
            setTimeout(()=>{CLOSE.dispatchEvent(e);},10);
        });
    }else setTimeout(()=>{setListener()}, 100);
}