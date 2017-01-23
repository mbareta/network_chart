'use strict';

var existing_class = null;
function handleMouseOverNode(d, divTooltip, svg) {
    divTooltip.transition()
        .duration(200)
        .style("opacity", 1);
    divTooltip.attr("data-node-tooltip", d.id)
        .style("left", d.x + "px")
        .style("top", ( d.y - 22 ) + "px");

    var _id = d.id.replace(' ', '');
    var d3Node = svg.select("#" + _id);
    existing_class = d3Node.attr("class");
    d3Node.classed("active", true);
}

function handleMouseOutNode(d, divTooltip, svg) {
    divTooltip.transition()
        .duration(500)
        .style("opacity", 0);
    var _id = d.id.replace(' ', '');
    var d3Node = svg.select("#" + _id);
    var temp = d3Node.attr("class");
    if (!(temp.indexOf("clicked") !== -1 )) {
        d3Node.attr("class", existing_class);
    }
}

module.exports = {
    handleMouseOverNode: handleMouseOverNode,
    handleMouseOutNode: handleMouseOutNode
};