/**
 * Created by fplei on 2021/9/26.
 * 下载器（同时下载并发需要优化,推荐同时下载任务=5）
 */
function Downer(_index,_taskId,_url,_downCallBack) {
    this.taskId=_taskId;
    this.index=_index;
    this.url=_url;
    this.downCallBack=_downCallBack;
    this.progressing=0;
    this.totalSize=-1;
    this.status=0;//0:等待下载 1:下载中  2:下载成功   3:下载完成  -1:下载异常
    this.xmlHttp=null;
    this.startDown=function () {
        var _that=this;
        if(!this.url){
            this.downCallBack(this.index,this.taskId,-1,"严重错误，下载地址空",null)
        }
        if (window.ActiveXObject) {
            // IE6, IE5 浏览器执行代码
            this.xmlHttp = new ActiveXObject("Microsoft.XMLHTTP");
        } else if (window.XMLHttpRequest) {
            // IE7+, Firefox, Chrome, Opera, Safari 浏览器执行代码
            this.xmlHttp = new XMLHttpRequest();
        }
        var fileType=Downer.getFileType(this.url);
        var sortUrl=this.url.split("?")[0];
        sortUrl=sortUrl.split("/");
        var fileName=sortUrl[sortUrl.length-1];
        if (this.xmlHttp != null) {
            this.xmlHttp.open("get", this.url, true);
            this.xmlHttp.setRequestHeader('Referer','https://gitee.com');
            this.xmlHttp.responseType = 'blob';//关键
            this.xmlHttp.addEventListener('progress',function (evt) {
                if (evt.lengthComputable) {
                    _that.totalSize=evt.total;
                    var percentComplete = evt.loaded / evt.total;
                    var progress=(percentComplete * 100);
                    _that.downCallBack(_that.index,_that.taskId,_that.status,null,{progressing:progress,totalSize:evt.total,url:_that.url});
                }
            },false);
            this.status=1;
            this.xmlHttp.onreadystatechange = doResult; //设置回调函数
            this.xmlHttp.send();
        }
        function doResult() {
            if(_that.xmlHttp.status == 200){
                if(_that.xmlHttp.readyState == 4){
                    _that.status=2;
                    var result=_that.browserSaver(_that.xmlHttp.response, decodeURI(fileName), fileType);
                    _that.downCallBack(_that.index,_that.taskId,_that.status,null,{progressing:100,totalSize:_that.totalSize,url:_that.url});
                }
            }else {
                _that.status=-1;
                _that.downCallBack(_that.index,_that.taskId,_that.status,"下载失败"+_that.xmlHttp.status,{progressing:0,totalSize:_that.totalSize,url:_that.url});
            }
        }
    };
    this.stopDown=function () {
        if(this.xmlHttp!=null){
            this.xmlHttp.abort();
            this.status=3;
            this.downCallBack(this.index,this.taskId,this.status,"取消下载任务",null);
        }
    };
    this.browserSaver=function (data, strFileName, strMimeType) {
        var self = window, // this script is only for browsers anyway...
            defaultMime = "application/octet-stream", // this default mime also triggers iframe downloads
            mimeType = strMimeType || defaultMime,
            payload = data,
            url=(data==null)?strFileName:null,
            // url = !strFileName && !strMimeType && payload,
            anchor = document.createElement("a"),
            toString = function(a){return String(a);},
            myBlob = (self.Blob || self.MozBlob || self.WebKitBlob || toString),
            fileName = strFileName || "download",
            blob,
            reader;
        myBlob= myBlob.call ? myBlob.bind(self) : Blob ;
        if(String(this)==="true"){ //reverse arguments, allowing download.bind(true, "text/xml", "export.xml") to act as a callback
            payload=[payload, mimeType];
            mimeType=payload[0];
            payload=payload[1];
        }
        //go ahead and download dataURLs right away
        if(/^data\:[\w+\-]+\/[\w+\-]+[,;]/.test(payload)){
            if(payload.length > (1024*1024*1.999) && myBlob !== toString ){
                payload=dataUrlToBlob(payload);
                mimeType=payload.type || defaultMime;
            }else{
                return navigator.msSaveBlob ?  // IE10 can't do a[download], only Blobs:
                    navigator.msSaveBlob(dataUrlToBlob(payload), fileName) :
                    saver(payload) ; // everyone else can save dataURLs un-processed
            }
        }//end if dataURL passed?
        blob = payload instanceof myBlob ?
            payload :
            new myBlob([payload], {type: mimeType}) ;
        function dataUrlToBlob(strUrl) {
            var parts= strUrl.split(/[:;,]/),
                type= parts[1],
                decoder= parts[2] == "base64" ? atob : decodeURIComponent,
                binData= decoder( parts.pop() ),
                mx= binData.length,
                i= 0,
                uiArr= new Uint8Array(mx);
            for(i;i<mx;++i) uiArr[i]= binData.charCodeAt(i);
            return new myBlob([uiArr], {type: type});
        }
        function saver(url, winMode){
            if ('download' in anchor) { //html5 A[download]
                anchor.href = url;
                anchor.setAttribute("download", fileName);
                anchor.className = "download-js-link";
                anchor.innerHTML = "downloading...";
                anchor.style.display = "none";
                document.body.appendChild(anchor);
                setTimeout(function() {
                    anchor.click();
                    document.body.removeChild(anchor);
                    if(winMode===true){setTimeout(function(){ self.URL.revokeObjectURL(anchor.href);}, 250 );}
                }, 66);
                return true;
            }
            // handle non-a[download] safari as best we can:
            if(/(Version)\/(\d+)\.(\d+)(?:\.(\d+))?.*Safari\//.test(navigator.userAgent)) {
                url=url.replace(/^data:([\w\/\-\+]+)/, defaultMime);
                if(!window.open(url)){ // popup blocked, offer direct download:
                    if(confirm("Displaying New Document\n\nUse Save As... to download, then click back to return to this page.")){ location.href=url; }
                }
                return true;
            }
            //do iframe dataURL download (old ch+FF):
            var f = document.createElement("iframe");
            document.body.appendChild(f);
            if(!winMode){ // force a mime that will download:
                url="data:"+url.replace(/^data:([\w\/\-\+]+)/, defaultMime);
            }
            f.src=url;
            setTimeout(function(){ document.body.removeChild(f); }, 333);
        }//end saver
        if (navigator.msSaveBlob) { // IE10+ : (has Blob, but not a[download] or URL)
            return navigator.msSaveBlob(blob, fileName);
        }
        if(self.URL){ // simple fast and modern way using Blob and URL:
            saver(self.URL.createObjectURL(blob), true);
        }else{
            // handle non-Blob()+non-URL browsers:
            if(typeof blob === "string" || blob.constructor===toString ){
                try{
                    return saver( "data:" +  mimeType   + ";base64,"  +  self.btoa(blob)  );
                }catch(y){
                    return saver( "data:" +  mimeType   + "," + encodeURIComponent(blob)  );
                }
            }
            // Blob but not URL support:
            reader=new FileReader();
            reader.onload=function(e){
                saver(this.result);
            };
            reader.readAsDataURL(blob);
        }
        return true;
    };
}

