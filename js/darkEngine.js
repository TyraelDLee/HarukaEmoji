!function () {
    let classNumber = 0;
    new MutationObserver((m)=>{
        m.forEach(function(mutation) {
            if (mutation.type === "childList") {
                for(const node of mutation.addedNodes){
                    // if(node.nodeType === 1){
                    //     for (const child of node.childNodes){
                    //         console.log(node.childNodes.length)
                    //         if (child.nodeType === 1){
                    //             child.classList.add(`rua-cn-${classNumber}`);
                    //             classNumber++;
                    //         }
                    //
                    //     }
                    // }
                    travelsAllNode(node);
                }
            }
        });
    }).observe(document, {subtree: true, childList: true});

    function travelsAllNode(node){
        console.log(node.nodeType);
        console.log(node)
        if(node.nodeType === 1){
            for(const child of node.childNodes){

                if(child.nodeType === 1){
                    child.classList.add(`rua-cn-${classNumber}`);
                    classNumber++;
                }
                if (node.childNodes>0){
                    travelsAllNode(child);
                }
            }
        }
    }
}();