!function (){
    Array.prototype.popAt = function (element){
        /**
         * Pop any specific element in the array.
         * Instead of pop the last one.
         * Do nothing if the array does not contain that element.*/
        if (!this.includes(element))
            return false;
        for (let i = 0; i < this.length; i++) {
            if (element===this[i]){
                this.splice(i,1);
                return true;
            }
        }
        return false;
    }

    Array.prototype.pushUnique = function (element){
        if (!this.includes(element)){
            this.push(element);
            return true;
        }
        return false;
    }

    let isIndex = window.location["pathname"].replaceAll('/','').charAt(0)==='?'||window.location["pathname"].replaceAll('/','').length===0;
    let catList = {'cat':[]};
    let catListener = new MutationObserver((m)=>{
        m.forEach((mutation)=>{
            if (mutation.type === "childList"){
                if(mutation.addedNodes[0]!==undefined&&mutation.addedNodes[0].tagName==="DIV"&&mutation.addedNodes[0].className===""){
                    console.log("find");
                    getCats(mutation.addedNodes[0]);
                }
            }
        });
    });

    let elevatorListener = new MutationObserver((m)=>{
        m.forEach((mutation)=>{
            if (mutation.type === "childList"){
                if (document.getElementsByClassName('adblock-tips')[0]!==null && typeof document.getElementsByClassName('adblock-tips')[0] !=='undefined')
                    document.getElementsByClassName('adblock-tips')[0].setAttribute('style', 'display: none;');
                if(mutation.addedNodes[0]!==undefined&&mutation.addedNodes[0].className==="n-drawer-container"){
                    getCats(mutation.addedNodes[0].childNodes[1]);
                    catListener.observe(document.body.getElementsByClassName('n-drawer-container')[0], {childList:true});
                    elevatorListener.disconnect();
                }
            }
        });
    });

    let catMainAreaListener = new MutationObserver((m)=>{
        m.forEach((mutation)=>{
            if (mutation.type === "childList"){
                hideCat(mutation.addedNodes[0]);
            }
        });
    });

    if(isIndex){
        try{
            elevatorListener.observe(document.body,{childList:true});
            catMainAreaListener.observe(document.body.getElementsByClassName('bili-layout')[0],{childList:true});
        }catch (e){}
    }

    /**
     * Inject the hide / show icons at each category,
     * Set click event listener to each icon and add
     * categories to local storage which hidden by users.
     *
     * @param element, the parent element of category element.
     * */
    function getCats(element){
        if (window.localStorage.getItem('rua-hidden-cats')===null || window.localStorage.getItem('rua-hidden-cats')===undefined)
            catList = {'cat':[]};
        else
            catList = JSON.parse(window.localStorage.getItem('rua-hidden-cats'));
        let elevator = element.getElementsByClassName('n-drawer')[0].getElementsByClassName('n-drawer-content-wrapper')[0].getElementsByClassName('elevator')[0].getElementsByClassName('elevator-wrap')[0].getElementsByClassName('elevator-list')[0];
        for (let obj of elevator.childNodes){
            if (obj.nodeName !== '#text' && obj.getElementsByClassName('elevator-core')[0].getElementsByTagName('div').length===0) {
                obj.getElementsByClassName('elevator-core')[0].classList.add('rua-elevator-core');
                obj.getElementsByClassName('elevator-core')[0].innerHTML += `<svg class="icon rua-cross" viewBox="0 0 100 100" ><circle cx="50" cy="50" r="50" style="fill:#ff5e57;"/><rect x="25" y="45" rx="5" ry="5" width="50" height="10" style="transform: rotate(0deg);"/><rect x="25" y="45" rx="5" ry="5" width="50" height="10" style="transform: rotate(0deg);"/></svg><div class="rua-click-cover"></div>`;
                if(window.localStorage.getItem('rua-hidden-cats')!==null && window.localStorage.getItem('rua-hidden-cats')!==undefined && JSON.parse(window.localStorage.getItem('rua-hidden-cats')).cat.includes(obj.getElementsByClassName('elevator-core')[0].getElementsByTagName('span')[0].innerText)){
                    crossTransition(obj, false);
                }
                obj.getElementsByTagName('svg')[1].addEventListener('click', (e)=>{
                    crossTransition(obj, obj.getElementsByTagName('svg')[1].classList.contains('rua-cross-clicked'));
                    window.localStorage.setItem('rua-hidden-cats', JSON.stringify(catList));
                    for (let obj of document.body.getElementsByClassName('bili-layout')[0].childNodes){
                        hideCat(obj);
                    }
                    e.cancelBubble = true;
                }, false);
            }
        }
    }

    function crossTransition(element, clicked){
        element.getElementsByTagName('svg')[1].getElementsByTagName('circle')[0].style.fill = clicked?'#ff5e57':'#2bc840';
        element.getElementsByTagName('svg')[1].getElementsByTagName('rect')[0].style.transform = clicked?'rotate(0deg)':'rotate(90deg)';
        element.getElementsByTagName('svg')[1].getElementsByTagName('rect')[1].style.transform = clicked?'rotate(0deg)':'rotate(180deg)';
        element.getElementsByTagName('span')[0].style.opacity=clicked?'1':'0.3';
        if (clicked){
            element.getElementsByTagName('svg')[1].classList.remove('rua-cross-clicked');
            element.getElementsByClassName('elevator-core')[0].getElementsByClassName('rua-click-cover')[0].onclick = null;
            catList.cat.popAt(element.getElementsByClassName('elevator-core')[0].getElementsByTagName('span')[0].innerText);
        }else {
            element.getElementsByTagName('svg')[1].classList.add('rua-cross-clicked');
            element.getElementsByClassName('elevator-core')[0].getElementsByClassName('rua-click-cover')[0].onclick = (e)=>{e.cancelBubble = true};
            catList.cat.pushUnique(element.getElementsByClassName('elevator-core')[0].getElementsByTagName('span')[0].innerText);
        }

    }

    /**
     * Get the hide categories choose by users.
     * And hidden them.
     * */
    function hideCat(element){
        if(element!==undefined&&element.tagName==="SECTION"&&element.className==="bili-grid"){
            if(JSON.parse(window.localStorage.getItem('rua-hidden-cats')).cat.includes(element.getElementsByTagName('div')[0].getElementsByClassName('area-header')[0].getElementsByClassName('left')[0].getElementsByTagName('a')[0].getAttribute('id'))){
                element.setAttribute('style', `display:none`);
            }
            else {
                element.setAttribute('style', `display:grid`);
            }
        }
    }
}();