!function () {
    const main = document.getElementById('main');
    let elementsOnPage = 50, liveList=[], videoList=[], dynamicList=[], uid, whisperRequest = false;
    !async function (){
        uid = await getUID();
        let followingStat = await getFollowStat(uid);
        const icon = document.getElementById('rua-icon');
        let pn = 1, followPM = Math.ceil((followingStat['following']-0)/elementsOnPage), whisperPM = Math.ceil((followingStat['whisper']-0)/elementsOnPage);
        icon.addEventListener('click', ()=>{
            document.documentElement.scrollTop=0;
        });
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
        chrome.storage.sync.get(['blackListLive', 'blackListDynamic', 'blackListVideo', 'uuid'],(r)=>{
            liveList = r['blackListLive'];
            dynamicList = r['blackListDynamic'];
            videoList = r['blackListVideo'];
            grabFollowing(1, uid,followPM, whisperRequest);
        });

        document.body.onscroll= (e)=>{
            if (document.documentElement.scrollTop > 20) {
                document.getElementById('rua-head').setAttribute('style', `top: 90px; position: fixed; padding: 20px 75px;border-bottom:none;`);
                document.getElementById('rua-head').classList.add('rua-head-border');
                document.getElementById('rua-head-space').setAttribute('style', `display:block; padding: 0; border: none;`);
            }else {
                document.getElementById('rua-head').removeAttribute('style');
                document.getElementById('rua-head').classList.remove('rua-head-border');
                document.getElementById('rua-head-space').setAttribute('style', `display:none; padding: 0; border: none;`);
            }
            if(Math.ceil(document.body.clientHeight-document.documentElement.scrollTop-window.innerHeight)===-83){
                pn++;
                if (pn<=followPM){
                    grabFollowing(pn, uid, followPM, whisperRequest);
                }
                if (pn === followPM+1 && !whisperRequest){
                    pn = 1;
                    followPM = whisperPM;
                    whisperRequest = true;
                }
            }
        }
    }();

    /**
     * Get the user's following. 50 elements per request.
     *
     * @param{number} pn the page number for request.
     * @param{number} uid the user's id.
     * @param{number} pageNumberMax the max page number.
     * @param{boolean} whisper request whisper following.
     * */
    function grabFollowing(pn, uid,pageNumberMax, whisper = false){
        return fetch(`https://api.bilibili.com/x/relation/${whisper?`whispers?`:`followings?vmid=${uid}&`}pn=${pn}&ps=${elementsOnPage}`, {
            method:"GET",
            credentials:"include",
            body:null
        })
            .then(r => r.json())
            .then(json=>{
                if(json['code']===0){
                    for (let i = 0; i < json['data']['list'].length; i++) {
                        drawUsers(json['data']['list'][i]['face'], json['data']['list'][i]['uname'], json['data']['list'][i]['mid'], json['data']['list'][i]['official_verify']['type'], json['data']['list'][i]['official_verify']['desc'])
                    }
                    if (pn===pageNumberMax){
                        if(!whisper){
                            grabFollowing(1, uid, 3, true).then(r=>{
                                if (r<=elementsOnPage) document.getElementById('loading').style.display='none';
                            });
                        }else{
                            document.getElementById('loading').style.display='none';
                        }
                    }
                    if(typeof json['data']['total'] === 'undefined')
                        return json['data']['list'].length+1;
                    else return json['data']['total'];
                }else{
                    return 0;
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

    /**
     * Get the user's id from service worker.
     *
     * @return {Promise} uid.
     * */
    function getUID(){
        return new Promise((resolve, reject)=>{
            chrome.runtime.sendMessage({ msg: "get_UUID" },function(uuid){
                resolve(uuid.res);
            });
        });
    }

    function getFollowStat(uid){
        return fetch(`https://api.bilibili.com/x/relation/stat?vmid=${uid}&jsonp=jsonp`,{
            method:"GET",
            credentials:"include",
            body:null
        }).then(r=>r.json())
            .then(json=>{
                if (json['code']===0){
                    return {'code':0,'following': json['data']['following'], 'whisper':json['data']['whisper']};
                }else{
                    return {'code':-1};
                }
            });
    }
}();