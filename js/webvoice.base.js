/**
 * webvoice
 * @description 网页语音化工具--alloyTeam
 * @author Bin Wang(Dorsywang@alloyTeam)
 */

;(function(TTS){
    //private Object
    var Main = {

        //声音文件缓冲队列
        voiceQueue: [],

        //没有读的word队列
        unreadWordQueue: [],

        //读过的word队列
        readedWordQueue: [],

        //eventStack
        event: {},

        module: function(name, func){
            this[name] = new func(this);
        },

        ready: function(func){
            this.addEventListener("ready", func);
        },
        
        //for some reson we have to stop the program running
        deleteSelf: function(msg){
            delete window[TTS];
            throw new Error(msg);
        },

        init: function(){
            //初始化请求数据

            if(this.pinyin.status.readyState){
                this.dorsyAudio.init();
                this.text.readWords();

                this.fireEvent("ready");
            }else{
                this.pinyin.init();
            }
        },

        read: function(word){
            this.unreadWordQueue = word.split("");
            this.readyForBufferQueue();

            var _this = this;

            this.addEventListener("initBufferQueueReady", function(){
                function read(){
                    _this.text.playOneWord();

                    setTimeout(function(){
                        read();
                    }, 300);
                }

                read();

                //把前5个去除
                _this.unreadWordQueue = _this.unreadWordQueue.slice(5);
                
                //请求其他的word进入缓冲区
                _this.text.requestWordBuffer();
                
            });
        },

        //自定义事件触发
        fireEvent: function(eventType, data){
            console.log("fire event: " + eventType);

            var listenFuncLists = this.event[eventType] || [];

            for(var i = 0; i < listenFuncLists.length; i ++){
                listenFuncLists[i](data);
            }
        },

        //添加自定义事件监听
        addEventListener: function(eventType, func){
            this.event[eventType] = this.event[eventType] || [];

            this.event[eventType].push(func);
        },

        //准备缓冲区
        readyForBufferQueue: function(){
            console.log("ready for bufferQueue");

            //清除缓冲区
            var bufferLen = this.config.BUFFER_LENTH;
            this.voiceQueue = new Array(bufferLen);

            //做一个ready标记 使用加法总和标记, 如果ready一个减去一个i直到为0
            var readyFlag = (0 + bufferLen - 1) * (bufferLen) / 2;

            //并发请求文件进入缓冲区
            for(var i = 0; i < bufferLen; i ++){
                this.net.loadFile(this.unreadWordQueue[i], function(i){
                    return function(response){
                        console.log("XHR loadFile Success", ", position: ", i);

                        //压入队列中
                        Main.voiceQueue[i] = response;

                        //检查缓冲区是否已经ready
                        readyFlag -= i;

                        //如果为0说明已经ready,触发自定义事件 initBufferQueueReady
                        if(readyFlag == 0){
                            console.log("\nEvent:initBufferQueueReady trigger");

                            Main.fireEvent("initBufferQueueReady");
                        }
                    };
                }(i));
            }
        }
    };

    //public api
    window[TTS] = window[TTS] ||
    {
       module: function(name, func){
            Main.module(name, func);
       },
       init: function(){
            Main.init();
       },

       //read text
       read: function(word){
            Main.read(word);
       },

       ready: function(func){
            Main.ready(func);
       }
    };

    //add module_d
    window.$AM_d = window.$AM_d || 
    function(name, func){
        Main.module(name, func);
    };

})("webVoice");
