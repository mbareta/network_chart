'use strict';

function isRenderedInStudio() {
    var studio_wrapper = $('.network-chart-main-container').parents('.studio-xblock-wrapper');
    return studio_wrapper[0] ? true : false;
}

function getDimensions($element) {
    var width,
        height;
    if (isRenderedInStudio()) {
        width = $element.parents('.content-primary').width();
        height = width * 0.5;
    } else {
        width = window.innerWidth;
        height = window.innerHeight;
    }
    return {
        width: width,
        height: height
    }
}

module.exports = {
    getDimensions: getDimensions,
    isRenderedInStudio: isRenderedInStudio
};