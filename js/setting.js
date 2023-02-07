!function () {
    const main = document.getElementById('up-setting');
    let elementsOnPage = 50, liveList=[], videoList=[], dynamicList=[], dkList=[], hbList = [], uid, whisperRequest = false, medals, scrollLock = true;
    !async function (){
        uid = await getUID();
        let followingStat = await getFollowStat(uid);
        medals = await getMedal(uid);
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
        chrome.storage.sync.get(['blackListLive', 'blackListDynamic', 'blackListVideo', 'blackListDK', 'blackListHB', 'uuid'],(r)=>{
            liveList = r['blackListLive'];
            dynamicList = r['blackListDynamic'];
            videoList = r['blackListVideo'];
            dkList = r['blackListDK'];
            hbList = r['blackListHB'];
            grabFollowing(1, uid,followPM, whisperRequest);
        });

        document.body.onscroll= (e)=>{
            if (document.documentElement.scrollTop > 180) {
                document.getElementById('rua-head').setAttribute('style', `top: 90px; position: fixed; padding: 20px 75px;border-bottom:none;`);
                document.getElementById('rua-head').classList.add('rua-head-border');
                document.getElementById('rua-head-space').setAttribute('style', `display:block; padding: 0; border: none;`);
            }else {
                document.getElementById('rua-head').removeAttribute('style');
                document.getElementById('rua-head').classList.remove('rua-head-border');
                document.getElementById('rua-head-space').setAttribute('style', `display:none; padding: 0; border: none;`);
            }
            if(Math.ceil(document.body.clientHeight-document.documentElement.scrollTop-window.innerHeight)<=-70){
                if (scrollLock){
                    scrollLock = false;
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
                        drawUsers(json['data']['list'][i]['face'], json['data']['list'][i]['uname'], json['data']['list'][i]['mid'], json['data']['list'][i]['official_verify']['type'], json['data']['list'][i]['official_verify']['desc'], medals.get(json['data']['list'][i]['mid']))
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
                    scrollLock = true;
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
     * @param {array} medalInfo the medal information. [medal_level, medal_colour_border, medal_colour_start, medal_colour_end, medal_label]
     * */
    function drawUsers(face, name, id, verify, verifyText, medalInfo = [0,0,0,0,0]){
        id = id-0;
        let verIcon = verify===0?'background-position: var(--personal-verify);':verify===1?'background-position: var(--organization-verify);':'display: none;';
        let block = document.createElement('div');
        block.classList.add("rua-setting-user-block");
        block.innerHTML = `<div class="rua-setting-user-info">
            <a href="https://space.bilibili.com/${id}" target="_blank" class="user-face"><img src="${face}"><span class="verified" style="${verIcon}"></span></a>
            <div class="user-name"><div style="display: flex"><a href="https://space.bilibili.com/${id}" target="_blank">${name}</a><span class="medal" ${medalInfo.indexOf(0)!==-1?`style="display:none;"`:''}><div class="medal-border" style="border-color: rgb(${convertDec2RGB(medalInfo[1])})"><div class="medal-label" style="background-image: linear-gradient(45deg, rgb(${convertDec2RGB(medalInfo[2])}), rgb(${convertDec2RGB(medalInfo[3])}));"><span class="medal-name">${medalInfo[4]}</span></div><div class="medal-level" style="color: rgb(${convertDec2RGB(medalInfo[1])})">${medalInfo[0]}</div></div></span></div><span class="verify-text">${verifyText}</span></div>
        </div>
        <div class="rua-setting-button-group">
            <div class="button-host">
                <section class="button">
                    <div class="checkbox">
                        <input id="rua-input-hb-${id}" type="checkbox" ${hbList.indexOf(id)===-1&&medalInfo.indexOf(0)===-1?'checked':''} ${medalInfo.indexOf(0)!==-1?'disabled':''}>
                        <label ${medalInfo.indexOf(0)!==-1?`class="btn-disabled"`:''}></label>
                    </div>
                </section>
            </div>
            <div class="button-host">
                <section class="button">
                    <div class="checkbox">
                        <input id="rua-input-dk-${id}" type="checkbox" ${dkList.indexOf(id)===-1&&medalInfo.indexOf(0)===-1?'checked':''} ${medalInfo.indexOf(0)!==-1?'disabled':''}>
                        <label ${medalInfo.indexOf(0)!==-1?`class="btn-disabled"`:''}></label>
                    </div>
                </section>
            </div>
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
        document.getElementById(`rua-input-hb-${id}`).addEventListener('change', function (e){
            let checked = e.target.checked, list = [];
            chrome.storage.sync.get(['blackListHB'], (r)=>{
                list = r['blackListHB'];
                if (checked)
                    list.splice(list.indexOf(id),1);
                else
                    list.push(id);
                chrome.storage.sync.set({'blackListHB':list}, ()=>{});
            });
        });
        document.getElementById(`rua-input-dk-${id}`).addEventListener('change', function (e){
            let checked = e.target.checked, list = [];
            chrome.storage.sync.get(['blackListDK'], (r)=>{
                list = r['blackListDK'];
                if (checked)
                    list.splice(list.indexOf(id),1);
                else
                    list.push(id);
                chrome.storage.sync.set({'blackListDK':list}, ()=>{});
            });
        });
        document.getElementById(`rua-input-live-${id}`).addEventListener('change', function (e){
            let checked = e.target.checked, list = [];
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
     * @param {number} dec, the colour in decimal.
     * @return {string} the colour in RGB.
     * */
    function convertDec2RGB(dec){
        return parseInt(dec.toString(16).substring(0,2), 16)+" "+ parseInt(dec.toString(16).substring(2,4), 16)+" "+parseInt(dec.toString(16).substring(4,6), 16)
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

    function getMedal(uid){
        return fetch(`https://api.live.bilibili.com/xlive/web-ucenter/user/MedalWall?target_id=${uid}`,{
            method:'GET',
            credentials:'include',
            body: null
        }).then(r=>r.json())
            .then(json=>{
                if (json['code'] === 0) {
                    let map = new Map();
                    for (let i = 0; i < json['data']['list'].length; i++) {
                        map.set(json['data']['list'][i]['medal_info']['target_id'], [json['data']['list'][i]['medal_info']['level'], json['data']['list'][i]['medal_info']['medal_color_border'], json['data']['list'][i]['medal_info']['medal_color_start'], json['data']['list'][i]['medal_info']['medal_color_end'], json['data']['list'][i]['medal_info']['medal_name']])
                    }
                    return map;
                }
                else return new Map();
            })
            .catch(e=>{
                return new Map();
            });
    }
}();