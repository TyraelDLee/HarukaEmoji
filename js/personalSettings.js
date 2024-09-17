;!function (){
    const uid = window.location['pathname'].replaceAll('/','');
    chrome.storage.sync.get(['blackListHB', 'blackListDK', 'blackListLive', 'blackListVideo', 'blackListDynamic'], function (info){

    });

    chrome.storage.local.get(['followingIDs'], function (info){
        if (info['followingIDs'].indexOf(uid)!==-1){

        }
    });

    function renderBlock(){
        const host = document.getElementById('page-index').getElementsByClassName('col-2')[0];

        const injectionNode = `
        <div data-v-31d5659a="" class="section user-info">
            <p data-v-31d5659a="" class="user-info-title" style="">
                <span data-v-31d5659a="" class="info-title">个人资料</span>
                <span data-v-31d5659a="" class="info-title" style="font-size: 12px;color: var(--text2);">插件设置</span>
            </p>
            <div data-v-31d5659a="" class="info-content">
                <div data-v-31d5659a="" class="info-personal">
                    <div data-v-31d5659a="" class="info-wrap">
                        <span data-v-31d5659a="" class="info-command">UID</span>
                        <span data-v-31d5659a="" class="info-value">1377219279</span>
                    </div>
                    <div data-v-31d5659a="" class="info-wrap">
                        <span data-v-31d5659a="" class="info-command">生日</span>
                        <span data-v-31d5659a="" class="info-value">08-06</span>
                    </div>
                </div>
            </div>
        </div>`
    }
}();