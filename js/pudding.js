/***
 * Copyright (c) 2021 Tyrael, Y. LI
 * */
// add new emoji text here.
// Keep all assets in webp.
// DO NOT CHANGE ANY VARIABLE NAME BELOW!
const SRC = "../images/pudding/";
const emoji = ["whl", "草", "赞", "？", "nano", "打call", "死了都要爱","吃瓜"];

const link = chrome.runtime.getURL("../images/pudding/icon.png");
var imgs = [];for(let i = 0; i < emoji.length; i++)imgs.push(new ImageButton(chrome.runtime.getURL(SRC+emoji[i]+".webp"), 1));
