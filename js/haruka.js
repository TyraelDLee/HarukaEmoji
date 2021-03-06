/***
 * Copyright (c) 2021 Tyrael, Y. LI
 * */
// add new emoji text here.
// Keep all assets in webp.
// DO NOT CHANGE ANY VARIABLE NAME BELOW!
const SRC = "../images/haruka/";
const emoji = ["5835", "草", "阿巴", "豹怒", "豹笑", "吃瓜",
    "吃惊", "吃桃子", "呆呆", "赞", "好耶", "滑稽", "加油", "骄傲", "哭哭",
    "酸", "让我康康", "跳脸", "晚安", "问号", "傻豹", "吃桃", "rua豹",
    "问号豹", "打滚", "跳脸豹", "打call", "打豹", "猜拳", "困", "摇摆",
    "耶", "豹睡", "我不玩了", "玩手机", "豹豹！", "豹条"];

const link = chrome.runtime.getURL("../images/haruka/abaaba.svg");
var imgs = [];for(let i = 0; i < emoji.length; i++)(emoji[i] === "豹条")?imgs.push(new ImageButton(chrome.runtime.getURL(SRC + emoji[i] + ".webp"), 2, '(', ')')):imgs.push(new ImageButton(chrome.runtime.getURL(SRC + emoji[i] + ".webp"), 1, '(', ')'));
