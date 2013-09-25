(function() {
    //公共元素
    var pub = {
        tab: byClass("main-table")[0],
        closeBtns: byClass("closeBtn"),
        allBtn: byId("allBtn"),
        delBtn: byId("delBtn"),
        refBtn: byId("refBtn"),
        sendBtn: byId("sendBtn"),
        details: byId("details"),
        sendMsg: byId("sendMsg"),
        inputNum: byId("inputNum"),
        submitMsg: byId("submitMsg"),
        delAllBtn: byId("allDelBtn"),
        tipInfo: byId("tipInfo"),
        main: byId("main"),
        msgCount: 0,
        delArr: [],
        trigger: false, 	//加载图片开关
        url: 'http://localhost/SendMessage/GetXml.aspx'
    };

    //公共函数
    function byId(ele, baseEle) {
        return (baseEle || document)['getElementById'](ele);
    }
    function byClass(name) {
        if (document.getElementsByClassName) {
            return document.getElementsByClassName(name);
        } else {
            //解决lte IE8没有class方法		    
            var children = document.getElementsByTagName('*'),
	        	elements = [];
            for (var i = 0, len1 = children.length; i < len1; i++) {
                var child = children[i],
	            	names = child.className.split(' ');
                for (var j = 0, len2 = names.length; j < len2; j++) {
                    if (names[j] == name) {
                        elements.push(child);
                        break;
                    }
                }
            }
            return elements;
        }
    }
    function byTag(tag) {
        return document.getElementsByTagName(tag);
    }
    //去除两端空格
    function trim(str) {
        return str.replace(/^\s*|\s*$/, '');
    }
    //事件注册cross-browser
    function addEvent(element, eventType, eventHandler) {
        element.addEventListener ? element.addEventListener(eventType, eventHandler, false) :
		element.attachEvent ? element.attachEvent(("on" + eventType), eventHandler) : (element["on" + eventType] = eventHandler);
    }
    function removeEvent(element, eventType, eventHandler) {
        element.removeEventListener ? element.removeEventListener(eventType, eventHandler, false) :
		element.detachEvent ? element.detachEvent(("on" + eventType), eventHandler) : (element["on" + eventType] = null);
    }
    //添加CSS类
    function addClass(newClass, ele) {
        ele.className = ele.className ? newClass : ele.className + " " + newClass;
    }
    //检测对象类型
    function checkType(obj) {
        return Object.prototype.toString.call(obj).slice(8, -1);
    }
    //查询字符串编码，以防类型错误
    function addQueryString(url, name, value) {
        url.indexOf("?") == -1 ? (url += "?") : (url += "&");
        url += encodeURIComponent(name) + "=" + encodeURIComponent(value);
        return url;
    }
    //通过Id模糊查询元素
    function queryById(id) {
        var all = document.getElementsByTagName("*"), len = all.length, eles = [];
        for (var i = 0; i < len; i++) {
            if (all[i].id.indexOf('checkbox') > -1) {
                eles.push(all[i]);
            }
        }
        return eles;
    }
    //ie中getElementsByTagName函数
    function getByTagName(tag) {
        var children = document.getElementsByTagName('*'),
	        elements = [];
        for (var i = 0, len = children.length; i < len; i++) {
            if (children[i].tagName == trim(tag).toUpperCase()) {
                elements.push(children[i]);
            }
        }
        return elements;
    }

    //自定义的Ajax对象
    var AjaxObj = {
        //解析XML
        parserXml: function(xml) {
            var xmldom = null;
            if (typeof DOMParser != "undefined") {
                xmldom = (new DOMParser()).parseFromString(xml, "text/xml");
                var errors = xmldom.getElementsByTagName("parsererror");
                if (errors.length != 0) {
                    throw new Error("XML parsing error: " + errors[0].textContent);
                }
            } else if (document.implementation.hasFeature("LS", "3.0")) {
                var implementation = document.implementation;
                var parser = implementation.createLSParser(implementation.MODE_SYNCHRONOUS, null);
                var input = implementation.createLSInput();
                input.stringData = xml;
                xmldom = parser.parse(input);
            } else if (typeof ActiveXObject != "undefined") {
                xmldom = createDocument();
                xmldom.loadXML(xml);
                if (xmldom.parseError != 0) {
                    throw new Error("XML parsing error: " + xmldom.parseError);
                } else {
                    throw new Error("No XML parser available");
                }
            }
            return xmldom;
        },

        //自定义解析字符串
        parseMethod: function(str) {
            str = str.replace(/\"/g, '&quot;');
            var reg1 = /\&quot;\d+\&quot;/g, result = [],
            r1 = /\<SMSMessage[^\<]*/g, r2 = /\<SendTime\>[^\<]*/g, r3 = /\<PhoneNumber\>[^\<]*/g,
            r4 = /\<Content\>[^\<]*/g;
            var r1Arr = [], r2Arr = [], r3Arr = [], r4Arr = [];
            r1Arr = str.match(r1);
            r2Arr = str.match(r2);
            r3Arr = str.match(r3);
            r4Arr = str.match(r4);
            var len = r1Arr && r1Arr.length;
            for (var i = 0; i < len; i++) {
                var index = r1Arr[i].match(reg1).toString().match(/\d+/g).toString();
                var sTime = r2Arr[i].slice(10);
                var pNum = r3Arr[i].slice(13);
                var content = r4Arr[i].slice(9);
                var tmp = {
                    index: index,
                    SendTime: sTime,
                    PhoneNumber: pNum,
                    Content: content
                };
                result.push(tmp);
            }

            //按日期进行排序排序
            result.sort(function(a, b) {
                //console.log(b.SendTime.replace(/[T\-\/\:\s]*/g, "") - 0);
                return (a.SendTime.replace(/[T\-\/\:\s]*/g, "") - 0) - (b.SendTime.replace(/[T\-\/\:\s]*/g, "") - 0);
            });
            return result;
        },
        //创建XHR
        createXHR: function() {
            if (typeof XMLHttpRequest != "undefined") {
                return new XMLHttpRequest();
            } else if (typeof ActiveXObject != "undefined") {
                var vers = ["MSXML2.XMLHttp.6.0", "MSXML2.XMLHttp.3.0"];
                for (var i = 0, len = vers.length; i < len; i++) {
                    try {
                        var xhr = new ActiveXObject(vers[i]);
                        return xhr;
                    } catch (ex) {
                        alert("Function createXHR error: " + ex.message);
                    }
                }
            } else {
                throw new Error("No XHR object available.");
            }
        },

        //加载图标toggle
        reqProgress: function(trigger) {
            var p = byId("progress");
            trigger ? (p.style.display = "block") : (p.style.display = "none");
            //p.focus();
        },

        sendHandler: function() {
            pub.tipInfo.innerHTML = "Send successful, have cost a dime";
        },

        //启动XHR
        startReq: function(url, type, isAsy) {
            type = type || 'GET', isAsy = isAsy === undefined ? true : isAsy;

            var xhr = AjaxObj.createXHR();
            if (!xhr) { return; }
            //在url上增加随机数，可解缓存问题
            url = addQueryString(url, "t", Math.random());
            xhr.open(type, url, isAsy);
            xhr.onreadystatechange = resHandler;

            function resHandler() {
                if (xhr === null || xhr === undefined) { return; }
                if (xhr.readyState == 1) {
                    AjaxObj.reqProgress(true);
                    grayBtn(true);
                    type == "PUT" && (pub.tipInfo.innerHTML = "Send in ...");
                } else if (xhr.readyState == 2) {
                    AjaxObj.reqProgress(true);
                    grayBtn(true);
                    type == "PUT" && (pub.tipInfo.innerHTML = "Send in ...");
                } else if (xhr.readyState == 4) {
                    if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304) {

                        var resText = xhr.responseText;

                        if (resText.indexOf('Return response status:') > -1 || resText.indexOf('Connect the background exception,') > -1) {
                            //alert(xhr.responseText);
                            throw new Error(xhr.responseText);
                            AjaxObj.reqProgress(false);
                            grayBtn(false);
                        } else if (resText == 'Deleted successfully') {
                            for (var k = 0, len1 = pub.delArr.length; k < len1; k++) {
                                var delEle = byId(pub.delArr[k]);
                                delEle.parentElement.removeChild(delEle);
                            }
                            pub.msgCount = pub.msgCount - len1;
                            pub.delArr = [];
                        } else if (resText == 'All deleted successfully') {
                            browser.isIE ? (pub.tab.outerHTML = "<table class='main-table'></table>") :
							(pub.tab.innerHTML = '');
                            pub.msgCount = 0;
                            if (parseInt(browser.ieVer) === 8) { location.reload(); }
                        } else if (resText == 'Send message successfully') {
                            pub.msgCount++;
                            //refreshTab();
                        } else {
                            var i = 0, index = '', phoneNum = '', sendTime = '', content = '',
                            result = resText != "" ? AjaxObj.parseMethod(resText) : '',

						    len = result.length;
                            pub.msgCount = len;

                            var strTable = '';
                            for (; i < len; i++) {
                                var tmp = result[i];
                                index = tmp.index;
                                phoneNum = tmp.PhoneNumber;
                                sendTime = tmp.SendTime;
                                content = tmp.Content;

                                //转换时间格式
                                var arr = sendTime.split('T'),
							    d = arr[0].indexOf('-') > -1 ? arr[0].split('-') : arr[0].split('/'), 	//date
							    m = d[1] > 9 ? d[1] : '' + d[1],
                                day = d[2] > 9 ? d[2] : '' + d[2];
                                sendTime = d[0] + "/" + m + "/" + day + " " + '&nbsp;' + arr[1];

                                strTable += createLine(index, phoneNum, sendTime, content);
                            }
                            //构建table结构
                            if (browser.isIE) {
                                strTable = "<table class='main-table'>" + strTable + "</table>";
                                pub.tab.outerHTML = strTable;
                            } else {
                                pub.tab.innerHTML = strTable;
                            }
                        }
                        type == "PUT" && AjaxObj.sendHandler();
                        AjaxObj.reqProgress(false);
                        grayBtn(false);
                        singleDel();
                        lightLine();
                        delete xhr;  //收到返回结果后手动删除
                        xhr = null;
                        pub.delArr = [];
                    } else {
                        AjaxObj.reqProgress(false);
                        grayBtn(false);
                        pub.delArr = [];
                        throw new Error("Request was unsuccessful: " + xhr.responseText + ", status code: " + xhr.status);
                    }
                }
            }
            xhr.overrideMimeType !== undefined && xhr.overrideMimeType("text/plain; charset=utf-8");
            xhr.send(null);
        }
    };

    //浏览器检测，尽可能跨浏览器兼容
    var browser = {
        isOpera: !!window.opera || navigator.userAgent.indexOf('Opera') >= 0,
        isFirefox: typeof InstallTrigger !== 'undefined',
        isSafari: Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0,
        isChrome: !!window.chrome,
        isIE: /*@cc_on!@*/false,
        ieVer: (function() {
            navigator.userAgent.toLowerCase().search(/msie ([\d.]+)/);
            return RegExp["$1"];
        })()
    };

    //灰掉按钮，避免重复提交
    function grayBtn(tri) {
        tri = tri ? "disabled" : null;
        pub.allBtn.disabled = tri;
        pub.delAllBtn.disabled = tri;
        pub.delBtn.disabled = tri;
        pub.refBtn.disabled = tri;
        pub.sendBtn.disabled = tri;
    }

    /*********** 功能按钮实现模块 *************/
    //全选功能按钮
    function allSelected(e) {
        var checkboxs = browser.isIE ? queryById("checkbox") : pub.tab.getElementsByTagName('input'),
			i = 0, len = checkboxs.length, style;
        for (; i < len; i++) {
            style = checkboxs[i].parentElement.parentElement.style;
            if (pub.trigger) {
                checkboxs[i].checked = true;
                style.backgroundColor = browser.isIE ? "#FFAA6D" : "rgba(255,114,13,0.6)";
                style.color = "#fff";
            } else {
                checkboxs[i].checked = false;
                style.backgroundColor = "#fff";
                style.color = "#638DA3";
            }
        }
    }

    //勾选行高亮处理程序
    function lightLineHandler1(e) {
        //alert("ok");
        e = e || window.event;
        var target = e.target || e.srcElement;
        e.stopPropagation ? e.stopPropagation() : (e.returnValue = false);
        style = target.parentElement.parentElement.style;
        if (!target.previousElementSibling.checked) {
            style.backgroundColor = "rgba(255,114,13,0.6)";
            style.color = "#fff";
        } else {
            style.backgroundColor = "#fff";
            style.color = "#638DA3";
        }
    }
    function lightLineHandler2(e) {
        e = e || window.event;
        var target = e.target || e.srcElement;
        //e.stopPropagation ? e.stopPropagation() : (e.returnValue = false);
        style = target.parentElement.parentElement.style;
        if (target.checked) {
            style.backgroundColor = "#FFAA6D";
            style.color = "#fff";
        } else {
            style.backgroundColor = "#fff";
            style.color = "#638DA3";
        }
    }

    //勾选行高亮函数
    function lightLine() {
        var labels, i = 0, len, style, checkboxs;
        if (!browser.isIE) {
            labels = pub.tab.getElementsByTagName('label');
            len = labels.length;
            for (; i < len; i++) {
                removeEvent(labels[i], "click", lightLineHandler1);
                addEvent(labels[i], "click", lightLineHandler1);
            }
        } else {
            checkboxs = queryById("checkbox");
            len = checkboxs.length;
            for (var j = 0; j < len; j++) {
                removeEvent(checkboxs[j], "click", lightLineHandler2);
                addEvent(checkboxs[j], "click", lightLineHandler2);
            }
        }
    }

    //单行删除处理程序
    function deleteLineHandler(e) {
        if (window.confirm("确定要删除信息吗？")) {
            e = e || window.event;
            e.stopPropagation ? e.stopPropagation() : (e.returnValue = false);
            var target = e.target || e.srcElement, p;

            //判断是否是tr元素
            if (!browser.isIE) {
                p = checkType(target.parentElement) === 'HTMLTableRowElement' ? target.parentElement :
					checkType(target.parentElement.parentElement) === 'HTMLTableRowElement' ? target.parentElement.parentElement :
					checkType(target.parentElement.parentElement.parentElement) === 'HTMLTableRowElement' ? target.parentElement.parentElement.parentElement : undefined;
            } else {
                p = target.parentElement.tagName == 'TR' ? target.parentElement :
					target.parentElement.parentElement.tagName == "TR" ? target.parentElement.parentElement :
					target.parentElement.parentElement.parentElement.tagName == "TR" ? target.parentElement.parentElement.parentElement : undefined;
            }

            var i = p.rowIndex,
				index = p.attributes.id.value;

            //将url进行编码
            var url = pub.url + '/' + index;

            AjaxObj.startReq(url, 'DELETE');
            pub.delArr.push(index);
        }
    }

    //单行删除事件
    function singleDel() {
        var dels = byClass('close'), len = dels.length, i = 0;
        for (; i < len; i++) {
            //防止重复绑定，多次触发
            removeEvent(dels[i], "click", deleteLineHandler);
            addEvent(dels[i], "click", deleteLineHandler);
        }
    }

    //勾选删除功能
    function deleteMult() {
        var seboxs = pub.tab.getElementsByTagName("input"),
		 i = 0, len, url = pub.url, count = 0, j = 0, p;

        browser.isIE && (seboxs = queryById('checkbox'));
        len = seboxs.length;

        //判断是否有勾选项
        var has = (function() {
            for (; i < len; i++) {
                if (seboxs[i].checked) {
                    count++;
                }
            }
            return count;
        })();

        if (has <= 0) { return; }
        if (window.confirm("确定删除 " + count + " 条信息吗？")) {
            for (; j < len; j++) {
                p = seboxs[j].parentElement.tagName == 'TR' ? seboxs[j].parentElement :
						seboxs[j].parentElement.parentElement.tagName == "TR" ? seboxs[j].parentElement.parentElement :
						seboxs[j].parentElement.parentElement.parentElement.tagName == "TR" ? seboxs[j].parentElement.parentElement.parentElement : undefined;

                if (!p) { return; }
                if (seboxs[j].checked) {
                    var index = p.attributes.id.value;
                    var url = pub.url + '/' + index;

                    //要删除的勾选行暂存数组
                    pub.delArr.push(index);
                    AjaxObj.startReq(url, 'DELETE');
                    //grayBtn(true);
                }
            }
        }
    }

    //刷新table
    function refreshTab() {
        grayBtn(true);
        AjaxObj.startReq(pub.url);
    }

    //删除所有
    (function deleteAll() {
        var has = document.getElementsByTagName('td');

        var btn = pub.delAllBtn;
        addEvent(btn, "click", function(e) {
            e = e || window.event;
            e.stopPropagation ? e.stopPropagation() : (e.returnValue = false);
            if (has.length > 0) {
                if (has && window.confirm("确定 " + pub.msgCount + " 条全部删除吗？")) {
                    AjaxObj.startReq(pub.url, 'DELETE');
                    //grayBtn(true);                                        
                }
            }
        });
    })();

    function createLine(i, p, t, c, c1) {
        var str = '';
        c1 = c1 != undefined || '';
        str = "<tr id='" + i + "'>" +
			"<td><input id='checkbox" + i + "' type='checkbox' /><label for='checkbox" + i + "'></label></td>" +
			"<td class='td-phonenum'>" + p + "</td>" +
			"<td class='td-content'><div>" + c + "</div></td>" +
			"<td class='td-sendtime'>" + t + "</td>" +
			"<td><div class='close'><div></div><div></div></div></td></tr>";

        return str;
    }

    //检测手机号码
    function checkNum(str) {
        str = trim(str);
        var reg = /^1[\d]{10}/;
        return reg.test(str);
    }

    //刷新按钮事件
    addEvent(pub.refBtn, "click", function(e) {
        if (parseInt(browser.ieVer) === 8) {
            location.reload();
        } else {
            refreshTab();
        }
        e = e || window.event;
        e.stopPropagation ? e.stopPropagation() : (e.returnValue = false);
    });

    //鼠标悬浮
    addEvent(pub.tab, "mouseover", function(e) {
        e = e || window.event;
        var target = e.target || e.srcElement,
		p = target.parentElement.tagName == 'TR' ? target.parentElement :
					target.parentElement.parentElement.tagName == "TR" ? target.parentElement.parentElement :
					target.parentElement.parentElement.parentElement.tagName == "TR" ? target.parentElement.parentElement.parentElement : undefined;

        if (p) {
            var color = p.style.backgroundColor;
            if (color != "#FFAA6D" && color != "rgba(255, 114, 13, 0.6)") {
                p.style.backgroundColor = "#eaeff3";
            }
        }
    });
    addEvent(pub.tab, "mouseout", function(e) {
        e = e || window.event;
        var target = e.target || e.srcElement,
		p = target.parentElement.tagName == 'TR' ? target.parentElement :
					target.parentElement.parentElement.tagName == "TR" ? target.parentElement.parentElement :
					target.parentElement.parentElement.parentElement.tagName == "TR" ? target.parentElement.parentElement.parentElement : undefined;

        if (p) {
            var color = p.style.backgroundColor;
            (color != "#FFAA6D" && color != "rgba(255, 114, 13, 0.6)") && (p.style.backgroundColor = "#fff");
        }
    });

    //全选按钮事件注册
    addEvent(pub.allBtn, "click", function(e) {
        e = e || window.event;
        //阻止事件冒泡
        e.stopPropagation ? e.stopPropagation() : (e.returnValue = false);
        pub.trigger = pub.trigger ? false : true;
        allSelected();
    });

    //多选删除功能事件
    addEvent(pub.delBtn, "click", function(e) {
        e = e || window.event;
        //阻止事件冒泡
        e.stopPropagation ? e.stopPropagation() : (e.returnValue = false);
        deleteMult();
    });

    //页面加载事件
    addEvent(window, "load", function() {
        AjaxObj.reqProgress(true);
        setTimeout(refreshTab, 100);
    });

    //双击显示详情
    function dbclickHandler(e) {
        e = e || window.event;
        var target = e.target || e.srcElement,
			p = target.parentElement.tagName == 'TR' ? target.parentElement :
				target.parentElement.parentElement.tagName == "TR" ? target.parentElement.parentElement :
				target.parentElement.parentElement.parentElement.tagName == "TR" ? target.parentElement.parentElement.parentElement : undefined;
        tds = p.getElementsByTagName('td'),
			phoneNum = tds[1].innerHTML,
			content = tds[2].firstChild.innerHTML,
			sendTime = tds[3].innerHTML,
			doc = document;
        //阻止事件冒泡
        e.stopPropagation ? e.stopPropagation() : (e.returnValue = false);
        grayBtn(true);

        var details = pub.details, dePhoneNum = doc.getElementById("dePhoneNum"),
			deContent = doc.getElementById("deContent"), deSendTime = doc.getElementById("deSendTime");
        details.style.display = "block";
        dePhoneNum.innerHTML = phoneNum;
        deContent.innerHTML = content;
        deSendTime.innerHTML = sendTime;
    }
    addEvent(pub.main, "dblclick", dbclickHandler);

    //发送短信窗口
    addEvent(pub.sendBtn, "click", function(e) {
        e = e || window.event;
        //阻止事件冒泡
        e.stopPropagation ? e.stopPropagation() : (e.returnValue = false);
        grayBtn(true);
        pub.sendMsg.style.display = "block";
        pub.tipInfo.innerHTML = "SMS will be charged";
        pub.inputNum.value = "";
        pub.inputNum.maxLength = 11;
        pub.inputNum.focus();
    });

    //弹出界面关闭按钮事件
    for (var index in pub.closeBtns) {
        addEvent(pub.closeBtns[index], "click", function() {
            grayBtn(false);
            pub.tipInfo.innerHTML = '';
            pub.details.style.display = "none";
            pub.sendMsg.style.display = "none";
        });
    }

    //关闭弹出窗口
    //if (!browser.isie) {
    //addevent(document, "click", function(e) {
    //graybtn(false);
    //pub.tipinfo.innerhtml = '';
    //pub.details.style.display = "none";
    //pub.sendmsg.style.display = "none";
    //});
    //}

    //防止弹出框事件冒泡
    addEvent(pub.sendMsg, "click", function(e) {
        e = e || window.event;
        e.stopPropagation ? e.stopPropagation() : (e.returnValue = false);
    });
    addEvent(pub.details, "click", function(e) {
        e = e || window.event;
        e.stopPropagation ? e.stopPropagation() : (e.returnValue = false);
    });

    //send按钮事件
    addEvent(pub.submitMsg, "click", function() {
        var msg = pub.inputNum.value, info = pub.tipInfo, url,
			isOk = checkNum(msg);

        if (isOk) {
            var url = addQueryString(pub.url, "PhoneNumber", msg);
            AjaxObj.startReq(url, 'PUT');
            AjaxObj.reqProgress(true);
            info.innerHTML = "Send in ...";
            setTimeout(refreshTab, 30);
        } else {
            info.innerHTML = "Invaild input";
        }
    });

    //控制输入长度和字符
    addEvent(pub.inputNum, "keypress", function(e) {
        e = e || window.event;
        var target = e.target || e.srcElement;
        charCode = typeof e.charCode == 'number' ? e.charCode : e.keyCode;

        if (!/[\d]/.test(String.fromCharCode(charCode))) {
            pub.tipInfo.innerHTML = "Invaild input";
            e.preventDefault ? e.preventDefault() : (e.returnValue = false);
        }
    });

    //验证粘贴板输入信息,FF不支持
    addEvent(pub.inputNum, "paste", function(e) {
        e = e || window.event;
        var clipboardData = e.clipboardData || window.clipboardData;
        var text = clipboardData.getData("text") || clipboardData.getData("text/plain");
        if (!checkNum(text)) {
            pub.inputNum.value = "13438912202";
            e.preventDefault ? e.preventDefault() : (e.returnValue = false);
        }
    });

    return AjaxObj;
})();