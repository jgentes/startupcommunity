$(document).ready(function () {

    // Set minimal height of #wrapper to fit the window
    setTimeout(function () {
        fixWrapperHeight();
    }, 300);

    // Add special class to minimalize page elements when screen is less than 768px
    setBodySmall();

});

$(window).bind("load", function () {

    // Remove splash screen after load
    $('.splash').css('display', 'none');

    setTimeout(function() {
        $('footer').css('display', 'block');
    }, 1000)

});

$(window).bind("resize click", function () {

    // Add special class to minimalize page elements when screen is less than 768px
    setBodySmall();

    setTimeout(function () {
        fixWrapperHeight();
    }, 300);
});

function findKey(obj, key_to_find, results, key) {

    if (!obj) { return results; }
    if (!results) { results = []; }

    var keys = Object.keys(obj),
        name = null,
        subkeys = null,
        pushme = {},
        i = 0;

    for (i in keys) {
        name = keys[i];
        subkeys = obj[name];

        if (typeof subkeys === 'object') {
            subkeys["key"] = name;
            if (name === key_to_find) {
                results.push(obj);
            } else {
                key = name;
                findKey(subkeys, key_to_find, results, key);
            }
        }
    }

    return results;
};

function findValue(obj, value_to_find, results, key) {

    if (!obj) { return results; }
    if (!results) { results = []; }

    for (i in obj) {
        if (typeof(obj[i])=="object") {
            obj[i]["key"] = i;
            for (subkey in obj[i]) {
                if (obj[i][subkey] == value_to_find) {
                    results.push(obj[i]);
                }
            }
            key = i;
            findValue(obj[i], value_to_find, results);
        }
    }
    return results;
};

function fixWrapperHeight() {

    // Get and set current height
    var headerH = 62;
    var navigationH = $("#navigation").height();
    var contentH = $(".content").height();

    // Set new height when contnet height is less then navigation
    if (contentH < navigationH) {
        $("#wrapper").css("min-height", navigationH + 'px');
    }

    // Set new height when contnet height is less then navigation and navigation is less then window
    if (contentH < navigationH && navigationH < $(window).height()) {
        $("#wrapper").css("min-height", $(window).height() - headerH  + 'px');
    }

    // Set new height when contnet is higher then navigation but less then window
    if (contentH > navigationH && contentH < $(window).height()) {
        $("#wrapper").css("min-height", $(window).height() - headerH + 'px');
    }

}

function setBodySmall() {
    if ($(this).width() < 769) {
        $('body').addClass('page-small');
    } else {
        $('body').removeClass('page-small');
        $('body').removeClass('show-sidebar');
    }
}

