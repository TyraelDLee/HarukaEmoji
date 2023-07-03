!function (){
    findBlock();
    function findBlock(){
        try{
            const block = document.getElementById('article-content');
            block.addEventListener('copy', (e)=>{
                e.preventDefault();
                let string = window.getSelection().getRangeAt(0).toString();
                navigator.clipboard.writeText(string).catch(e=>{
                    console.log('Failed to access clipboard, using execCommand.');
                    const videoInfo = document.createElement('textarea');
                    videoInfo.value = string;
                    document.body.appendChild(videoInfo);
                    videoInfo.select();
                    document.execCommand('Copy');
                    videoInfo.remove();
                });
            })
        }catch (e) {
            setTimeout(findBlock, 200)
        }
    }
}();