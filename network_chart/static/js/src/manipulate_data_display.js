'use strict';

/**
 *  Find first sibling nodes and highlight their links
 */

function getNearLinksAndNodes(node, links) {
    var nearLinks = [];
    var nearNodes = [];

    links.forEach(function (link) {
        if (link.source.id === node.id && link.value) {
            nearLinks.push(link);
            nearNodes.push(link.target);
        } else if (link.target.id === node.id && link.value) {
            nearLinks.push(link);
            nearNodes.push(link.source);
        }
    });

    return {
        nodes: nearNodes,
        links: nearLinks
    };
}

/**
 *  Function receives data (links and nodes) and selected node.
 *  Every node will be set as inactive except for the selected one.
 *  The same is with links.
 */

function highlightElements(data, selected_node, svg) {
    svg.selectAll(".link").each(function (link) {
        var svgLink = d3.select(this);
        svgLink.classed("inactive", true);
        data.links.forEach(function (el) {
            if (el.source.id === link[0].id && el.target.id === link[2].id) {
                svgLink.classed("inactive", false);
            }
        })

    });

    svg.selectAll(".node").each(function (node) {
        var svgNode = d3.select(this);
        svgNode.classed("inactive", true);
        svgNode.classed("active", false);
        svgNode.classed("clicked", false);

        data.nodes.forEach(function (el) {
            if (el.id === node.id) {
                svgNode.classed("inactive", false);
            } else if (selected_node.id === node.id) {
                svgNode.classed("active", true);
                svgNode.classed("clicked", true);
            }
        })

    });
}

/**
 *  Get info about selected node
 */

function getInfoForSelectedNode($element, node) {
    var d = document;
    var infoContainer = $element.find('.dataInfo')[0];

    infoContainer.className = "dataInfo active";
    infoContainer.innerHTML = "";
    // info text
    var textNode = d.createElement("div");
    textNode.className = "text-info";
    var textElement = d.createTextNode(node.id);
    textNode.appendChild(textElement);
    // image
    var imgNode = d.createElement("img");
    imgNode.setAttribute("src", node.img_url);
    // overlay
    var overlayElement = d.createElement("div");
    overlayElement.className = "data-info-overlay";

    infoContainer.appendChild(imgNode);
    infoContainer.appendChild(textNode);
    infoContainer.appendChild(overlayElement);
}

module.exports = {
    getNearLinksAndNodes: getNearLinksAndNodes,
    getInfoForSelectedNode: getInfoForSelectedNode,
    highlightElements: highlightElements
};