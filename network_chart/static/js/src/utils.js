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

function getResolution() {
    // TODO: if this starts to expand, use switch instead of if condition
    if (window.matchMedia('(max-width: 1399px)').matches) {
        return 1399;
    }
}

module.exports = {
    getDimensions: getDimensions,
    isRenderedInStudio: isRenderedInStudio,
    getResolution: getResolution
};