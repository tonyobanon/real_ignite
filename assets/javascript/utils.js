
function __validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

function formatObject(obj) {
    var _obj = {};
    for (var i in obj) {
        var value = obj[i];
        if (!value) {
            value = '';
        }
        _obj[i] = value;
    }
    return _obj;
}

function getFormattedDate(string) {
    var date = new Date(Date.parse(string));
    var formattedTime = date.getDate() + ' / ' + (date.getMonth() + 1) + ' / ' + date.getFullYear();
    return formattedTime;
}

function generateShortId() {
    var ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var ID_LENGTH = 8;
    var rtn = '';
    for (var i = 0; i < ID_LENGTH; i++) {
        rtn += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
    }
    return rtn;
}

function removeCookieWithPath(key) {
    var path = window.location.pathname;
    document.cookie = key + '=;Version=1;Path=' + (path ? path : '/') + ';Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

function removeCookie(key) {
    document.cookie = key + '=;path=' + '/' + ';expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

function getCookieOnce(key) {
    var value = getCookie(key);
    removeCookieWithPath(key, window.location.pathname);
    return value;
}

function getCookie(key) {
    var allcookies = document.cookie;
    var pos = allcookies.indexOf(key);
    if (pos !== -1) {
        var len = key.length + 1; var start = pos + len;
        var end = allcookies.indexOf(';', start);
        if (end === -1)
            end = allcookies.length;
        var value = allcookies.substring(start, end);
        value = unescape(value);
        return value;
    } else {
        return null;
    }
}

function setCookie(key, value, rem) {
    if (rem) {
        var nextyear = new Date();
        nextyear.setFullYear(nextyear.getFullYear() + 1);
        document.cookie = key + '=' + value + '; expires=' + nextyear.toGMTString() + '; path=/';
    } else {
        document.cookie = key + '=' + value + '; path=/';
    }
}

function trimText(string, maxLength) {
    if (string.length > maxLength) {
        var trimmedText = ''; for (var ind = 0; ind < maxLength; ind++) {
            trimmedText = trimmedText + string.charAt(ind);
        }
        string = trimmedText.trim() + ' ...';
    }
    return string;
}