/***
 * Copyright (c) 2021 Tyrael, Y. LI
 * */
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

    const noWin = new MutationObserver((m)=>{
        m.forEach((mutation)=>{
            if (mutation.type === "childList"){
                if(mutation.addedNodes[0]!==undefined&&mutation.addedNodes[0].className==="end-part"){
                    if(mutation.addedNodes[0].getElementsByTagName("strong")[0]!==undefined && mutation.addedNodes[0].getElementsByTagName("strong")[0].innerText.includes("很遗憾")){
                        let e = document.createEvent("MouseEvents");
                        e.initEvent("click", false, true);
                        setTimeout(()=>{close.dispatchEvent(e);},10);
                        noWin.disconnect();
                    }
                }
            }
        });
    });
    try{
        noWin.observe(document.getElementsByClassName('main-part')[0],{
            childList: true
        });
    }catch (e) {}
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