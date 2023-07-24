/*jshint unused:false,evil:true*/
/*global escape,unescape*/

/* Global objects & functions */
if (typeof isDefined !== "function")
    isDefined = function (obj)
    {
        return obj !== undefined && obj !== null && typeof obj !== 'undefined';
    };
if (typeof isNullOrEmpty !== "function")
    isNullOrEmpty = function (str)
    {
        return !isDefined(str) || str.toString().trim() === '';
    };
if (typeof isNonZeroNumber !== "function")
    isNonZeroNumber = function (obj)
    {
        return isDefined(obj) && typeof obj === 'number' && !isNaN(obj) && obj !== 0;
    };

if (typeof parseNumber !== "function")
    parseNumber = function (str, def, dec)
    {
        if (!def)
            def = 0;
        if (!dec)
            dec = 0;
        if (str == null)
            return def.round(dec);
        let tmp = parseFloat(typeof str == "string" ? str.replace(/\,/g, '.') : str);
        return (isNaN(tmp) ? def : tmp).round(dec);
    };
if (typeof parseBoolean !== "function")
    parseBoolean = function (val)
    {
        if (val == null)
            return false;
        if (typeof val === 'boolean')
            return (val === true);
        if (typeof val === 'string')
            return (/^\s*(true|1|on|yes)\s*$/i).test(val);
        return false;
    };
if (typeof parseBooleanAsNumber !== "function")
    parseBooleanAsNumber = function (val)
    {
        let res = false;
        if (typeof val === 'boolean')
            res = (val === true);
        if (typeof val === 'string')
            res = (/^\s*(true|1|on|yes)\s*$/i).test(val);
        return res ? 1 : 0;
    };
if (typeof getRandomInt !== "function")
    getRandomInt = function (min, max)
    {
        return Math.floor(Math.random() * (max - min)) + min;
    };
if (typeof isFrame !== "function")
    isFrame = function ()
    {
        return isDefined(window.frameElement) || window.self !== window.parent;
    };
