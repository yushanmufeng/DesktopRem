// 北京时间钟表
console.log('[module] init beijingTimeClock');

let	request = require('request');

class BeijingTimeModule {

	constructor(){
       this._chinaDate = null;
       this._resetCount = 0;
    }

   	startTimer(onChangeCallback){
   		this.onChangeCallback = onChangeCallback;
   		this.resetBeijingTime();

   		setInterval(()=>{
   			if(this._chinaDate){
			  this._chinaDate = new Date(this._chinaDate.getTime() + 1000);
			}
			this._resetCount ++;
			if(this._resetCount == 3600){
				this._resetCount = 0;
				this.resetBeijingTime();
			}
			if(this.onChangeCallback){
				this.onChangeCallback(this._chinaDate);
			}
   		}, 1000);
   	}

   	resetBeijingTime(){
   		
		// 在线api获取北京时间
		// 淘宝 http://api.m.taobao.com/rest/api3.do?api=mtop.common.getTimestamp
		// 苏宁 http://quan.suning.com/getSysTime.do
		// 腾讯 http://cgi.im.qq.com/cgi-bin/cgi_svrtime
		request({url:'http://api.m.taobao.com/rest/api3.do?api=mtop.common.getTimestamp',gzip:true}, (error, response, body)=>{
			if (!error && response.statusCode == 200) {
			  console.log('[module] request beijing time success');
			  let resObj = JSON.parse(response.body);
			  this._chinaDate = new Date(parseInt(resObj.data.t));
			}else{
			  console.log('[module] request beijing time faild');
			}
		});
	}
}

module.exports = BeijingTimeModule;
