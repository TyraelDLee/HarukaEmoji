var roomImage;
var roomStatus;
var roomTitle;
var roomUrl;

function getInfo(){
    $(function (){
        $.ajax({
            url: "https://api.live.bilibili.com/room/v1/Room/getRoomInfoOld?mid=617459493",
            type: "GET",
            dataType: "json",
            success: function (info){
                let data = info["data"];
                roomImage = data["cover"];
                roomStatus =  data["liveStatus"];
                roomTitle = data["title"];
                roomUrl = data["url"];
                console.log(data);
            }
        })
    })

    if(roomStatus === 1){
        console.log("ture")
        pushNotification();
    }
}

function pushNotification(){

}

// window.setInterval(getInfo,1000);