if (typeof escapeHTML !== "function")
    escapeHTML = function (str)
    {
        return isNullOrEmpty(str) ? '' : str
            .replace(/&/g, '&amp;')
            .replace(/>/g, '&gt;')
            .replace(/</g, '&lt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    };
if (typeof unescapeHTML !== "function")
    unescapeHTML = function (str)
    {
        return isNullOrEmpty(str) ? '' : str
            .replace(/&amp;/g, '&')
            .replace(/&gt;/g, '>')
            .replace(/&lt;/g, '<')
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, '\'');
    };
if (typeof getExtension !== "function")
    getExtension = function (path)
    {
        if (path == null)
            return '';
        let dot = path.trim().lastIndexOf('.');
        return dot >= 0 ? path.substring(dot + 1) : '';
    };

if (typeof urlParams !== "object")
    this.urlParams = (function (url)
    {
        var result = new Object();
        var idx = url.lastIndexOf('?');
        if (idx > 0)
        {
            var params = url.substring(idx + 1).split('&');
            for (var i = 0; i < params.length; i++)
            {
                idx = params[i].indexOf('=');
                if (idx > 0)
                    result[params[i].substring(0, idx)] = params[i].substring(idx + 1);
            }
        }
        return result;
    })(this.location.href);


/* Polyfills */
Object.setPrototypeOf = Object.setPrototypeOf || function (obj, proto)
{
    if (obj.__proto__)
        obj.__proto__ = proto;
    else
    {
        for (var prop in proto)
            obj[prop] = proto[prop];
    }
    return obj;
};
Object.values = Object.values || function (obj)
{
    return Object.keys(obj).map(function (e)
    {
        return obj[e];
    });
};
Object.entries = Object.entries || function (obj)
{
    return Object.keys(obj).reduce(function (arr, key)
    {
        arr.push([key, obj[key]]);
        return arr;
    }, []);
};

Number.prototype.round = Number.prototype.round || function (places)
{
    const m = Math.pow(10, places);
    const res = Math.round((this + Number.EPSILON) * m) / m;

    if (res !== +Infinity && res !== -Infinity) {
        return res;
    }

    return this.toFixed(places);
};
Number.prototype.padStart = Number.prototype.padStart || function (length)
{
    return (this < 0 ? "-" : "") + ("0" + Math.abs(this)).slice(-length);
};

String.prototype.format = String.prototype.format || function ()
{
    let args = arguments;
    return this.replace(/{(\d+)}/g, function (match, number)
    {
        return args[number] != null ? args[number] : match;
    });
};
String.prototype.reverse = String.prototype.reverse || function ()
{
    return this.split("").reverse().join("");
};
String.prototype.startsWith = String.prototype.startsWith || function (searchString, position)
{
    position = position || 0;
    return this.indexOf(searchString, position) === position;
};
String.prototype.endsWith = String.prototype.endsWith || function (searchString, position)
{
    let subjectString = this.toString();
    position = position || subjectString.length;
    if (position > subjectString.length)
        position = subjectString.length;
    position -= searchString.length;
    let lastIndex = subjectString.indexOf(searchString, position);
    return lastIndex !== -1 && lastIndex === position;
};
String.prototype.trimStart = String.prototype.trimStart || function (delimiter)
{
    return this.trimFromStart(delimiter);
};
String.prototype.trimFromStart = String.prototype.trimFromStart || function (delimiter)
{
    if (isNullOrEmpty(delimiter))
        return this.replace(/^\s+/gm, '');

    let current = this;
    let index = this.length;
    while (current.startsWith(delimiter) && index >= 0)
    {
        current = current.substring(delimiter.length);
        index -= delimiter.length;
    }
    return current;
};
String.prototype.trimEnd = String.prototype.trimEnd || function (delimiter)
{
    return this.trimFromEnd(delimiter);
};
String.prototype.trimFromEnd = String.prototype.trimFromEnd || function (delimiter)
{
    if (isNullOrEmpty(delimiter))
        return this.reverse().replace(/^\s+/gm, '').reverse();

    let current = this;
    let index = this.length;
    while (current.endsWith(delimiter) && index >= 0)
    {
        let len = this.length - delimiter.length;
        current = current.substring(0, len);
        index -= len;
    }
    return current;
};
String.prototype.trimString = String.prototype.trimString || function (delimiter)
{
    if (isNullOrEmpty(delimiter))
        return this.trim();
    return this.trimFromStart(delimiter).trimFromEnd(delimiter);
};
String.prototype.insertAt = String.prototype.insertAt || function (index, string)
{
    return this.substr(0, index) + string + this.substr(index);
};
String.prototype.padStart = String.prototype.padStart || function (targetLength, padString)
{
    //floor if number or convert non-number to 0;
    targetLength = targetLength >> 0;
    padString = String(padString || ' ');
    if (this.length > targetLength)
        return String(this);
    else
    {
        targetLength = targetLength - this.length;
        if (targetLength > padString.length)
            padString += padString.repeat(targetLength / padString.length);
        return padString.slice(0, targetLength) + String(this);
    }
};
String.prototype.replaceAll = String.prototype.replaceAll || function (what, to)
{
    return this.replace(new RegExp(what, "ig"), to);
};
String.prototype.includes = String.prototype.includes || function (str)
{
    return this.indexOf(str) >= 0;
};

Array.prototype.find = Array.prototype.find || function (predicate)
{
    var o = Object(this);
    var len = o.length >>> 0;
    if (typeof predicate !== 'function')
        throw new TypeError('predicate must be a function');

    var thisArg = arguments[1];
    var k = 0;
    while (k < len)
    {
        var kValue = o[k];
        if (predicate.call(thisArg, kValue, k, o))
            return kValue;
        k++;
    }
    return undefined;
};
Array.prototype.findIndex || Object.defineProperty(Array.prototype, "findIndex", {
    value: function (r)
    {
        if (null == this)
            throw new TypeError('"this" is null or not defined');
        var e = Object(this), t = e.length >>> 0;
        if ("function" != typeof r)
            throw new TypeError("predicate must be a function");
        for (var n = arguments[1], i = 0; i < t;)
        {
            var o = e[i];
            if (r.call(n, o, i, e))
                return i;
            i++;
        }
        return -1;
    }, configurable: !0, writable: !0
});
Array.prototype.sortBy = Array.prototype.sortBy || function (p)
{
    return this.slice(0).sort(function (a, b)
    {
        return (a[p] > b[p]) ? 1 : (a[p] < b[p]) ? -1 : 0;
    });
};

Date.now = Date.now || function ()
{
    return new Date().getTime();
}
Date.prototype.addYears   = Date.prototype.addYears   || function (y)
{
    this.setYear(this.getYear() + y);
    return this;
};
Date.prototype.addMonths  = Date.prototype.addMonths  || function (m)
{
    this.setMonth(this.getMonth() + m);
    return this;
};
Date.prototype.addWeeks   = Date.prototype.addWeeks   || function (w)
{
    this.setDate(this.getDate() + w * 7);
    return this;
};
Date.prototype.addDays    = Date.prototype.addDays    || function (d)
{
    this.setDate(this.getDate() + d);
    return this;
};
Date.prototype.addHours   = Date.prototype.addHours   || function (h)
{
    this.setHours(this.getHours() + h);
    return this;
};
Date.prototype.addMinutes = Date.prototype.addMinutes   || function (mn)
{
    this.setMinutes(this.getMinutes() + mn);
    return this;
};
Date.prototype.addSeconds = Date.prototype.addSeconds || function (s)
{
    this.setSeconds(this.getSeconds() + s);
    return this;
};
Date.prototype.addMilliseconds = Date.prototype.addMilliseconds || function (ms)
{
    this.setMilliseconds(this.getMilliseconds() + ms);
    return this;
};

Date.prototype.beginOfDay = Date.prototype.beginOfDay || function ()
{
    this.setHours(0, 0, 0, 0);
    return this;
};
Date.prototype.toISOString = Date.prototype.toISOString || (function ()
{
    function pad(number)
    {
        var r = String(number);
        if (r.length === 1) 
            r = '0' + r;
        return r;
    }
    return function ()
    {
        return this.getUTCFullYear()
            + '-' + pad(this.getUTCMonth() + 1)
            + '-' + pad(this.getUTCDate())
            + 'T' + pad(this.getUTCHours())
            + ':' + pad(this.getUTCMinutes())
            + ':' + pad(this.getUTCSeconds())
            + '.' + String((this.getUTCMilliseconds() / 1000).toFixed(3)).slice(2, 5)
            + 'Z';
    };
}());

if (!window.localStorage)
    Object.defineProperty(window, 'localStorage', new (function ()
    {
        this.configurable = false;
        this.enumerable = true;

        let aKeys = [], oStorage = {};
        Object.defineProperty(oStorage, 'getItem',
            {
                value: function (sKey) { return sKey ? this[sKey] : null; },
                writable: false,
                configurable: false,
                enumerable: false
            });
        Object.defineProperty(oStorage, 'key',
            {
                value: function (nKeyId) { return aKeys[nKeyId]; },
                writable: false,
                configurable: false,
                enumerable: false
            });
        Object.defineProperty(oStorage, 'setItem',
            {
                value: function (sKey, sValue)
                {
                    if (sKey == null)
                        return;
                    document.cookie = escape(sKey) + '=' + escape(sValue) + '; expires=Tue, 01 Jan 2199 00:00:00 GMT; path=/';
                },
                writable: false,
                configurable: false,
                enumerable: false
            });
        Object.defineProperty(oStorage, 'length',
            {
                get: function () { return aKeys.length; },
                configurable: false,
                enumerable: false
            });
        Object.defineProperty(oStorage, 'removeItem',
            {
                value: function (sKey)
                {
                    if (sKey == null)
                        return;
                    document.cookie = escape(sKey) + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
                },
                writable: false,
                configurable: false,
                enumerable: false
            });
        this.get = function ()
        {
            let iThisIndx;
            for (let sKey in oStorage)
            {
                iThisIndx = aKeys.indexOf(sKey);
                if (iThisIndx === -1)
                    oStorage.setItem(sKey, oStorage[sKey]);
                else
                    aKeys.splice(iThisIndx, 1);

                delete oStorage[sKey];
            }

            for (aKeys; aKeys.length > 0; aKeys.splice(0, 1))
                oStorage.removeItem(aKeys[0]);

            for (let aCouple, iKey, nIdx = 0, aCouples = document.cookie.split(/\s*;\s*/); nIdx < aCouples.length; nIdx++)
            {
                aCouple = aCouples[nIdx].split(/\s*=\s*/);
                if (aCouple.length > 1)
                {
                    oStorage[iKey = unescape(aCouple[0])] = unescape(aCouple[1]);
                    aKeys.push(iKey);
                }
            }

            return oStorage;
        };
    })());
if (!Object.assign)
    Object.defineProperty(Object, 'assign',
        {
            configurable: true,
            enumerable:   false,
            writable:     true,
            value: function (target, firstSource)
            {
                if (target == null)
                    throw new TypeError('Cannot convert first argument to object');

                let to = Object(target);
                for (let i = 1; i < arguments.length; i++)
                {
                    let nextSource = arguments[i];
                    if (nextSource == null)
                        continue;

                    let keysArray = Object.keys(Object(nextSource));
                    for (let nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++)
                    {
                        let nextKey = keysArray[nextIndex];
                        let desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
                        if (desc != null && desc.enumerable)
                            to[nextKey] = nextSource[nextKey];
                    }
                }
                return to;
            }
        });
if (typeof AudioFile !== "function")
    AudioFile = function (file, contentType, loop)
    {
        let audio = this.audio = new Audio();
        audio.loop = loop;
        audio.autoplay = false;
        if (audio.canPlayType(contentType))
            audio.src = URL.createObjectURL(new Blob([file], { type: contentType }));
        else
            HELP.log('Current browser is unable to play back ' + contentType + '.UNSUPPORTED_FORMAT');

        this.play = function play()
        {
            audio.currentTime = 0;
            audio.play();
        };
        this.stop = function stop()
        {
            audio.pause();
            audio.currentTime = 0;
        };
    };

// CUSTOM
if (typeof TS   !== "function")
{
    TS = function TS(y, m, w, d, hr, mn, sc)
    {
        this.Years    = (y)  ? y : 0;
        this.Months   = (m)  ? m : 0;
        this.Weeks    = (w)  ? w : 0;
        this.Days     = (d)  ? d : 0;
        this.Hours    = (hr) ? hr : 0;
        this.Minutes  = (mn) ? mn : 0;
        this.Seconds  = (sc) ? parseInt(sc) : 0;
        this.mSeconds = (sc) ? Math.round((sc - parseInt(sc)) * 1000) : 0;

        this.toIsoString = function ()
        {
            return 'P'
                + ((this.Years)  ? this.Years  + 'Y' : '')
                + ((this.Months) ? this.Months + 'M' : '')
                + ((this.Days)   ? this.Days   + 'D' : '')
                + ((this.Hours || this.Minutes || this.Seconds) ? 'T' : '')
                + ((this.Hours)   ? this.Hours   + 'H' : '')
                + ((this.Minutes) ? this.Minutes + 'M' : '')
                + ((this.Seconds) ? this.Seconds + 'S' : '');
        };
        this.toString = function ()
        {
            return this.Years.toLocaleString('ru-RU', { minimumIntegerDigits: 2, useGrouping: false }) + '/' +
                this.Months.toLocaleString('ru-RU', { minimumIntegerDigits: 2, useGrouping: false }) + '/' +
                this.Days.toLocaleString('ru-RU', { minimumIntegerDigits: 2, useGrouping: false }) + ' ' +
                this.Hours.toLocaleString('ru-RU', { minimumIntegerDigits: 2, useGrouping: false }) + ':' +
                this.Minutes.toLocaleString('ru-RU', { minimumIntegerDigits: 2, useGrouping: false }) + ':' +
                this.Seconds.toLocaleString('ru-RU', { minimumIntegerDigits: 2, useGrouping: false }) + '.' +
                this.mSeconds.toLocaleString('ru-RU', { minimumIntegerDigits: 3, useGrouping: false });
        };
        this.toLocaleString = function ()
        {
            return this.toString();
        };
    };
    TS.parse = function (timespan)
    {
        let regex   = /P((([0-9]*\.?[0-9]*)Y)?(([0-9]*\.?[0-9]*)M)?(([0-9]*\.?[0-9]*)W)?(([0-9]*\.?[0-9]*)D)?)?(T(([0-9]*\.?[0-9]*)H)?(([0-9]*\.?[0-9]*)M)?(([0-9]*\.?[0-9]*)S)?)?/;
        let matches = timespan.match(regex);
        let y       = parseNumber(matches[3]);
        let m       = parseNumber(matches[5]);
        let w       = parseNumber(matches[7]);
        let d       = parseNumber(matches[9]);
        let hr      = parseNumber(matches[12]);
        let mn      = parseNumber(matches[14]);
        let sc      = parseNumber(matches[16]);
        return new TS(y, m, w, d, hr, mn, sc);
    };
}
if (typeof HELP !== "object")
{
    HELP =
        {
            queryString: function (url)
            {
                let query = '';

                if (url == null)
                    url = location.href;

                if (!isNullOrEmpty(url))
                {
                    if (url.indexOf('?') >= 0)
                        query = url.slice(url.indexOf('?') + 1);
                }

                return query.toLowerCase();
            },

            queryStringArray: function ()
            {
                let query = HELP.queryString();
                return !isNullOrEmpty(query) ? query.split('&') : [];
            },
            queryStringArrayFromUrl: function (url)
            {
                let query = HELP.queryString(url);
                return !isNullOrEmpty(query) ? query.split('&') : [];
            },

            queryStringParam: function (name, def)
            {
                let queryArray = HELP.queryStringArray();
                if (queryArray.length > 0)
                {
                    let pair = queryArray.filter(function (q) { return q.indexOf(name + '=') >= 0; });
                    if (pair != null && pair.length === 1)
                    {
                        let pairArgs = pair[0].split('=');
                        if (pairArgs.length === 2 && pairArgs[0] === name)
                            return pairArgs[1];
                    }
                }
                return def;
            },
            queryStringParamFromUrl: function (url, name, def)
            {
                let queryArray = HELP.queryStringArrayFromUrl(url);
                if (queryArray.length > 0)
                {
                    let pair = queryArray.filter(function (q) { return q.indexOf(name + '=') >= 0; });
                    if (pair != null && pair.length === 1)
                    {
                        let pairArgs = pair[0].split('=');
                        if (pairArgs.length === 2 && pairArgs[0] === name)
                            return pairArgs[1];
                    }
                }
                return def;
            },

            buildUrl: function (path, query)
            {
                return location.protocol + '//' + location.hostname + (!isNullOrEmpty(location.port) ? ':' + location.port : '') + '/'
                    + (!isNullOrEmpty(path) ? path.trimString('/') : '')
                    + (!isNullOrEmpty(query) ? '?' + query : '');
            },
            parseUrl: function (url)
            {
                var res = {};
                if (isNullOrEmpty(url))
                    return res;

                var parser = document.createElement("a");
                parser.href = url;
                parser.href = parser.href; // for IE !!!

                let abs = url.startsWith(parser.protocol);
                if (!abs && !url.startsWith('/'))
                    url = '/' + url;
                parser.href = url;

                var properties = ['host', 'hostname', 'hash', 'href', 'port', 'protocol', 'search'];
                for (var i = 0, n = properties.length; i < n; i++)
                    res[properties[i]] = parser[properties[i]];

                res.pathname = (parser.pathname.charAt(0) !== "/" ? "/" : "") + parser.pathname;

                return res;
            },

            hexToBytes: function (hex)
            {
                let bytes = [];
                if (hex == null)
                    return bytes;
                hex = hex.toString().trimFromStart('0x');
                for (let c = 0; c < hex.length; c += 2)
                    bytes.push(parseInt(hex.substr(c, 2), 16));
                return bytes;
            },
            bytesToHex: function (bytes)
            {
                if (bytes == null)
                    return '';
                let hex = [];
                for (let i = 0; i < bytes.length; i++)
                {
                    hex.push((bytes[i] >>> 4).toString(16));
                    hex.push((bytes[i] & 0xF).toString(16));
                }
                return hex.join('');
            },

            pageReload: function ()
            {
                if (location != null)
                    location.reload(true);
            },
            pageRedirect: function (address)
            {
                if (location != null)
                {
                    let redirectUrl;
                    try
                    {
                        let url = new URL(address);
                        redirectUrl = url.href;
                    }
                    catch (e)
                    {
                        let target = HELP.parseUrl(address);
                        redirectUrl = target.href;
                    }
                    finally
                    {
                        location.assign(redirectUrl);
                    }
                }
            },
            openUrl: function (address, newWindow)
            {
                let newWindowOrTab = window.open(address, newWindow != null ? '_blank' : '');
                if (newWindowOrTab != null)
                    newWindowOrTab.focus();
            },

            log: function (err, xhr)
            {
                if (err == null)
                    return;

                let errText = '';
                if (typeof err === "string")
                    errText = err;
                if (err instanceof Error)
                {
                    if (!isNullOrEmpty(err.name))
                        errText += 'Name: ' + err.name + '\n';
                    if (!isNullOrEmpty(err.message))
                        errText += 'Message: ' + err.message + '\n';
                    if (!isNullOrEmpty(err.description))
                        errText += 'Description: ' + err.description + '\n';
                    if (!isNullOrEmpty(err.stack))
                        errText += 'Stack: ' + err.stack + '\n';
                }
                if (xhr != null)
                {
                    if (!isNullOrEmpty(xhr.status))
                        errText += "XHR status: " + xhr.status + '\n';
                    if (!isNullOrEmpty(xhr.statusText))
                        errText += "XHR statusText: " + xhr.statusText + '\n';
                    if (!isNullOrEmpty(xhr.responseText))
                        errText += "XHR responseText: " + xhr.responseText + '\n';
                }
                var date = new Date();

                //-------->fix<----------//
                // console.log(date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + '.' + date.getMilliseconds() + ': ' + errText);
                //-------->fix<----------//

            },
            cancelEvent: function (e)
            {
                let evt = e || window.event;
                if (evt == null)
                    return;
                if (evt.preventDefault != null)
                    evt.preventDefault();
                if (evt.stopPropagation != null)
                    evt.stopPropagation();
                if (evt.cancelBubble != null)
                    evt.cancelBubble = true;
                if (evt.returnValue != null)
                    evt.returnValue = false;
                return false;
            },
            byteArrayToText: function (bytes, encoding)
            {
                let reader = new FileReader();
                let blob = new Blob([bytes]);
                let done = function () { };

                reader.onload = function ()
                {
                    done(reader.result);
                };

                if (encoding)
                    reader.readAsText(blob, encoding);
                else
                    reader.readAsText(blob);
                return { done: function (callback) { done = callback; } };
        },

            showFileSelector: function(inputID, complete)
            {
                var context = this;
                $('#' + inputID).on('change', function (e)
                {
                    try
                    {
                        if (this.files.length > 0)
                            readFile.call(context, this.files[0], complete);
                    }
                    catch (err)
                    {
                        console.log(err);
                    }
                    finally
                    {
                        $(this).off();
                        $(this).val("");
                    }
                });
                $('#' + inputID).click();
            },
            readFile: function(file, handler)
            {
                var context = this;
                var result = [];
                if (file == null)
                    return result;
                var reader = new FileReader();
                reader.onload = function (e)
                {
                    result = e.target.result;
                    if (handler != null)
                        handler.call(context, result);
                };
                reader.readAsText(file);
            },
            readBinaryFile: function(file, handler)
            {
                var context = this;
                var result = [];
                if (file == null)
                    return result;
                var reader = new FileReader();
                reader.onload = function (e)
                {
                    result = e.target.result;
                    if (handler != null)
                        handler.call(context, result);
                };
                reader.readAsBinaryString(file);
            }
        };
}
if (typeof AJAX !== "object")
{
    // required JQuery
    if (isDefined($) && $.ajax != null)
    {
        // AJAX global config
        //$.support.cors = true;
        AJAX =
            {
                get: function (func, query, success, error, complete)
                {
                    return AJAX.getTyped(func, query, 'application/json; charset=utf-8', success, error, complete);
                },
                getTyped: function (func, query, type, success, error, complete)
                {
                    return $.ajax
                        ({
                            type: 'GET',
                            url: HELP.buildUrl(func, query),
                            async: true,
                            cache: false,
                            crossDomain: true,
                            contentType: type,
                            xhrFields: {
                                withCredentials: true
                            },
                            timeout: AJAX.getTimeout() * 1000
                        }).done(function(response, textStatus, jqXHR) {
                            if (success != null)
                                success(jqXHR, response);
                        }).fail(function(jqXHR, textStatus, errorThrown) {
                            HELP.log(errorThrown, jqXHR);
                            if (error != null)
                                error(jqXHR, errorThrown);
                        }).always(function(data_or_jqXHR, textStatus, jqXHR_or_errorThrown) {
                            if (complete != null)
                                complete(data_or_jqXHR, textStatus, jqXHR_or_errorThrown);
                        });
                },
                post: function (func, query, val, success, error, complete)
                {
                    return AJAX.postTyped(func, query, val, 'application/json; charset=utf-8', success, error, complete);
                },
                postTyped: function (func, query, val, type, success, error, complete)
                {
                    return $.ajax
                        ({
                            type: 'POST',
                            url: HELP.buildUrl(func, query),
                            async: true,
                            cache: false,
                            crossDomain: true,
                            contentType: type,
                            xhrFields: {
                                withCredentials: true
                            },
                            data: val != null ? JSON.stringify(val) : '',
                            timeout: AJAX.getTimeout() * 1000
                        }).done(function (response, textStatus, jqXHR)
                        {
                            if (success != null)
                                success(jqXHR, response);
                        }).fail(function (jqXHR, textStatus, errorThrown)
                        {
                            HELP.log(errorThrown, jqXHR);
                            if (error != null)
                                error(jqXHR, errorThrown);
                        }).always(function (data_or_jqXHR, textStatus, jqXHR_or_errorThrown)
                        {
                            if (complete != null)
                                complete(data_or_jqXHR, textStatus, jqXHR_or_errorThrown);
                        });
                },
                postFormData: function (func, query, val, success, error, complete)
                {
                    return $.ajax
                        ({
                            type: 'POST',
                            url: HELP.buildUrl(func, query),
                            async: true,
                            cache: false,
                            crossDomain: true,
                            contentType: false,
                            processData: false,
                            data: val,
                            xhrFields: {
                                withCredentials: true
                            },
                            timeout: AJAX.getTimeout() * 1000
                        }).done(function (response, textStatus, jqXHR)
                        {
                            if (success != null)
                                success(jqXHR, response);
                        }).fail(function (jqXHR, textStatus, errorThrown)
                        {
                            HELP.log(errorThrown, jqXHR);
                            if (error != null)
                                error(jqXHR, errorThrown);
                        }).always(function (data_or_jqXHR, textStatus, jqXHR_or_errorThrown)
                        {
                            if (complete != null)
                                complete(data_or_jqXHR, textStatus, jqXHR_or_errorThrown);
                        });
                },
                patch: function (func, query, val, success, error, complete) {
                    return AJAX.patchTyped(func, query, val, 'application/json; charset=utf-8', success, error, complete);
                },
                patchTyped: function (func, query, val, type, success, error, complete) {
                    return $.ajax
                        ({
                            type: 'PATCH',
                            url: HELP.buildUrl(func, query),
                            async: true,
                            cache: false,
                            crossDomain: true,
                            contentType: type,
                            xhrFields: {
                                withCredentials: true
                            },
                            data: val != null ? JSON.stringify(val) : '',
                            timeout: AJAX.getTimeout() * 1000
                        }).done(function (response, textStatus, jqXHR) {
                            if (success != null)
                                success(jqXHR, response);
                        }).fail(function (jqXHR, textStatus, errorThrown) {
                            HELP.log(errorThrown, jqXHR);
                            if (error != null)
                                error(jqXHR, errorThrown);
                        }).always(function (data_or_jqXHR, textStatus, jqXHR_or_errorThrown) {
                            if (complete != null)
                                complete(data_or_jqXHR, textStatus, jqXHR_or_errorThrown);
                        });
                },
                delete: function (func, query, val, success, error, complete)
                {
                    return $.ajax
                        ({
                            type: 'DELETE',
                            url: HELP.buildUrl(func, query),
                            async: true,
                            cache: false,
                            crossDomain: true,
                            xhrFields: {
                                withCredentials: true
                            },
                            contentType: 'application/json; charset=utf-8',
                            data: val != null ? JSON.stringify(val) : '',
                            timeout: AJAX.getTimeout() * 1000
                        }).done(function (response, textStatus, jqXHR)
                        {
                            if (success != null)
                                success(jqXHR, response);
                        }).fail(function (jqXHR, textStatus, errorThrown)
                        {
                            HELP.log(errorThrown, jqXHR);
                            if (error != null)
                                error(jqXHR, errorThrown);
                        }).always(function (data_or_jqXHR, textStatus, jqXHR_or_errorThrown)
                        {
                            if (complete != null)
                                complete(data_or_jqXHR, textStatus, jqXHR_or_errorThrown);
                        });
                },
                getTimeout: function ()
                {
                    const connection = DATA.getObject("connection");
                    return +connection?.timeout || 10;
                },
                setTimeout: function (timeout)
                {
                    let connection = DATA.getObject("connection") || {};
                    connection.timeout = timeout;
                    DATA.setObject("connection", connection);
                }
            };
    }
}
if (typeof BASE64 !== "object")
{
    BASE64 =
        {
            init: function ()
            {
                this.lookup    = [];
                this.revLookup = [];
                this.Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;
                if (this.lookup.length === 0 || this.revLookup.length === 0)
                {
                    let code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                    for (let i = 0, len = code.length; i < len; ++i)
                    {
                        this.lookup[i] = code[i];
                        this.revLookup[code.charCodeAt(i)] = i;
                    }
                    this.revLookup['-'.charCodeAt(0)] = 62;
                    this.revLookup['_'.charCodeAt(0)] = 63;
                }
                return this;
            },
            toByteArray: function (b64)
            {
                let base = BASE64.init();
                let i, j, l, tmp, placeHolders, arr;
                let len = b64.length;

                if (len % 4 > 0)
                    throw new Error('Invalid string. Length must be a multiple of 4');

                placeHolders = b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0;
                arr = new base.Arr(len * 3 / 4 - placeHolders);
                l = placeHolders > 0 ? len - 4 : len;

                let L = 0;
                for (i = 0, j = 0; i < l; i += 4, j += 3);
                {
                    tmp = (base.revLookup[b64.charCodeAt(i)] << 18) | (base.revLookup[b64.charCodeAt(i + 1)] << 12) | (base.revLookup[b64.charCodeAt(i + 2)] << 6) | base.revLookup[b64.charCodeAt(i + 3)];
                    arr[L++] = (tmp >> 16) & 0xFF;
                    arr[L++] = (tmp >> 8) & 0xFF;
                    arr[L++] = tmp & 0xFF;
                }

                if (placeHolders === 2)
                {
                    tmp = (base.revLookup[b64.charCodeAt(i)] << 2) | (base.revLookup[b64.charCodeAt(i + 1)] >> 4);
                    arr[L++] = tmp & 0xFF;
                }
                else if (placeHolders === 1)
                {
                    tmp = (base.revLookup[b64.charCodeAt(i)] << 10) | (base.revLookup[b64.charCodeAt(i + 1)] << 4) | (base.revLookup[b64.charCodeAt(i + 2)] >> 2);
                    arr[L++] = (tmp >> 8) & 0xFF;
                    arr[L++] = tmp & 0xFF;
                }
                return arr;
            },
            fromByteArray: function (uint8)
            {
                let base = BASE64.init();
                function encodeChunk(uint8, start, end)
                {
                    let tmp;
                    let output = [];
                    for (let i = start; i < end; i += 3)
                    {
                        tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2]);
                        let num = base.lookup[tmp >> 18 & 0x3F] + base.lookup[tmp >> 12 & 0x3F] + base.lookup[tmp >> 6 & 0x3F] + base.lookup[tmp & 0x3F];
                        output.push(num);
                    }
                    return output.join('');
                }

                let tmp;
                let len = uint8.length;
                let extraBytes = len % 3;
                let output = '';
                let parts = [];
                let maxChunkLength = 16383;

                for (let i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength)
                    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)));

                if (extraBytes === 1)
                {
                    tmp = uint8[len - 1];
                    output += base.lookup[tmp >> 2];
                    output += base.lookup[(tmp << 4) & 0x3F];
                    output += '==';
                }
                else if (extraBytes === 2)
                {
                    tmp = (uint8[len - 2] << 8) + (uint8[len - 1]);
                    output += base.lookup[tmp >> 10];
                    output += base.lookup[(tmp >> 4) & 0x3F];
                    output += base.lookup[(tmp << 2) & 0x3F];
                    output += '=';
                }
                parts.push(output);
                return parts.join('');
            }
        };
}
if (typeof DATA !== "object")
{
    DATA =
        {
            get: function (key)
            {
                return window.localStorage.getItem(key);
            },
            set: function (key, value)
            {
                window.localStorage.setItem(key, value);
            },
            getObject: function (key)
            {
                try
                {
                    var item = window.localStorage.getItem(key);
                    return JSON.parse(item);
                }
                catch (e)
                {
                    HELP.log(e);
                    return null;
                }
            },
            setObject: function (key, value)
            {
                try
                {
                    window.localStorage.setItem(key, JSON.stringify(value));
                }
                catch (e)
                {
                    HELP.log(e);
                }
            },
            'delete': function (key)
            {
                window.localStorage.removeItem(key);
            },
            clear: function ()
            {
                window.localStorage.clear();
            }
        };
}
if (typeof GUID !== "object")
{
    GUID =
        {
            EMPTY: '00000000-0000-0000-0000-000000000000',
            isValid: function (val)
            {
                let pattern = new RegExp('^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$');
                return pattern.test(val);
        },
            newID: function ()
            {
                let s = [];
                let hexDigits = "0123456789abcdef";
                for (let i = 0; i < 36; i++)
                    s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
                s[14] = "4";
                s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);
                s[8] = s[13] = s[18] = s[23] = "-";
                return s.join("");
            }
        };
}
if (typeof TIMEZONE !== "object")
{
    TIMEZONE = {
        get offsets() {
            return [
                { id: -50,  value: "-12:00" },
                { id: -46,  value: "-11:30" },
                { id: -44,  value: "-11:00" },
                { id: -42,  value: "-10:30" },
                { id: -40,  value: "-10:00" },
                { id: -38,  value: "-09:30" },
                { id: -36,  value: "-09:00" },
                { id: -34,  value: "-08:30" },
                { id: -32,  value: "-08:00" },
                { id: -30,  value: "-07:30" },
                { id: -28,  value: "-07:00" },
                { id: -26,  value: "-06:30" },
                { id: -24,  value: "-06:00" },
                { id: -22,  value: "-05:30" },
                { id: -20,  value: "-05:00" },
                { id: -18,  value: "-04:30" },
                { id: -16,  value: "-04:00" },
                { id: -14,  value: "-03:30" },
                { id: -12,  value: "-03:00" },
                { id: -10,  value: "-02:30" },
                { id: -8,   value: "-02:00" },
                { id: -6,   value: "-01:30" },
                { id: -4,   value: "-01:00" },
                { id: -2,   value: "-00:30" },
                { id: 0,    value: "00:00"  },
                { id: 2,    value: "+00:30" },
                { id: 4,    value: "+01:00" },
                { id: 6,    value: "+01:30" },
                { id: 8,    value: "+02:00" },
                { id: 10,   value: "+02:30" },
                { id: 12,   value: "+03:00" },
                { id: 14,   value: "+03:30" },
                { id: 16,   value: "+04:00" },
                { id: 18,   value: "+04:30" },
                { id: 20,   value: "+05:00" },
                { id: 22,   value: "+05:30" },
                { id: 24,   value: "+06:00" },
                { id: 26,   value: "+06:30" },
                { id: 28,   value: "+07:00" },
                { id: 30,   value: "+07:30" },
                { id: 32,   value: "+08:00" },
                { id: 34,   value: "+08:30" },
                { id: 36,   value: "+09:00" },
                { id: 38,   value: "+09:30" },
                { id: 40,   value: "+10:00" },
                { id: 42,   value: "+10:30" },
                { id: 44,   value: "+11:00" },
                { id: 48,   value: "+11:30" },
                { id: 50,   value: "+12:00" }
            ];
        },
        get values() {
            let offsetValues = TIMEZONE.offsets;
            offsetValues.forEach(function (t) { t.id = t.value.trimFromStart('+') + ':00'; });
            return offsetValues;
        }
    };
}