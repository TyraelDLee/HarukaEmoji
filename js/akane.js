/***
 * Copyright (c) 2021 Tyrael, Y. LI
 * */
// add new emoji text here.
// Keep all assets in webp.
// DO NOT CHANGE ANY VARIABLE NAME BELOW!
const SRC = "../images/akane/";
const emoji = ["开车", "喷了", "咬牙切齿", "我恨", "咆哮", "大肠",
    "抽屉", "哈哈哈", "皮蛋", "生气", "剃须刀", "生煎包", "音", "音音", "浴缸",
    "泡脚", "赢了", "凉了", "哼", "没哭", "失败", "擦泪", "河豚",
    "下锅"];

const link = chrome.runtime.getURL("../images/haruka/abaaba.svg");
var imgs = [];for (let i = 0; i < emoji.length; i++)imgs.push(new ImageButton(chrome.runtime.getURL(SRC + emoji[i] + ".webp"), 1));