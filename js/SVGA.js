function svga(object, dir){
    let frame = object.getAttribute('frame')-1+1;
    switch (dir) {
        case 0:
            animation(object, frame, 13);
            break;
        case 1:
            animation(object, frame, 1);
            break;
        case 2:
            animation(object, frame, 25);
            break;
    }
}

function animation(object, frame, stop){
    object.setAttribute('frame', frame+"");
    object.src = `./images/svga/${frame}.svg`;
    if (frame!==stop){
        setTimeout(()=>{
            frame<stop?frame++:frame--
            animation(object, frame, stop);
        }, 20);
    }
}