var downTaskMap=new Map();
/**
 * 加入下载任务，并开始下载
 * @param taskId
 * @param url
 * @param callBack
 */
Downer.pushTask=function (index,taskId,url,callBack) {
    if(downTaskMap.get(taskId)){
        callBack(taskId,index,-1,"任务已经存在，请移除再添加",null);
        return;
    }
    var downer=new Downer(index,taskId,url,callBack);
    downTaskMap.set(taskId,downer);
    downer.startDown();
};
Downer.removeTaskOnly=function (taskId) {
    console.log("taskId:"+taskId+"任务被移除");
    downTaskMap.delete(taskId)
};
/**
 * 移除某个下载任务
 * @param taskId
 */
Downer.removeTask=function(taskId){
    var _downer=downTaskMap.get(taskId);
    if(_downer){
        _downer.stopDown();
        console.log("taskId:"+taskId+"任务被停止并移除");
        downTaskMap.delete(taskId)
    }
};
/**
 * 取消所有任务
 */
Downer.clearAllTask=function () {
    downTaskMap.forEach(function (key) {
        Downer.removeTask(key.taskId)
    })
};
Downer.getFileType=function (url) {
    // 后缀获取
    var suffix = '';
    // 获取类型结果
    var result = '';
    try {
        const flieArr = url.split('.');
        suffix = flieArr[flieArr.length - 1];
    } catch (err) {
        suffix = '';
    }
    // fileName无后缀返回 false
    if (!suffix) {
        return false;
    }
    suffix = suffix.toLocaleLowerCase();
    // 图片格式
    const imglist = ['png', 'jpg', 'jpeg', 'bmp', 'gif'];
    // 进行图片匹配
    result = imglist.find((item) => {return item === suffix});
    if (result) {
        return 'image';
    }
    // 匹配txt
    const txtlist = ['txt'];
    result = txtlist.find((item) => {return item === suffix});
    if (result) {
        return 'txt';
    }
    // 匹配 excel
    const excelist = ['xls', 'xlsx'];
    result = excelist.find((item) => {return item === suffix});
    if (result) {
        return 'excel';
    }
    // 匹配 word
    const wordlist = ['doc', 'docx'];
    result = wordlist.find((item) => {return item === suffix});
    if (result) {
        return 'word';
    }
    // 匹配 pdf
    const pdflist = ['pdf'];
    result = pdflist.find((item) => {return item === suffix});
    if (result) {
        return 'pdf';
    }
    // 匹配 ppt
    const pptlist = ['ppt', 'pptx'];
    result = pptlist.find((item) => {return item === suffix});
    if (result) {
        return 'ppt';
    }
    // 匹配 视频
    const videolist = ['mp4', 'm2v', 'mkv', 'rmvb', 'wmv', 'avi', 'flv', 'mov', 'm4v'];
    result = videolist.find((item) => {return item === suffix});
    if (result) {
        return 'video';
    }
    // 匹配 音频
    const radiolist = ['mp3', 'wav', 'wmv'];
    result = radiolist.find((item) => {return item === suffix});
    if (result) {
        return 'radio';
    }
    // 其他 文件类型
    return 'other';
};