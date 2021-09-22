/***
 * Copyright (c) 2021 Tyrael, Y. LI
 * */
const ROOM_ID = 1603600;
// add new emoji text here.
// Keep all assets in webp.
// DO NOT CHANGE ANY VARIABLE NAME BELOW!
const SRC = "../images/seki/";
const emoji = ["寄", "猪跑", "山猪跑", "七跑", "彩猪"];

const link = chrome.runtime.getURL("../images/haruka/abaaba.svg");
var imgs = [];for (let i = 0; i < emoji.length; i++)imgs.push(new ImageButton(chrome.runtime.getURL(SRC+emoji[i]+".webp"), 1));