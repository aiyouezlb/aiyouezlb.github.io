(function($){
    var PopUpWin = function(ele,opts){
        opts = $.extend({
            id:'',
            content:undefined,//内容
            closeCallback:undefined//关闭时调用的方法
        },opts);
        this.init(ele,opts);
    }

    PopUpWin.prototype = {
        template:
            '<div class="pop-wraper" id="{id}">\
                <div class="pop-outer">\
                    <div class="pop-inner">\
                        <div class="pop-content">\
                          {content}\
                        </div>\
                        <div class="btn btn_cancel"><i class="ico_cancel"></i></div>\
                    </div>\
                </div>\
            </div>',
        init:function(ele,opts){
            this.render(ele,opts);
            this.initEvent(ele,opts);
        },
        initEvent:function(ele,opts){
            var self = this;
            ele.find('.btn_cancel').click(function(){
                ele.find('#'+self.id).remove();
                if(opts.closeCallback !== undefined && $.isFunction(opts.closeCallback)){
                    opts.closeCallback();
                }
            });
        },
        elId:function(){//自动生成7位8进制DOM元素ID
            return 'win-xxx'.replace(/[x]/g,function(c){
                var r = Math.random() * 16|0, v = c === 'x' ? r : (r&0x3|0x8);
                return v.toString(8);
            }).toLocaleLowerCase();
        },
        render:function(ele,opts){
            if(ele === undefined){
                ele = $('body');
            }
            
            var content = opts.content;
            this.id = this.elId();
            //var orderId = "123456";
            //var orderMoney = 50;
            if($.isFunction(content)){
                content  = content(this);
            }
            tpl = this.template.replace(/\{id\}/,this.id).replace(/\{content\}/,content);
            //tpl = this.template.replace(/\{id\}/,this.id).replace(/\{content\}/,content).replace(/\{orderMoney\}/,orderMoney).replace(/\{orderId\}/,orderId);
            ele.append(tpl);
        }
    };

    $.fn.popUpWin = function(opts){
        return this.each(function(){
             var that = $(this);
             var popUp = new PopUpWin(that,opts);
        });
    };

})(jQuery);

