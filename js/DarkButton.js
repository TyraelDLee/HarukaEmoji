class DarkButton{
    buttonElement
    buttonBackground
    buttonShadow
    buttonToggle
    togglePadding
    clickLock
    moveLock
    buttonWidth
    buttonHeight
    mouseStartX
    mousePreX
    togglePos

    toggleMoon
    toggleHolo
    holoHost
    toggleHost

    clouds
    stars
    constructor(buttonElement, check=false, width=null, height=null, togglePadding=null) {
        this.buttonElement = buttonElement;
        this.buttonBackground = document.createElement('div');
        this.buttonBackground.classList.add('dark-button-background');

        this.buttonShadow = document.createElement('div');
        this.buttonShadow.classList.add('dark-button-inner-shadow');

        this.toggleHost = document.createElement('div');
        this.toggleHost.classList.add('dark-button-toggle-host');

        this.holoHost = document.createElement('div');
        this.holoHost.classList.add('dark-button-holo-host');

        this.buttonToggle = document.createElement('div');
        this.buttonToggle.classList.add('dark-button-toggle');

        this.buttonElement.appendChild(this.buttonBackground);
        this.buttonElement.appendChild(this.buttonShadow);
        this.buttonElement.appendChild(this.toggleHost);
        this.toggleHost.appendChild(this.holoHost);
        this.toggleHost.appendChild(this.buttonToggle);
        this.clickLock = false;
        this.moveLock = false;
        this.buttonHeight = buttonElement.clientHeight;
        this.buttonWidth = buttonElement.clientWidth;
        this.togglePadding = 10;
        this.togglePos = 0;
        if(width !== null && height !== null && togglePadding !== null){
            this.setSize(width, height, togglePadding);
        }
        if (check) {
            this.buttonToggle.classList.add("activate");
            this.togglePos = this.buttonWidth - this.buttonHeight;
        }

        this.toggleMoon = []
        this.toggleHolo = []
        for (let i = 0; i < 3; i++) {
            let moon = document.createElement('div');
            moon.classList.add('moon');
            this.buttonToggle.appendChild(moon);
            this.toggleMoon.push(moon);

            let holo = document.createElement('div');
            holo.classList.add('holo');
            this.holoHost.appendChild(holo);
            this.toggleHolo.push(holo);
        }

        this.toggleMoon[0].setAttribute('style', `width: 40%; height: 40%; top: 38%; left: 13%;`);
        this.toggleMoon[1].setAttribute('style', `width: 20%; height: 20%; top: 15%; left: 46%;`);
        this.toggleMoon[2].setAttribute('style', `width: 20%; height: 20%; top: 62%; left: 60%;`);

        this.clouds = []
        const cloudGroup1 = document.createElement('div'), cloudGroup2 = document.createElement('div');

        for (let i = 0; i < 12; i++) {
            let cloud = document.createElement('div');
            cloud.classList.add('cloud');
            if (i<6){
                cloudGroup1.appendChild(cloud);
            }else{
                cloudGroup2.appendChild(cloud);
            }
            this.clouds.push(cloud);
        }
        this.buttonBackground.appendChild(cloudGroup1);
        this.buttonBackground.appendChild(cloudGroup2);
        cloudGroup1.setAttribute('style', 'position:absolute;width:100%;height:100%;');
        cloudGroup2.setAttribute('style', 'transform: translateY(calc(var(--toggle-size) * -0.3)); filter: opacity(0.5); position:absolute;width:100%;height:100%;');
        this.clouds[0].setAttribute('style', 'right:-10%');
        this.clouds[1].setAttribute('style', 'right:1%; bottom:-15%');
        this.clouds[2].setAttribute('style', 'right:15%; bottom:-25%');
        this.clouds[3].setAttribute('style', 'right:33%; bottom:-22%');
        this.clouds[4].setAttribute('style', 'right:48%; bottom:-27%');
        this.clouds[5].setAttribute('style', 'right:60%; bottom:-30%');

        this.clouds[6].setAttribute('style', 'right:-10%');
        this.clouds[7].setAttribute('style', 'right:1%; bottom:-15%');
        this.clouds[8].setAttribute('style', 'right:15%; bottom:-25%');
        this.clouds[9].setAttribute('style', 'right:33%; bottom:-22%');
        this.clouds[10].setAttribute('style', 'right:48%; bottom:-27%');
        this.clouds[11].setAttribute('style', 'right:60%; bottom:-30%');

        this.stars = []
        const starGroup = document.createElement('div');
        starGroup.setAttribute('style', 'position:absolute;width:100%;height:100%;');
        for (let i = 0; i < 11; i++) {
            let star = document.createElement('div');
            star.classList.add('star');
            let starClips = []
            for (let j = 0; j < 4; j++) {
                let starClip = document.createElement('div');
                starClip.classList.add('star-clip');
                star.appendChild(starClip);
                starClips.push(starClip);
            }
            starClips[0].setAttribute('style', 'border-radius: 0 0 var(--starRadius) 0;');
            starClips[1].setAttribute('style', 'border-radius: 0 0 0 var(--starRadius); left: 50%;');
            starClips[2].setAttribute('style', 'border-radius: 0 var(--starRadius) 0 0; top: 50%;');
            starClips[3].setAttribute('style', 'border-radius: var(--starRadius) 0 0 0; top: 50%; left: 50%;');
            starGroup.appendChild(star);
            this.stars.push(star);
        }
        this.buttonBackground.appendChild(starGroup);

        this.stars[0].setAttribute('style', '--starRadius: 90%; width: calc(var(--toggle-size) * .3); height: calc(var(--toggle-size) * .3); top: 5%; left: 22%;');
        this.stars[1].setAttribute('style', '--starRadius: 90%; width: calc(var(--toggle-size) * .2); height: calc(var(--toggle-size) * .2); top: 12%; left: 10%;');
        this.stars[2].setAttribute('style', '--starRadius: 90%; width: calc(var(--toggle-size) * .12); height: calc(var(--toggle-size) * .12); top: 23%;  left: 15%;');
        this.stars[3].setAttribute('style', '--starRadius: 90%; width: calc(var(--toggle-size) * .125); height: calc(var(--toggle-size) * .125); top: 28%; left: 10%;');
        this.stars[4].setAttribute('style', '--starRadius: 90%; width: calc(var(--toggle-size) * .2); height: calc(var(--toggle-size) * .2); top: 20%; left: 30%;');
        this.stars[5].setAttribute('style', '--starRadius: 90%; width: calc(var(--toggle-size) * .1); height: calc(var(--toggle-size) * .1); top: 33%; left: 28%;');
        this.stars[6].setAttribute('style', '--starRadius: 90%; width: calc(var(--toggle-size) * .12); height: calc(var(--toggle-size) * .12); top: 18%; left: 40%;');
        this.stars[7].setAttribute('style', '--starRadius: 90%; width: calc(var(--toggle-size) * .12); height: calc(var(--toggle-size) * .12); top: 10%; left: 45%;');
        this.stars[8].setAttribute('style', '--starRadius: 90%; width: calc(var(--toggle-size) * .2); height: calc(var(--toggle-size) * .2); top: 28%; left: 47%;');
        this.stars[9].setAttribute('style', '--starRadius: 90%; width: calc(var(--toggle-size) * .3); height: calc(var(--toggle-size) * .3); top: 10%; left: 53%;');
        this.stars[10].setAttribute('style', '--starRadius: 90%; width: calc(var(--toggle-size) * .12); height: calc(var(--toggle-size) * .12); top: 23%; left: 54%;');
    }

    setSize(width, height, togglePadding){
        this.buttonWidth = width;
        this.buttonHeight = height;
        this.togglePadding = togglePadding;
        this.buttonElement.setAttribute('style', `--toggle-padding: ${togglePadding}px; --button-height: ${height}px; --button-width: ${width}px;`)
    }
    event(){
        let toggleSize = this.buttonHeight - this.togglePadding,
            holo1Dis = toggleSize*-1.6+this.togglePadding-this.togglePadding*-1,
            holo2Dis = toggleSize*-1.1+this.togglePadding-this.togglePadding*-1;

        this.buttonElement.onmousedown = (e)=>{
            this.clickLock=true;
            this.toggleHost.setAttribute('style', ``);
            this.mouseStartX=e.offsetX;
            this.mousePreX = e.offsetX;
        }

        this.buttonElement.onmousemove = (e)=>{
            // this.clickLock=true;
            if (this.clickLock) {
                let mouseMovement = (e.clientX-this.mouseStartX) - this.buttonHeight/2;
                if(Math.abs(mouseMovement)>2){
                    this.toggleHost.classList.remove("activate")

                    this.moveLock = Math.abs(e.offsetX-this.mouseStartX)>0;
                    let rotationPrentage =  mouseMovement/(this.buttonWidth - this.buttonHeight);
                    if (rotationPrentage > 1)rotationPrentage = 1;
                    if (rotationPrentage < 0)rotationPrentage = 0;
                    if (mouseMovement<0) mouseMovement=0;
                    if (mouseMovement>this.buttonWidth - this.buttonHeight) mouseMovement=this.buttonWidth - this.buttonHeight;
                    this.buttonBackground.setAttribute('style', `transform: translateY(${(1-rotationPrentage) * -58}%);`);
                    this.toggleHost.setAttribute('style', `transform: translateX(${mouseMovement}px);`);
                    this.togglePos = mouseMovement;
                    this.toggleHolo[0].setAttribute('style', `margin-left: ${-this.togglePadding+holo1Dis*rotationPrentage}px`);
                    this.toggleHolo[1].setAttribute('style', `margin-left: ${-this.togglePadding+holo2Dis*rotationPrentage}px`);
                }
                this.mousePreX=e.offsetX;
            }
        }

        this.buttonElement.onmouseup = ()=>{
            this.toggleHost.removeAttribute('style');
            this.buttonBackground.removeAttribute('style');
            this.toggleHolo[0].removeAttribute('style');
            this.toggleHolo[1].removeAttribute('style');
            if(this.moveLock){
                if (this.togglePos <= this.buttonWidth / 2){
                    this.toggleHost.classList.remove('activate');
                    this.buttonBackground.classList.remove('activate');
                    this.togglePos=0;
                }else{
                    this.toggleHost.classList.add('activate');
                    this.buttonBackground.classList.add('activate');
                    this.togglePos=this.buttonWidth-this.buttonHeight/2;
                }
            }else{
                let actiavte = this.toggleHost.classList.contains("activate");
                if (actiavte){
                    this.toggleHost.classList.remove('activate');
                    this.buttonBackground.classList.remove('activate');
                    this.togglePos=0;
                }else{
                    this.toggleHost.classList.add('activate');
                    this.buttonBackground.classList.add('activate');
                    this.togglePos=this.buttonWidth-this.buttonHeight/2;
                }
            }
            this.clickLock=false;
            this.moveLock=false;
        }

        this.buttonElement.onmouseleave = ()=>{
            this.toggleHost.removeAttribute('style');
            this.buttonBackground.removeAttribute('style');
            this.toggleHolo[0].removeAttribute('style');
            this.toggleHolo[1].removeAttribute('style');
            if (this.togglePos <= this.buttonWidth / 2){
                this.toggleHost.classList.remove('activate');
                this.buttonBackground.classList.remove('activate');
                this.togglePos=0;
            }else{
                this.toggleHost.classList.add('activate');
                this.buttonBackground.classList.add('activate');
                this.togglePos=this.buttonWidth-this.buttonHeight/2;
            }
            this.clickLock = false;
            this.moveLock=false;
        }
    }
}