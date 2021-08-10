/***
 * Copyright (c) 2021 Tyrael, Y. LI
 * */
const ROOM_ID = 21413565;
const MADEL_ID = 193709;
// add new emoji text here.
// Keep all assets in gif.
// must be a 2D array, each sub-element has 4 elements maximum.
// DO NOT CHANGE ANY VARIABLE NAME BELOW!
const SRC = "../images/pudding/";
const emoji = [["whl", "草", "赞", "？"]];

const link = chrome.extension.getURL("../images/pudding/icon.png");
var imgs = [];
for (let i = 0; i < emoji.length; i++) {
    for (let j = 0; j < emoji[i].length; j++) {
        imgs.push(new ImageButton(chrome.extension.getURL(SRC+emoji[i][j]+".gif"), 1));
    }
}