!function () {
    const div = document.createElement('div'), emojiTitle = document.createElement('div'), emojiContent = document.createElement('div'), emojiTab = document.createElement('div'),emojiSlider = document.createElement('div'),emojiLeftArrow = document.createElement('i'),emojiRightArrow = document.createElement('i');
    const pageUrl = window.location['host'];
    let pageID = window.location["pathname"].replaceAll("/", "").replace("video", "").replace('bangumi', '').replace('play', '');
    let exp =new RegExp("https://space.bilibili.com/\\d*/dynamic");
    let textArea = null;
    function boundDynamicModule(emojisType, emojis){
        document.getElementById('app').addEventListener('click', ()=>{
            if (document.activeElement.tagName==='TEXTAREA'){
                textArea = document.activeElement;
            }
        });
        try{
            textArea = document.getElementsByClassName('comment-send')[0].getElementsByTagName('textarea')[0];
            document.getElementsByClassName('emoji-box')[0].innerHTML = '';
            document.getElementsByClassName('emoji-box')[0].appendChild(drawUI(emojisType, emojis, [0, 0]));
        }catch (e){
            setTimeout(()=>{boundDynamicModule(emojisType, emojis)}, 1000);
        }
    }

    function boundButtons(className){
        try{
            document.getElementsByClassName(className)[0].addEventListener('click', ()=>{
                textArea = document.getElementsByClassName(className)[0].parentElement.getElementsByClassName('textarea-container')[0].getElementsByTagName('textarea')[0];
            });
        }catch (e) {}
    }

    !async function () {
        if (pageUrl === 't.bilibili.com' || pageID.toUpperCase().includes('BV') || pageID.toUpperCase().includes('AV') || exp.test(window.location.href)) {
            let mid = await getOwnerID();
            let emojis = await getOwnerEmote(mid);
            let emojisType = await getUserEmote(mid);
            if(pageUrl==='t.bilibili.com' || exp.test(window.location.href)) {
                boundDynamicModule(emojisType, emojis);
                boundButtons('comment-emoji-lite');
                boundButtons('comment-emoji');
            }else{
                new MutationObserver(async ()=>{
                    const nvid = window.location["pathname"].replaceAll("/", "").replace("video","").replace('bangumi','').replace('play','');
                    if(nvid!==null && nvid!==pageID){
                        pageID = nvid;
                        mid = await getOwnerID();
                        emojis = await getOwnerEmote(mid);
                        emojisType = await getUserEmote(mid);
                    }
                }).observe(document, {subtree: true, childList: true});
                new MutationObserver((m) => {
                    m.forEach(function (mutation) {
                        if (mutation.type === "childList" && mutation.target.classList.contains("box-active") && mutation.addedNodes.length > 0) {
                            textArea = mutation.target.childNodes[0].childNodes[1].childNodes[0];
                            let block = mutation.addedNodes[0].childNodes[0].childNodes[0];
                            block.addEventListener('click', () => {
                                if (mutation.target.classList.contains("fixed-box"))
                                    mutation.addedNodes[0].childNodes[0].appendChild(drawUI(emojisType, emojis, [-393, 0]));
                                else
                                    mutation.addedNodes[0].childNodes[0].appendChild(drawUI(emojisType, emojis, [30, 0]));
                            });

                        }
                    });
                }).observe(document, {subtree: true, childList: true, attributes: true});
            }
        }
    }();

    /**
     * Determine the type of input vid.
     *
     * @param {string} str video tag.
     * @return {string} the query string for url.
     * */
    function abv(str) {
        let headB = "AaBb";
        let headE = "Vv";
        if (headB.includes(str.charAt(0)) && headE.includes(str.charAt(1))) {
            return headB.substr(0, 2).includes(str.charAt(0)) ? "aid=" + str.replace("av", "") : "bvid=" + str;
        }
    }

    function getOwnerID() {
        if (pageUrl === 't.bilibili.com') {
            return fetch(`https://api.bilibili.com/x/polymer/web-dynamic/v1/detail?id=${pageID}`, {
                method: "GET",
                credentials: "include",
                body: null
            }).then(r => r.json())
                .then(json => {
                    if (json['code'] === 0) {
                        return json['data']['item']['modules']['module_author']['mid']
                    } else
                        return -1;
                })
                .catch(e => {
                    return -1;
                });
        } else if(exp.test(window.location.href)){
            return window.location.pathname.replaceAll('dynamic','').replaceAll('/','')-0;
        }else {
            return fetch(`https://api.bilibili.com/x/web-interface/view?${abv(pageID)}`, {
                method: "GET",
                credentials: "include",
                body: null
            }).then(r => r.json())
                .then(json => {
                    if (json['code'] === 0) {
                        return json['data']['owner']['mid'];
                    } else
                        return -1;
                })
                .catch(e => {
                    return -1;
                });
        }
    }

    function getOwnerEmote(mid) {
        return fetch(`https://api.bilibili.com/x/emote/live/user/list/v2?appkey=1d8b6e7d45233436&build=6720300&business=reply&mobi_app=android&platform=android&up_mid=${mid}`, {
            method: "GET",
            credentials: "include",
            body: null
        }).then(r => r.json())
            .then(json => {
                if (json['code'] === 0) {
                    return json['data']['list'][0];
                } else {
                    return null;
                }
            }).catch(e => {
                return null;
            });
    }

    function getUserEmote(mid) {
        return fetch(`https://api.bilibili.com/x/emote/user/panel?aid=0&appkey=1d8b6e7d45233436&build=6720300&business=reply&mobi_app=android&up_mid=${mid}`, {
            method: "GET",
            credentials: "include",
            bodu: null
        }).then(r => r.json())
            .then(json => {
                if (json['code'] === 0) {
                    return json['data'];
                } else {
                    return null;
                }
            }).catch(e => {
                return null;
            });
    }

    function drawUI(emojiCat, emoji, pos, bottom = false) {
        let i = 1;
        div.innerHTML="";
        emojiTab.innerHTML="";
        emojiTitle.innerHTML = "";
        emojiSlider.innerHTML = "";
        emojiContent.innerHTML = "";
        div.setAttribute('style', `--rua-panel-top: ${pos[0]}px; --rua-panel-left: ${pos[1]}px`);
        div.classList.add("rua-emoji-panel");
        if (bottom)
            div.classList.add("rua-emoji-panel-bottom");
        div.setAttribute('id', bottom?'rua-emoji-panel-bottom':'rua-emoji-panel');
        div.setAttribute('tabindex', '1');
        emojiTitle.classList.add('rua-emoji-title');
        emojiContent.classList.add('rua-emoji-content');
        emojiTab.classList.add('rua-emoji-tab');
        emojiSlider.classList.add('rua-emoji-slider');
        emojiLeftArrow.setAttribute('style', '--2c6ec6e4:#c9ccd0; --72eca176:16px;');
        emojiLeftArrow.classList.add('svg-icon','left-arrow','use-color','slider-pre', 'rua-arrow');
        emojiLeftArrow.innerHTML = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M7.67413 1.57564C7.90844 1.80995 7.90844 2.18985 7.67413 2.42417L4.09839 5.9999L7.67413 9.57564C7.90844 9.80995 7.90844 10.1899 7.67413 10.4242C7.43981 10.6585 7.05992 10.6585 6.8256 10.4242L3.00238 6.60094C2.67043 6.269 2.67043 5.73081 3.00238 5.39886L6.8256 1.57564C7.05992 1.34132 7.43981 1.34132 7.67413 1.57564Z" fill="#A2A7AE"></path></svg>`;
        (emojiCat['packages'].length>5)?emojiRightArrow.setAttribute('style', '--2c6ec6e4:#61666d; --72eca176:16px;'):emojiRightArrow.setAttribute('style', '--2c6ec6e4:#c9ccd0; --72eca176:16px;');
        emojiRightArrow.classList.add('svg-icon','right-arrow','use-color','slider-pre', 'rua-arrow');
        emojiRightArrow.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M5.82576 2.07564C5.59145 2.30995 5.59145 2.68985 5.82576 2.92417L10.9015 7.9999L5.82576 13.0756C5.59145 13.31 5.59145 13.6899 5.82576 13.9242C6.06008 14.1585 6.43997 14.1585 6.67429 13.9242L11.9386 8.65987C12.3031 8.29538 12.3031 7.70443 11.9386 7.33994L6.67429 2.07564C6.43997 1.84132 6.06008 1.84132 5.82576 2.07564Z" fill="#E19C2C"></path></svg>`;

        emojiSlider.appendChild(emojiLeftArrow);
        emojiSlider.appendChild(emojiRightArrow);
        for (;i < 6; i++) {
            if(emojiCat['packages'][i]['type']===9){
                emojiTab.appendChild(drawSlider(emojiCat['packages'][i]['url'], i, emoji['panel_desc'], emoji['emote']));
            }else
                emojiTab.appendChild(drawSlider(emojiCat['packages'][i]['url'], i, emojiCat['packages'][i]['text'], emojiCat['packages'][i]['emote']));
        }
        for (let j = 0; j < emojiCat['packages'][1]['emote'].length; j++) {
            emojiContent.appendChild(drawBlock(emojiCat['packages'][1]['emote'][j]['url'], emojiCat['packages'][1]['emote'][j]['text'], 'img', 'rua-normal-small-emoji', false, null));
        }
        emojiLeftArrow.addEventListener('click',()=>{
            if(emojiCat['packages'].length>5){
                if (i>1){
                    i-=10;
                    i= Math.max(i,1);
                    if(i<emojiCat['packages'].length)
                        emojiRightArrow.setAttribute('style', '--2c6ec6e4:#61666d; --72eca176:16px;');
                    if(i===1)
                        emojiLeftArrow.setAttribute('style', '--2c6ec6e4:#c9ccd0; --72eca176:16px;');
                    else
                        emojiLeftArrow.setAttribute('style', '--2c6ec6e4:#61666d; --72eca176:16px;');
                    let x = i+5;
                    updateSlider(x);
                }

            }
        });
        emojiRightArrow.addEventListener('click',()=>{
            if(emojiCat['packages'].length>5){
                if (i<emojiCat['packages'].length) {
                    i= Math.min(i,emojiCat['packages'].length-1);
                    if(i>1)
                        emojiLeftArrow.setAttribute('style', '--2c6ec6e4:#61666d; --72eca176:16px;');
                    if(i+5>emojiCat['packages'].length-1)
                        emojiRightArrow.setAttribute('style', '--2c6ec6e4:#c9ccd0; --72eca176:16px;');
                    else
                        emojiRightArrow.setAttribute('style', '--2c6ec6e4:#61666d; --72eca176:16px;');
                    let x = i+5;
                    updateSlider(x);
                }

            }
        });

        function updateSlider(x){
            try{
                for (const block of document.querySelectorAll('.rua-emoji-type')) {
                    emojiTab.removeChild(block);
                }
                for (;i < x; i++) {
                    if(emojiCat['packages'][i]['type']===9){
                        emojiTab.appendChild(drawSlider(emojiCat['packages'][i]['url'], i, emoji['panel_desc'], emoji['emote']));
                    }else
                        emojiTab.appendChild(drawSlider(emojiCat['packages'][i]['url'], i, emojiCat['packages'][i]['text'], emojiCat['packages'][i]['emote']));
                }
            }catch (e) {}
        }
        emojiTab.appendChild(emojiSlider);

        div.appendChild(emojiTitle);
        div.appendChild(emojiContent);
        div.appendChild(emojiTab);
        return div;
    }

    function drawBlock(url, content, type, size, unlocked, reason){
        console.log(unlocked);
        url = url.replace('http', 'https');
        let div = document.createElement('div');
        div.classList.add('rua-emoji-info');
        div.setAttribute('content', content);
        if (type==='div')
            div.innerHTML=`<div class="${size}" data-v-187455db="">${url}</div>`;
        else
            div.innerHTML=`<img class="${size}" src="${url}" data-v-187455db="">`;
        if(reason!==null && !unlocked){
            div.style.position = `relative`;
            div.getElementsByTagName('img')[0].style.opacity='0.3';
            div.innerHTML+=`<div class="rua-disabled-text">${reason['title']}</div>`
        }else{
            div.addEventListener('click',()=>{
                textArea.focus();
                textArea.value+=div.getAttribute('content');
            });
        }

        return div;
    }

    function drawSlider(url, index, title, icons){
        let div = document.createElement('div');
        div.setAttribute('content',`${index}`);
        div.classList.add('rua-emoji-type');
        if (index===1){
            div.classList.add('rua-current-type');
            emojiTitle.innerText=title;
        }
        div.innerHTML=`<img class="emoji-type-face" src="${url}" data-v-187455db="">`;
        div.addEventListener('click', ()=>{
            textArea.focus();
            for (const block of document.querySelectorAll('.rua-emoji-type')) {
                block.classList.remove('rua-current-type');
            }
            div.classList.add('rua-current-type');
            emojiTitle.innerText=title;
            emojiContent.innerHTML='';
            console.log(icons);
            for (let i = 0; i < icons.length; i++) {
                switch (title) {
                    case 'tv_小电视':
                        emojiContent.appendChild(drawBlock(icons[i]['url'], icons[i]['text'], 'img', 'rua-normal-small-emoji', false, null));
                        break;
                    case '小黄脸':
                        emojiContent.appendChild(drawBlock(icons[i]['url'], icons[i]['text'], 'img', 'rua-normal-small-emoji', false, null));
                        break;
                    case '颜文字':
                        emojiContent.appendChild(drawBlock(icons[i]['url'], icons[i]['text'], 'div', 'rua-text-emoji', false, null));
                        break;
                    default:
                        emojiContent.appendChild(drawBlock(icons[i]['url'], icons[i]['text'], 'img', 'rua-normal-large-emoji', icons[i]['flags']['unlocked'], icons[i]['activity']));

                }
            }
        });
        return div;
    }
}();