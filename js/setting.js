!function () {
    const main = document.getElementById('up-setting');
    let elementsOnPage = 50, liveList = [], videoList = [], dynamicList = [], dkList = [], hbList = [], uid,
        whisperRequest = false, medals, scrollLock = true;

    !function () {
        const settingItemSwitchNotification = document.getElementById('setting-item-switch-notification');
        const settingItemSwitchImgNotice = document.getElementById('setting-item-switch-img-notice');
        const settingItemSwitchHiddenEntry = document.getElementById('setting-item-switch-hidden-entry');
        const settingItemSwitchEnhancedHiddenEntry = document.getElementById('setting-item-switch-enhanced-hidden-entry');
        const settingItemSwitchDefaultQuality = document.getElementById('setting-item-switch-default-quality');
        const settingItemSelectionQuality = document.getElementById('setting-item-selection-quality');
        const settingItemSwitchCheckIn = document.getElementById('setting-item-switch-check-in');
        const settingItemSwitchDK = document.getElementById('setting-item-switch-dk');
        const settingItemInputDKWord = document.getElementById('setting-item-input-dk-word');
        const settingItemSwitchMadel = document.getElementById('setting-item-switch-madel');
        const settingItemSwitchHeartbeat = document.getElementById('setting-item-switch-heartbeat');
        const settingItemSwitchBCoin = document.getElementById('setting-item-switch-b-coin');
        const settingItemSwitchUPEmoji = document.getElementById('setting-item-switch-up-emoji');
        const settingItemSwitchCoverClip = document.getElementById('setting-item-switch-cover-clip');
        const settingItemSwitchDarkMode = document.getElementById('setting-item-switch-dark-mode');
        const settingItemSwitchDarkModeFollowSystem = document.getElementById('setting-item-switch-dark-mode-follow-system');
        const settingItemSwitchMessageNotification = document.getElementById('setting-item-switch-message-notification');
        const settingItemSwitchDynamicNotification = document.getElementById('setting-item-switch-dynamic-notification');
        const settingItemSwitchUpdateNotification = document.getElementById('setting-item-switch-update-notification');
        const settingItemSwitchVideoNotification = document.getElementById('setting-item-switch-video-notification');
        const settingItemSwitchPCGNotification = document.getElementById('setting-item-switch-pcg-notification');
        const settingItemSwitchArticleNotification = document.getElementById('setting-item-switch-article-notification');
        const settingItemSwitchHiddenVideoBtn = document.getElementById('setting-item-switch-hidden-video-btn');
        const settingItemSwitchNotificationMaster = document.getElementById('setting-item-switch-notification-master');

        settingItemSwitchHiddenVideoBtn.addEventListener('change', ()=>{
           chrome.storage.sync.set({'hiddenOnVideoBtn': settingItemSwitchHiddenVideoBtn.checked}, ()=>{})
        });

        settingItemSwitchNotification.addEventListener('change', () => {
            chrome.storage.sync.set({'notification': settingItemSwitchNotification.checked}, () => {});
        });

        settingItemSwitchImgNotice.addEventListener('change', () => {
            chrome.storage.local.set({'imageNotice': settingItemSwitchImgNotice.checked}, () => {});
        });

        settingItemSwitchHiddenEntry.addEventListener('change', () => {
            chrome.storage.sync.set({'hiddenEntry': settingItemSwitchHiddenEntry.checked}, () => {});
        });

        settingItemSwitchEnhancedHiddenEntry.addEventListener('change', () => {
            const checked = settingItemSwitchEnhancedHiddenEntry.checked;
            buttonDisabled(checked, settingItemSwitchHiddenEntry);
            settingItemSwitchHiddenEntry.checked = checked;
            chrome.storage.sync.set({"enhancedHiddenEntry": checked, "hiddenEntry": checked}, function () {});
        });

        settingItemSwitchDefaultQuality.addEventListener('change', ()=>{
            chrome.storage.sync.set({'qn': settingItemSwitchDefaultQuality.checked}, ()=>{});
        });

        settingItemSelectionQuality.addEventListener('change', ()=>{
            chrome.storage.sync.set({'qnvalue': settingItemSelectionQuality.value}, ()=>{});
        });

        settingItemSwitchCheckIn.addEventListener('change', ()=>{
            chrome.storage.sync.set({"checkIn": settingItemSwitchCheckIn.checked}, function(){});
        });

        settingItemSwitchDK.addEventListener('change', ()=>{
            chrome.storage.sync.set({"daka": settingItemSwitchDK.checked}, function (){});
        });

        settingItemInputDKWord.addEventListener('input', ()=>{
            chrome.storage.sync.set({"dkWord": settingItemInputDKWord.value}, function (){});
        });

        settingItemSwitchMadel.addEventListener('change', ()=>{
            chrome.storage.sync.set({"medal": settingItemSwitchMadel.checked}, function(){});
        });

        settingItemSwitchHeartbeat.addEventListener('change', ()=>{
            chrome.storage.sync.set({"heartBeatSwitch": settingItemSwitchHeartbeat.checked}, function (){});
        });

        settingItemSwitchBCoin.addEventListener('change', ()=>{
            chrome.storage.sync.set({"bcoin": settingItemSwitchBCoin.checked}, function (){});
        });

        settingItemSwitchUPEmoji.addEventListener('change', ()=>{
            chrome.storage.sync.set({"commentEmoji":settingItemSwitchUPEmoji.checked}, function (){});
        });

        settingItemSwitchCoverClip.addEventListener('change', ()=>{
            chrome.storage.sync.set({"squareCover": settingItemSwitchCoverClip.checked}, function (){});
        });

        settingItemSwitchDarkMode.addEventListener('change', ()=>{
            const checked = settingItemSwitchDarkMode.checked;
            if (checked){
                settingItemSwitchDarkModeFollowSystem.checked = false;
                chrome.storage.sync.set({"darkModeSystem": false}, function (){});
            }
            chrome.storage.sync.set({"darkMode": checked}, function (){});
        });

        settingItemSwitchDarkModeFollowSystem.addEventListener('change', ()=>{
            const checked = settingItemSwitchDarkModeFollowSystem.checked;
            if (this.checked){
                settingItemSwitchDarkMode.checked = false;
                chrome.storage.sync.set({"darkMode": false}, function (){});
            }
            chrome.storage.sync.set({"darkModeSystem": checked}, function (){});
        });

        settingItemSwitchMessageNotification.addEventListener('change', ()=>{
            chrome.storage.sync.set({"unreadSwitch":settingItemSwitchMessageNotification.checked}, function (){});
        });

        settingItemSwitchDynamicNotification.addEventListener('change', ()=>{
            chrome.storage.sync.set({"dynamicSwitch":settingItemSwitchDynamicNotification.checked}, function (){});
        });

        settingItemSwitchUpdateNotification.addEventListener('change', ()=>{
            const checked = settingItemSwitchUpdateNotification.checked;
            buttonDisabled(checked, settingItemSwitchVideoNotification);
            buttonDisabled(checked, settingItemSwitchPCGNotification);
            buttonDisabled(checked, settingItemSwitchArticleNotification);
            if (checked){
                if (!settingItemSwitchArticleNotification.checked && !settingItemSwitchPCGNotification.checked && !settingItemSwitchVideoNotification.checked){
                    settingItemSwitchVideoNotification.checked = true;
                    settingItemSwitchPCGNotification.checked = true;
                    settingItemSwitchArticleNotification.checked = true;
                    chrome.storage.sync.set({"videoPush":true}, function (){});
                    chrome.storage.sync.set({"pgcPush":true}, function (){});
                    chrome.storage.sync.set({"articlePush":true}, function (){});
                }
            }
            chrome.storage.sync.set({"dynamicPush": checked}, function (){});
        });

        settingItemSwitchNotificationMaster.addEventListener('change', ()=>{
            chrome.storage.sync.set({"notificationMaster":settingItemSwitchNotificationMaster.checked}, function (){});
        });

        function turnOffDynamic(){
            if (!settingItemSwitchArticleNotification.checked && !settingItemSwitchPCGNotification.checked && !settingItemSwitchVideoNotification.checked) {
                settingItemSwitchUpdateNotification.checked = false;
                buttonDisabled(false, settingItemSwitchVideoNotification);
                buttonDisabled(false, settingItemSwitchPCGNotification);
                buttonDisabled(false, settingItemSwitchArticleNotification);
                chrome.storage.sync.set({"dynamicPush": false}, function (){});
            }
        }

        settingItemSwitchVideoNotification.addEventListener('change', ()=>{
            turnOffDynamic();
            chrome.storage.sync.set({"videoPush":settingItemSwitchVideoNotification.checked}, function (){});
        });

        settingItemSwitchPCGNotification.addEventListener('change', ()=>{
            turnOffDynamic();
            chrome.storage.sync.set({"videoPush":settingItemSwitchPCGNotification.checked}, function (){});
        });

        settingItemSwitchArticleNotification.addEventListener('change', ()=>{
            turnOffDynamic();
            chrome.storage.sync.set({"videoPush":settingItemSwitchArticleNotification.checked}, function (){});
        });

        initialState();

        function initialState() {
            chrome.runtime.sendMessage({msg: 'requestOSInfo'}, function (result) {
                if (result.os !== 'win')
                    buttonDisabled(false, settingItemSwitchImgNotice);
            });

            chrome.storage.sync.get(["notification", "medal", "checkIn", "bcoin", "dynamicPush", "unreadSwitch", "hiddenEntry", "daka", "qn", "qnvalue", "enhancedHiddenEntry", "record", "prerecord", "dynamicSwitch", "darkMode", "darkModeSystem", "commentEmoji", "videoPush", "pgcPush", "articlePush", "heartBeatSwitch", "squareCover", "dkWord", 'hiddenOnVideoBtn', 'notificationMaster'], (info) => {
                settingItemSwitchNotification.checked = info['notification'];
                settingItemSwitchHiddenEntry.checked = info['hiddenEntry'];
                settingItemSwitchEnhancedHiddenEntry.checked = info['enhancedHiddenEntry'];
                if (info['enhancedHiddenEntry']) {
                    settingItemSwitchHiddenEntry.setAttribute('disable', '');
                    settingItemSwitchHiddenEntry.checked = info['enhancedHiddenEntry'];
                    settingItemSwitchHiddenEntry.parentElement.getElementsByTagName("label")[0].classList.add("btn-disabled");
                } else {
                    settingItemSwitchHiddenEntry.removeAttribute('disable');
                    settingItemSwitchHiddenEntry.parentElement.getElementsByTagName("label")[0].classList.remove("btn-disabled");
                }

                settingItemSwitchDefaultQuality.checked = info['qn'];
                settingItemSelectionQuality.value = info['qnvalue'];
                settingItemSwitchCheckIn.checked = info['checkIn'];
                settingItemSwitchDK.checked = info['daka'];
                if (info['dkWord'] !== '') settingItemInputDKWord.value = info['dkWord'];
                settingItemSwitchMadel.checked = info['medal'];
                settingItemSwitchHeartbeat.checked = info['heartBeatSwitch'];

                settingItemSwitchBCoin.checked = info['bcoin'];
                settingItemSwitchUPEmoji.checked = info['commentEmoji'];
                settingItemSwitchCoverClip.checked = info['squareCover'];

                settingItemSwitchDarkMode.checked = info['darkMode'];
                settingItemSwitchDarkModeFollowSystem.checked = info['darkModeSystem'];

                settingItemSwitchNotificationMaster.checked = info['notificationMaster'];
                settingItemSwitchMessageNotification.checked = info['unreadSwitch'];
                settingItemSwitchDynamicNotification.checked = info['dynamicSwitch'];
                settingItemSwitchUpdateNotification.checked = info['dynamicPush'];
                settingItemSwitchVideoNotification.checked = info['videoPush'];
                settingItemSwitchPCGNotification.checked = info['pgcPush'];
                settingItemSwitchArticleNotification.checked = info['articlePush'];
                buttonDisabled(info['dynamicPush'], settingItemSwitchVideoNotification);
                buttonDisabled(info['dynamicPush'], settingItemSwitchPCGNotification);
                buttonDisabled(info['dynamicPush'], settingItemSwitchArticleNotification);


                settingItemSwitchHiddenVideoBtn.checked = info['hiddenOnVideoBtn'];
            });

            chrome.storage.local.get(["imageNotice"], (result) => {
                settingItemSwitchImgNotice.checked = result.imageNotice;
            });
        }

        function buttonDisabled(checked, obj) {
            if (checked) {
                obj.removeAttribute("disabled");
                obj.parentElement.getElementsByTagName("label")[0].classList.remove("btn-disabled");
            } else {
                obj.setAttribute("disabled", "true");
                obj.parentElement.getElementsByTagName("label")[0].classList.add("btn-disabled");
            }
        }
    }();

    !async function () {
        uid = await getUID();
        let followingStat = await getFollowStat(uid);
        medals = await getMedal(uid);
        const icon = document.getElementById('rua-icon');
        let pn = 1, followPM = Math.ceil((followingStat['following'] - 0) / elementsOnPage),
            whisperPM = Math.ceil((followingStat['whisper'] - 0) / elementsOnPage);

        const settingSearchUser = document.getElementById('setting-search-user');
        let userInputDelay = null, search = false, searchName = '', searchPM = 1;
        let maxPage = search?searchPM:followPM;
        const mainTitle1 = main.firstElementChild, mainTitle2 = mainTitle1.nextElementSibling;
        settingSearchUser.addEventListener('input', ()=>{
            clearTimeout(userInputDelay);
            userInputDelay = setTimeout(async ()=>{
                search = settingSearchUser.value !== '';
                searchName = settingSearchUser.value;
                main.innerHTML = '';
                main.appendChild(mainTitle1);
                main.appendChild(mainTitle2);
                pn=1;

                if (settingSearchUser.value === '') {
                    await grabFollowing(1, uid, followPM, false); // empty search input return the first page of following
                    maxPage = followPM;
                }
                else{
                    searchPM = await grabFollowing(1, uid, 1, whisperRequest, search, searchName);
                    searchPM = Math.ceil(searchPM / elementsOnPage);
                    maxPage = searchPM;
                }
            }, 300);
        });

        icon.addEventListener('click', () => {
            document.documentElement.scrollTop = 0;
        });
        icon.addEventListener("mouseenter", () => {
            svga(icon.getElementsByTagName('img')[0], Math.floor(Math.random() * 2 + 1));
        });
        icon.addEventListener("mouseout", () => {
            svga(icon.getElementsByTagName('img')[0], 0);
        });
        icon.addEventListener("touchstart", () => {
            svga(icon.getElementsByTagName('img')[0], Math.floor(Math.random() * 2 + 1));
        });
        icon.addEventListener("touchend", () => {
            svga(icon.getElementsByTagName('img')[0], 0);
        });
        chrome.storage.sync.get(['blackListLive', 'blackListDynamic', 'blackListVideo', 'blackListDK', 'blackListHB', 'uuid'], (r) => {
            liveList = r['blackListLive'];
            dynamicList = r['blackListDynamic'];
            videoList = r['blackListVideo'];
            dkList = r['blackListDK'];
            hbList = r['blackListHB'];
            grabFollowing(1, uid, followPM, whisperRequest); // get the first page of following
        });

        let delta = document.documentElement.scrollTop;

        document.body.onscroll = (e) => {
            if (document.documentElement.scrollTop > 2110) {
                document.getElementById('rua-head').setAttribute('style', `top: 90px; position: fixed; padding: 20px 75px;border-bottom:none;`);
                document.getElementById('rua-head').classList.add('rua-head-border');
                document.getElementById('rua-head-space').setAttribute('style', `display:block; padding: 0; border: none;`);
            } else {
                document.getElementById('rua-head').removeAttribute('style');
                document.getElementById('rua-head').classList.remove('rua-head-border');
                document.getElementById('rua-head-space').setAttribute('style', `display:none; padding: 0; border: none;`);
            }
            if (Math.ceil(document.body.clientHeight - document.documentElement.scrollTop - window.innerHeight) <= -70) {
                delta = document.documentElement.scrollTop - delta;
                if (scrollLock && delta > 0) {
                    scrollLock = false;
                    pn++;
                    if (pn <= maxPage) {
                        grabFollowing(pn, uid, maxPage, whisperRequest, search, searchName);
                    }
                    if (pn === followPM + 1 && !whisperRequest && !search) {
                        pn = 1;
                        maxPage = whisperPM;
                        whisperRequest = true;
                    }
                }
                delta = document.documentElement.scrollTop;
            }
        } // reconstruct here!
    }();

    /**
     * Get the user's following. 50 elements per request.
     *
     * @param{number} pn the page number for request.
     * @param{number} uid the user's id.
     * @param{number} pageNumberMax the max page number.
     * @param{boolean} whisper request whisper following.
     * @param{boolean} search search mode
     * @param{string} searchName request serach username
     * */
    function grabFollowing(pn, uid, pageNumberMax, whisper = false, search = false, searchName = '') {
        console.log(search)
        return fetch(search?
            `https://api.bilibili.com/x/relation/followings/search?vmid=${uid}&pn=${pn}&ps=${elementsOnPage}&order=desc&order_type=attention&name=${searchName}`:
            `https://api.bilibili.com/x/relation/${whisper ? `whispers?` : `followings?vmid=${uid}&`}pn=${pn}&ps=${elementsOnPage}`, {
            method: "GET",
            credentials: "include",
            body: null
        })
            .then(r => r.json())
            .then(json => {
                if (json['code'] === 0) {
                    for (let i = 0; i < json['data']['list'].length; i++) {
                        drawUsers(json['data']['list'][i]['face'], json['data']['list'][i]['uname'], json['data']['list'][i]['mid'], json['data']['list'][i]['official_verify']['type'], json['data']['list'][i]['official_verify']['desc'], medals.get(json['data']['list'][i]['mid']))
                    }
                    if (pn === pageNumberMax) {
                        if (!whisper) {
                            grabFollowing(1, uid, 3, true).then(r => {
                                if (r <= elementsOnPage) document.getElementById('loading').style.display = 'none';
                            });
                        } else {
                            document.getElementById('loading').style.display = 'none';
                        }
                    }
                    scrollLock = true;
                    if (typeof json['data']['total'] === 'undefined')
                        return json['data']['list'].length + 1;
                    else return json['data']['total'];
                } else {
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
    function drawUsers(face, name, id, verify, verifyText, medalInfo = [0, 0, 0, 0, 0]) {
        id = id - 0;
        let verIcon = verify === 0 ? 'background-position: var(--personal-verify);' : verify === 1 ? 'background-position: var(--organization-verify);' : 'display: none;';
        let block = document.createElement('div');
        block.classList.add("rua-setting-user-block");
        block.innerHTML = `<div class="rua-setting-user-info">
            <a href="https://space.bilibili.com/${id}" target="_blank" class="user-face"><img src="${face}"><span class="verified" style="${verIcon}"></span></a>
            <div class="user-name"><div style="display: flex"><a href="https://space.bilibili.com/${id}" target="_blank">${name}</a><span class="medal" ${medalInfo.indexOf(0) !== -1 ? `style="display:none;"` : ''}><div class="medal-border" style="border-color: rgb(${convertDec2RGB(medalInfo[1])})"><div class="medal-label" style="background-image: linear-gradient(45deg, rgb(${convertDec2RGB(medalInfo[2])}), rgb(${convertDec2RGB(medalInfo[3])}));"><span class="medal-name">${medalInfo[4]}</span></div><div class="medal-level" style="color: rgb(${convertDec2RGB(medalInfo[1])})">${medalInfo[0]}</div></div></span></div><span class="verify-text">${verifyText}</span></div>
        </div>
        <div class="rua-setting-button-group">
            <div class="button-host">
                <section class="button">
                    <div class="checkbox">
                        <input id="rua-input-hb-${id}" type="checkbox" ${hbList.indexOf(id) === -1 && medalInfo.indexOf(0) === -1 ? 'checked' : ''} ${medalInfo.indexOf(0) !== -1 ? 'disabled' : ''}>
                        <label ${medalInfo.indexOf(0) !== -1 ? `class="btn-disabled"` : ''}></label>
                    </div>
                </section>
            </div>
            <div class="button-host">
                <section class="button">
                    <div class="checkbox">
                        <input id="rua-input-dk-${id}" type="checkbox" ${dkList.indexOf(id) === -1 && medalInfo.indexOf(0) === -1 ? 'checked' : ''} ${medalInfo.indexOf(0) !== -1 ? 'disabled' : ''}>
                        <label ${medalInfo.indexOf(0) !== -1 ? `class="btn-disabled"` : ''}></label>
                    </div>
                </section>
            </div>
            <div class="button-host">
                <section class="button">
                    <div class="checkbox">
                        <input id="rua-input-live-${id}" type="checkbox" ${liveList.indexOf(id) === -1 ? 'checked' : ''}>
                        <label></label>
                    </div>
                </section>
            </div>
            <div class="button-host">
                <section class="button">
                    <div class="checkbox">
                        <input id="rua-input-video-${id}" type="checkbox" ${videoList.indexOf(id) === -1 ? 'checked' : ''}>
                        <label></label>
                    </div>
                </section>
            </div>
            <div class="button-host">
                <section class="button">
                    <div class="checkbox">
                        <input id="rua-input-dynamic-${id}" type="checkbox" ${dynamicList.indexOf(id) === -1 ? 'checked' : ''}>
                        <label></label>
                    </div>
                </section>
            </div>
        </div>`;
        main.appendChild(block);
        document.getElementById(`rua-input-hb-${id}`).addEventListener('change', function (e) {
            let checked = e.target.checked, list = [];
            chrome.storage.sync.get(['blackListHB'], (r) => {
                list = r['blackListHB'];
                if (checked)
                    list.splice(list.indexOf(id), 1);
                else
                    list.push(id);
                chrome.storage.sync.set({'blackListHB': list}, () => {
                });
            });
        });
        document.getElementById(`rua-input-dk-${id}`).addEventListener('change', function (e) {
            let checked = e.target.checked, list = [];
            chrome.storage.sync.get(['blackListDK'], (r) => {
                list = r['blackListDK'];
                if (checked)
                    list.splice(list.indexOf(id), 1);
                else
                    list.push(id);
                chrome.storage.sync.set({'blackListDK': list}, () => {
                });
            });
        });
        document.getElementById(`rua-input-live-${id}`).addEventListener('change', function (e) {
            let checked = e.target.checked, list = [];
            chrome.storage.sync.get(['blackListLive'], (r) => {
                list = r['blackListLive'];
                if (checked)
                    list.splice(list.indexOf(id), 1);
                else
                    list.push(id);
                chrome.storage.sync.set({'blackListLive': list}, () => {
                });
            });
        });
        document.getElementById(`rua-input-video-${id}`).addEventListener('change', function () {
            let checked = this.checked, list = [];
            chrome.storage.sync.get(['blackListVideo'], (r) => {
                list = r['blackListVideo'];
                if (checked)
                    list.splice(list.indexOf(id), 1);
                else
                    list.push(id);
                chrome.storage.sync.set({'blackListVideo': list}, () => {
                });
            });
        });
        document.getElementById(`rua-input-dynamic-${id}`).addEventListener('change', function () {
            let checked = this.checked, list = [];
            chrome.storage.sync.get(['blackListDynamic'], (r) => {
                list = r['blackListDynamic'];
                if (checked)
                    list.splice(list.indexOf(id), 1);
                else
                    list.push(id);
                chrome.storage.sync.set({'blackListDynamic': list}, () => {
                });
            });
        });
    }

    /**
     * @param {number} dec, the colour in decimal.
     * @return {string} the colour in RGB.
     * */
    function convertDec2RGB(dec) {
        return parseInt(dec.toString(16).substring(0, 2), 16) + " " + parseInt(dec.toString(16).substring(2, 4), 16) + " " + parseInt(dec.toString(16).substring(4, 6), 16)
    }

    /**
     * Get the user's id from service worker.
     *
     * @return {Promise} uid.
     * */
    function getUID() {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({msg: "get_UUID"}, function (uuid) {
                resolve(uuid.res);
            });
        });
    }

    function getFollowStat(uid) {
        return fetch(`https://api.bilibili.com/x/relation/stat?vmid=${uid}&jsonp=jsonp`, {
            method: "GET",
            credentials: "include",
            body: null
        }).then(r => r.json())
            .then(json => {
                if (json['code'] === 0) {
                    return {'code': 0, 'following': json['data']['following'], 'whisper': json['data']['whisper']};
                } else {
                    return {'code': -1};
                }
            });
    }

    function getMedal(uid) {
        return fetch(`https://api.live.bilibili.com/xlive/web-ucenter/user/MedalWall?target_id=${uid}`, {
            method: 'GET',
            credentials: 'include',
            body: null
        }).then(r => r.json())
            .then(json => {
                if (json['code'] === 0) {
                    let map = new Map();
                    for (let i = 0; i < json['data']['list'].length; i++) {
                        map.set(json['data']['list'][i]['medal_info']['target_id'], [json['data']['list'][i]['medal_info']['level'], json['data']['list'][i]['medal_info']['medal_color_border'], json['data']['list'][i]['medal_info']['medal_color_start'], json['data']['list'][i]['medal_info']['medal_color_end'], json['data']['list'][i]['medal_info']['medal_name']])
                    }
                    return map;
                } else return new Map();
            })
            .catch(e => {
                return new Map();
            });
    }
}();

//todo: search following. API:  https://api.bilibili.com/x/relation/followings/search?vmid=${UID}&pn=1&ps=50&order=desc&order_type=attention&name=${key word}
//todo: notification master button.
//todo: revoke previous elements for lazy loading