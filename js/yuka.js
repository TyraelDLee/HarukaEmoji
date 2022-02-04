/***
 * Copyright (c) 2021 Tyrael, Y. LI
 * */
// add new emoji text here.
// Keep all assets in webp.
// DO NOT CHANGE ANY VARIABLE NAME BELOW!
const SRC = "../images/yuka/";
const emoji = ["无语", "住嘴", "寄", "冲", "倒水", "润",
    "震撼", "洞察", "打call", "扭", "饿", "摸北", "吃小孩", "笑了", "骑狗",
    "北", "芜湖", "震惊", "摇摆羊", "popo", "来嘛"];

const link = chrome.runtime.getURL("../images/haruka/abaaba.svg");
var imgs = [];for (let i = 0; i < emoji.length; i++)imgs.push(new ImageButton(chrome.runtime.getURL(SRC + emoji[i] + ".webp"), 1));