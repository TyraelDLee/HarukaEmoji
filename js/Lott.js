
setTimeout(loadList, 4*1000*60);
!function loadComponent(){
    var join = document.getElementsByClassName("particitation-btn")[0];
    var close = document.getElementsByClassName("close-btn")[0];
    if(join === undefined || close === undefined)
        setTimeout(loadComponent,200);
    else{
        join.addEventListener("click", ()=>{
            console.log("click")
            let e = document.createEvent("MouseEvents");
            e.initEvent("click", false, true);
            setTimeout(()=>{close.dispatchEvent(e);},10);
        });
    }
}();

function loadList(){
    var list = document.getElementsByClassName("lottery-result")[0];
    var close = document.getElementsByClassName("close-btn")[0];
    if(list === undefined || close === undefined){
        setTimeout(loadList,200);
    }else{
        if(list.getElementsByTagName("strong")[0]!==undefined && list.getElementsByTagName("strong")[0].innerText.includes("很遗憾")){
            let e = document.createEvent("MouseEvents");
            e.initEvent("click", false, true);
            setTimeout(()=>{close.dispatchEvent(e);},10);
        }
    }
}