!function () {
    const main = document.getElementById('main');
    let pnMax = 1;
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
        grabFollowing(1);
        document.body.onscroll= (e)=>{
            if (document.documentElement.scrollTop > 20) {
                document.getElementById('rua-head').setAttribute('style', `top: ${80 + document.documentElement.scrollTop}px; position: absolute`);
                document.getElementById('rua-head-space').setAttribute('style', `display:block; padding: 5px 0`);
            }else {
                document.getElementById('rua-head').removeAttribute('style');
                document.getElementById('rua-head-space').setAttribute('style', `display:none;padding: 5px 0`);
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
                pnMax = Math.ceil((json['data']['total']-0)/50);
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
        let verIcon = verify===0?'var(--personal-verify)':verify===1?'var(--personal-verify)':'';
        let userBlock = `<div class="rua-setting-user-block">
        <div class="rua-setting-user-info">
            <div class="user-face" id="${id}"><img src="${face}"><span class="verified" style="background-position: ${verIcon}"></span></div>
            <div class="user-name"><span>${name}</span><span class="verify-text">${verifyText}</span></div>
        </div>
        <div class="rua-setting-button-group">
            <div class="button-host">
                <section class="button">
                    <div class="checkbox">
                        <input type="checkbox" checked>
                        <label></label>
                    </div>
                </section>
            </div>
            <div class="button-host">
                <section class="button">
                    <div class="checkbox">
                        <input type="checkbox" checked>
                        <label></label>
                    </div>
                </section>
            </div>
            <div class="button-host">
                <section class="button">
                    <div class="checkbox">
                        <input type="checkbox" checked>
                        <label></label>
                    </div>
                </section>
            </div>
        </div>
    </div>`;
        main.innerHTML+=userBlock;

    }
}();