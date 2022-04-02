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
                if(mutation.addedNodes[0]!==undefined&&mutation.addedNodes[0].className==="n-drawer-container"){
                    getCats(mutation.addedNodes[0].childNodes[1]);
                    catListener.observe(document.body.getElementsByClassName('n-drawer-container')[0], {childList:true});
                    elevatorListener.disconnect();
                }
            }
        });
    });
    elevatorListener.observe(document.body,{childList:true});

    function getCats(element){
        if (window.localStorage.getItem('rua-hidden-cats')===null || window.localStorage.getItem('rua-hidden-cats')===undefined)
            catList = {'cat':[]};
        else
            catList = JSON.parse(window.localStorage.getItem('rua-hidden-cats'));
        let elevator = element.getElementsByClassName('n-drawer')[0].getElementsByClassName('n-drawer-content-wrapper')[0].getElementsByClassName('elevator')[0].getElementsByClassName('elevator-wrap')[0].getElementsByClassName('elevator-list')[0];
        for (let obj of elevator.childNodes){
            if (obj.nodeName !== '#text') {
                obj.getElementsByClassName('elevator-core')[0].classList.add('rua-elevator-core');
                obj.getElementsByClassName('elevator-core')[0].innerHTML += `<svg class="icon rua-cross" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" style="fill:#ff5e57;"/><rect x="25" y="45" rx="5" ry="5" width="50" height="10" style="fill:#fff;opacity:0.9;transform-origin: center;"/><rect x="25" y="45" rx="5" ry="5" width="50" height="10" style="fill:#fff;opacity:0.9;transform-origin: center;"/></svg><div class="rua-click-cover"></div>`;
                if(window.localStorage.getItem('rua-hidden-cats')!==null && window.localStorage.getItem('rua-hidden-cats')!==undefined && JSON.parse(window.localStorage.getItem('rua-hidden-cats')).cat.includes(obj.getElementsByClassName('elevator-core')[0].getElementsByTagName('span')[0].innerText)){
                    obj.getElementsByTagName('svg')[1].classList.add('rua-cross-clicked');
                    obj.getElementsByTagName('svg')[1].getElementsByTagName('circle')[0].style.fill = '#2bc840';
                    obj.getElementsByTagName('svg')[1].getElementsByTagName('rect')[0].style.transform = 'rotate(90deg)';
                    obj.getElementsByTagName('svg')[1].getElementsByTagName('rect')[1].style.transform = 'rotate(180deg)';
                    obj.getElementsByTagName('span')[0].style.opacity='0.3';
                    obj.getElementsByClassName('elevator-core')[0].getElementsByClassName('rua-click-cover')[0].onclick = (e)=>{e.cancelBubble = true};
                }
                obj.getElementsByTagName('svg')[1].addEventListener('click', (e)=>{
                    if (obj.getElementsByTagName('svg')[1].classList.contains('rua-cross-clicked')){
                        obj.getElementsByTagName('svg')[1].classList.remove('rua-cross-clicked');
                        obj.getElementsByTagName('svg')[1].getElementsByTagName('circle')[0].style.fill = '#ff5e57';
                        obj.getElementsByTagName('svg')[1].getElementsByTagName('rect')[0].style.transform = 'rotate(0deg)';
                        obj.getElementsByTagName('svg')[1].getElementsByTagName('rect')[1].style.transform = 'rotate(0deg)';
                        obj.getElementsByTagName('span')[0].style.opacity='1';
                        catList.cat.popAt(obj.getElementsByClassName('elevator-core')[0].getElementsByTagName('span')[0].innerText);
                        obj.getElementsByClassName('elevator-core')[0].getElementsByClassName('rua-click-cover')[0].onclick = null;
                    }
                    else{
                        obj.getElementsByTagName('svg')[1].classList.add('rua-cross-clicked');
                        obj.getElementsByTagName('svg')[1].getElementsByTagName('circle')[0].style.fill = '#2bc840';
                        obj.getElementsByTagName('svg')[1].getElementsByTagName('rect')[0].style.transform = 'rotate(90deg)';
                        obj.getElementsByTagName('svg')[1].getElementsByTagName('rect')[1].style.transform = 'rotate(180deg)';
                        obj.getElementsByTagName('span')[0].style.opacity='0.3';
                        catList.cat.pushUnique(obj.getElementsByClassName('elevator-core')[0].getElementsByTagName('span')[0].innerText);
                        obj.getElementsByClassName('elevator-core')[0].getElementsByClassName('rua-click-cover')[0].onclick = (e)=>{e.cancelBubble = true};
                    }
                    window.localStorage.setItem('rua-hidden-cats', JSON.stringify(catList));
                    for (let obj of document.body.getElementsByClassName('bili-layout')[0].childNodes){
                        hideCat(obj);
                    }
                    e.cancelBubble = true;
                }, false);
            }
        }
    }

    let catMainAreaListener = new MutationObserver((m)=>{
        m.forEach((mutation)=>{
            if (mutation.type === "childList"){
                hideCat(mutation.addedNodes[0]);
            }
        });
    });
    catMainAreaListener.observe(document.body.getElementsByClassName('bili-layout')[0],{childList:true});

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