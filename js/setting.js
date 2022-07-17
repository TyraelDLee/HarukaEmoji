!function () {
    const main = document.getElementById('main');
    let pnMax = 1, liveList=[], videoList=[], dynamicList=[];
    !function (){
        const icon = document.getElementById('rua-icon');
        const nav = document.getElementById('rua-nav');
        const head = document.getElementById('rua-head');
        let pn = 1;

        icon.addEventListener("mouseenter", ()=>{
            svga(icon.getElementsByTagName('img')[0],Math.floor(Math.random()*2+1));
        });
        icon.addEventListener("mouseout", ()=>{
            svga(icon.getElementsByTagName('img')[0],0);
        });
        icon.addEventListener("touchstart", ()=>{
            svga(icon.getElementsByTagName('img')[0],Math.floor(Math.random()*2+1));
        });
        icon.addEventListener("touchend", ()=>{
            svga(icon.getElementsByTagName('img')[0],0);
        });
        chrome.storage.sync.get(['blackListLive', 'blackListDynamic', 'blackListVideo'],(r)=>{
            liveList = r['blackListLive'];
            dynamicList = r['blackListDynamic'];
            videoList = r['blackListVideo'];
            grabFollowing(1);
        });

        document.body.onscroll= (e)=>{
            if (document.documentElement.scrollTop > 20) {
                document.getElementById('rua-head').setAttribute('style', `top: ${80 + document.documentElement.scrollTop}px; position: absolute`);
                document.getElementById('rua-head-space').setAttribute('style', `display:block; padding: 0; border: none;`);
            }else {
                document.getElementById('rua-head').removeAttribute('style');
                document.getElementById('rua-head-space').setAttribute('style', `display:none; padding: 0; border: none;`);
            }
            if(Math.floor(document.body.clientHeight-document.documentElement.scrollTop-window.innerHeight)===-83 && pn<pnMax){
                pn++;
                grabFollowing(pn);
            }
        }
    }();


    function grabFollowing(pn){
        fetch(`https://api.bilibili.com/x/relation/followings?vmid=3831650&pn=${pn}&ps=50`, {
            method:"GET",
            credentials:"include",
            body:null
        }).then(r => r.json())
        .then(json=>{
            if(json['code']===0){
                for (let i = 0; i < json['data']['list'].length; i++) {
                    drawUsers(json['data']['list'][i]['face'], json['data']['list'][i]['uname'], json['data']['list'][i]['mid'], json['data']['list'][i]['official_verify']['type'], json['data']['list'][i]['official_verify']['desc'])
                }
                if (pn===1)pnMax = Math.ceil((json['data']['total']-0)/50);
                if (pn===pnMax){
                    document.getElementById('loading').style.display='none';
                }
            }else{

            }
        });
    }

    /**
     * Fulfill data to draw the page.
     *
     * @param {string} face the face icon url string for the user.
     * @param {string} name user's name.
     * @param {string|number} id user's id.
     * @param {number} verify the verify type. (organization|personal)
     * @param {string} verifyText the verify text.
     * */
    function drawUsers(face, name, id, verify, verifyText){
        id = id-0;
        let verIcon = verify===0?'background-position: var(--personal-verify);':verify===1?'background-position: var(--organization-verify);':'display: none;';
        let block = document.createElement('div');
        block.classList.add("rua-setting-user-block");
        block.innerHTML = `<div class="rua-setting-user-info">
            <a href="https://space.bilibili.com/${id}" target="_blank" class="user-face"><img src="${face}"><span class="verified" style="${verIcon}"></span></a>
            <div class="user-name"><a href="https://space.bilibili.com/${id}" target="_blank">${name}</a><span class="verify-text">${verifyText}</span></div>
        </div>
        <div class="rua-setting-button-group">
            <div class="button-host">
                <section class="button">
                    <div class="checkbox">
                        <input id="rua-input-live-${id}" type="checkbox" ${liveList.indexOf(id)===-1?'checked':''}>
                        <label></label>
                    </div>
                </section>
            </div>
            <div class="button-host">
                <section class="button">
                    <div class="checkbox">
                        <input id="rua-input-video-${id}" type="checkbox" ${videoList.indexOf(id)===-1?'checked':''}>
                        <label></label>
                    </div>
                </section>
            </div>
            <div class="button-host">
                <section class="button">
                    <div class="checkbox">
                        <input id="rua-input-dynamic-${id}" type="checkbox" ${dynamicList.indexOf(id)===-1?'checked':''}>
                        <label></label>
                    </div>
                </section>
            </div>
        </div>`;
        main.appendChild(block);
        document.getElementById(`rua-input-live-${id}`).addEventListener('change', function (e){
            let checked = e.target.checked, list = [];
            console.log(checked)
            chrome.storage.sync.get(['blackListLive'], (r)=>{
                list = r['blackListLive'];
                if (checked)
                    list.splice(list.indexOf(id),1);
                else
                    list.push(id);
                chrome.storage.sync.set({'blackListLive':list}, ()=>{});
            });
        });
        document.getElementById(`rua-input-video-${id}`).addEventListener('change', function (){
            let checked = this.checked, list = [];
            console.log(checked)
            chrome.storage.sync.get(['blackListVideo'], (r)=>{
                list = r['blackListVideo'];
                if (checked)
                    list.splice(list.indexOf(id),1);
                else
                    list.push(id);
                chrome.storage.sync.set({'blackListVideo':list}, ()=>{});
            });
        });
        document.getElementById(`rua-input-dynamic-${id}`).addEventListener('change', function (){
            let checked = this.checked, list = [];
            chrome.storage.sync.get(['blackListDynamic'], (r)=>{
                list = r['blackListDynamic'];
                if (checked)
                    list.splice(list.indexOf(id),1);
                else
                    list.push(id);
                chrome.storage.sync.set({'blackListDynamic':list}, ()=>{});
            });
        });
    }

    chrome.storage.onChanged.addListener(function (changes, namespace) {
        for (let [key, {oldValue, newValue}] of Object.entries(changes)) {
            if(key === "blackListDynamic" || key === "blackListVideo" || key === "blackListLive" ) {
                console.log(key);
                console.log(newValue);
            }
        }

    });
}();