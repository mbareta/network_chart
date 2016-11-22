'use strict';

function isRenderedInStudio($main_container){
    var studio_wrapper = $main_container.parents('.studio-xblock-wrapper');
    return studio_wrapper[0] ? true : false;
}

function getDimensions($element) {
    var chart = $element.find('.network-chart-main-container')[0];
    var width = chart.offsetWidth,
      height = chart.offsetHeight;

    // in this case, the chart is rendering in studio, so we'll take
    // first known container's width as a reference
    if (width === 0) {
        width = $element.parents('.content-primary').width();
        height = width * 0.5;
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