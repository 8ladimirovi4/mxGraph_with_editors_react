import $ from "jquery";

/*jshint unused:false,evil:true*/
/*global escape,unescape*/

/* Global objects & functions */



    const isDefined = function (obj)
    {
        return obj !== undefined && obj !== null && typeof obj !== 'undefined';
    };

   const isNullOrEmpty = function (str)
    {
        return !isDefined(str) || str.toString().trim() === '';
    };

   const isNonZeroNumber = function (obj)
    {
        return isDefined(obj) && typeof obj === 'number' && !isNaN(obj) && obj !== 0;
    };


   const parseNumber = function (str, def, dec)
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

   const parseBoolean = function (val)
    {
        if (val == null)
            return false;
        if (typeof val === 'boolean')
            return (val === true);
        if (typeof val === 'string')
            return (/^\s*(true|1|on|yes)\s*$/i).test(val);
        return false;
    };

   const parseBooleanAsNumber = function (val)
    {
        let res = false;
        if (typeof val === 'boolean')
            res = (val === true);
        if (typeof val === 'string')
            res = (/^\s*(true|1|on|yes)\s*$/i).test(val);
        return res ? 1 : 0;
    };

    const getRandomInt = function (min, max)
    {
        return Math.floor(Math.random() * (max - min)) + min;
    };

   const isFrame = function ()
    {
        return isDefined(window.frameElement) || window.self !== window.parent;
    };

   const escapeHTML = function (str)
    {
        return isNullOrEmpty(str) ? '' : str
            .replace(/&/g, '&amp;')
            .replace(/>/g, '&gt;')
            .replace(/</g, '&lt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    };

   const unescapeHTML = function (str)
    {
        return isNullOrEmpty(str) ? '' : str
            .replace(/&amp;/g, '&')
            .replace(/&gt;/g, '>')
            .replace(/&lt;/g, '<')
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, '\'');
    };

   const getExtension = function (path)
    {
        if (path == null)
            return '';
        let dot = path.trim().lastIndexOf('.');
        return dot >= 0 ? path.substring(dot + 1) : '';
    };


let HELP = {
            queryString: function (url)
            {
                let query = '';

                // if (url == null)
                //     url = location.href;

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
                return window.location.protocol + '//' + window.location.hostname + (!isNullOrEmpty(window.location.port) ? ':' + window.location.port : '') + '/'
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
                if (window.location != null)
                    window.location.reload(true);
            },
            pageRedirect: function (address)
            {
                if (window.location != null)
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
                        window.location.assign(redirectUrl);
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
                         window.readFile.call(context, this.files[0], complete);
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

       let AJAX =
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

    let BASE64 =
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

    let DATA =
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


    let GUID =
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

   let TIMEZONE = {
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
   
    export { 
        HELP, 
        AJAX, 
        BASE64, 
        DATA,  
        GUID, 
        TIMEZONE, 
        isNullOrEmpty,
        isDefined,
        getExtension,
        parseNumber,
        parseBoolean,
        parseBooleanAsNumber,
        isFrame
    }