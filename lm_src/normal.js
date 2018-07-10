// date format util
Date.prototype.Format = function (fmt) { //author: meizz 
var o = {
    "M+": this.getMonth() + 1, //月份 
    "d+": this.getDate(), //日 
    "h+": this.getHours(), //小时 
    "m+": this.getMinutes(), //分 
    "s+": this.getSeconds(), //秒 
    "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
    "S": this.getMilliseconds() //毫秒 
};
if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
for (var k in o)
if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
return fmt;
}

// str format util
// https://www.cnblogs.com/amylis_chen/p/5065977.html
String.prototype.format = function(args)
{
    if (arguments.length > 0)
    {
        var result = this;
        if (arguments.length == 1 && typeof (args) == "object")
        {
            for (var key in args)
            {
                var reg = new RegExp("({" + key + "})", "g");
                result = result.replace(reg, args[key]);
            }
        }
        else
        {
            for (var i = 0; i < arguments.length; i++)
            {
                if (arguments[i] == undefined)
                {
                    return "";
                }
                else
                {
                    var reg = new RegExp("({[" + i + "]})", "g");
                    result = result.replace(reg, arguments[i]);
                }
            }
        }
        return result;
    }
    else
    {
        return this;
    }
}