//二维码处理
(function(win,$){
    win.QRLogin = {};
    win.code = 408;
    

    var QRCode = function(opts){
        opts = $.extend({
            qrCodeData:{
                _:(''+Math.random() * 10).substr(2)
            },
            qrUrl:'',//请求UUID的URL地址
            qrImgUrl:'',//请求验证码的URL地址
            statusUrl:'',//请求状态验证的URL地址
            uuid:'',
            msg:'',
            tilMsg:{
                'qr_default':'请使用微信扫描<br/>二维码以完成支付',
                'qr_succ':'扫描成功<br/>请在手机确认支付',
                'pay_error':'无法支付<br/>商品金额大于银行卡快捷支付限额',
                'pay_succ':'支付成功'
            },
            qrCodeClose:false
        },opts);
        this.init(opts);
    };

    QRCode.prototype = {
        qrTimeout:null,
        init:function(opts){
    	
            var param = this.urlParam(opts.qrUrl), self = this;
            this.opts = opts;
            this.appid = param['appid'];
            this.req_key = param['req_key'];
            this.changeQrcode();
        },
        urlParam:function(query){
            var result = {};
            query.replace(/(\w+)=(\w+)/ig,function(a,b,c){
                if(b !== undefined)
                    result[b] = c;
            });
            return result;
        },
        changeQrcode:function(){
            var self = this;
            $.ajax({
                url:self.opts.qrUrl,
                type:'GET',
                dataType:'script',
                data:{
                    _:self.random()
                },
                cache:false,
                success:function(data){
                    _code = win.QRLogin.code;
                    _uuid = win.QRLogin.uuid;
                    //alert(_uuid);
                    if(_code == 200 && win.QRLogin.uuid && self.opts.qrCodeClose === false){
                        //self.opts.uuid = win.QRLogin.uuid;
                        var src = self.opts.qrImgUrl+'&uuid='+_uuid+'&_='+self.random();
                        //alert(src);
                        if(self.popWin === undefined){
                        	$("#result").attr("src",src)
                            
                        }else{
                            $('div.pop-wraper img').attr('src',src);
                        }
                        //alert(444)
                        self._poll(_uuid);
                        
                    }else{
                        self.restart();
                    }
                },
                error:self.restart
            });
        },
        restart:function(){
            var self = this;
            clearTimeout(this.qrTimeout);
            this.qrTimeout = setTimeout(function(){
                $.proxy(self.changeQrcode, self);
            },10 * 1000);
        },
        _poll:function(tuuid){
        	//alert(5555)
            var self = this, pollUUID = win.QRLogin.uuid;
            //console.log(pollUUID);
            window.debug = self.succCallback;
            //console.log(pollUUID,1,self.random(),win.code)
            $.ajax({
                url:self.opts.statusUrl,
                type:'GET',
                dataType:'script',
                data:{
                    uuid:pollUUID,
                    tip: 1,
                    _:self.random(),
                    code:win.code
                },
                cache:false,
                timeout:33*1000,//后台是30s
                success:function () {
                	//alert(6666)
                    if(!win.code){
                        self.repoll.call(self,[pollUUID]);
                        return;
                    }
                    self.succCallback(win.code,pollUUID);
                },
                error:function(){
                    self.repoll.call(self,[pollUUID]);
                }
            });
        },
        succCallback:function(code,pollUUID){
            var self = this;
            switch(code){
                    case 408://扫描未知
                    case 200:
                        self.repoll(pollUUID);
                        break;
                    case 203://扫描成功
                        //clearInterval(self.qrInterval);
                        self.changePayInfo('qr_succ');
                        self.repoll(pollUUID);;
                       
                        break;
                    case 205://扫描成功——取消
                        self.changePayInfo('qr_default');
                        self.repoll(pollUUID);
                        break;
                    case 204://支付未知
                        self.repoll(pollUUID);
                        break;
                    case 201://支付成功
                        self.changePayInfo('pay_succ');
                        //这里可以写成功的业务
                        //3秒后跳到指定网址
                        var _superorderid = document .getElementById("_superorderid").value;
                        var _tradeUrl = document .getElementById("_tradeUrl").value;
                        //setTimeout(function(){window.location.href="http://www.7881.com/payment/endPayout.action?orderid="+_superorderid+"&from="},3000);
                        setTimeout(function(){window.location.href=_tradeUrl},3000);
                        break;
                    case 202://支付失败
                        self.changePayInfo('pay_error');
                        break;
                    case 400://uuid失效
                        self.changeQrcode();
                        break;
                    default:
                        self.repoll(pollUUID);
            }
        },
        repoll:function(pollUUID){
            var self = this;
           /* if(pollUUID !== self.opts.uuid){
                return;
            }*/
            if(self.opts.qrCodeClose === true){
                return;
            }
            setTimeout(function(){
                self._poll.call(self);
            }, 1000);
        },
        changePayInfo:function(clazz){
            var codeMsgWrapper = $('div.pop-wraper .msg_default_box');
            if(codeMsgWrapper.size() > 0 && clazz !== undefined){
                codeMsgWrapper.attr('class','msg_default_box '+clazz);
                codeMsgWrapper.find('p').html(this.opts.tilMsg[clazz]);
            }
        },
        random:function(){
            return (''+Math.random() * 10).substr(2);
        }
    };

    win.QRCode = QRCode || {};
    $.fn.load = function( url, params, callback ) {
        if ( typeof url !== "string" && _load ) {
            return _load.apply( this, arguments );
        }

        var selector, type, response,
            self = this,
            off = url.indexOf(" ");

        if ( off >= 0 ) {
            selector = jQuery.trim( url.slice( off ) );
            url = url.slice( 0, off );
        }

        if ( jQuery.isFunction( params ) ) {
            callback = params;
            params = undefined;

        } else if ( params && typeof params === "object" ) {
            type = "POST";
        }

        if ( self.length > 0 ) {
            jQuery.ajax({
                url: url,
                type: type,
                dataType: "html",
                async:true,
                data: params
            }).done(function( responseText ) {
                response = arguments;
                self.html( selector ?
                    jQuery("<div>").append( jQuery.parseHTML( responseText ) ).find( selector ) :
                    responseText );

            }).complete( callback && function( jqXHR, status ) {
                self.each( callback, response || [ jqXHR.responseText, status, jqXHR ] );
            });
        }

        return this;
    };
})(window,jQuery);

