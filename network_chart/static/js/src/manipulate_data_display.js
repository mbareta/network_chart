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
    function createDataTooltip() {
        // node.company.description is content which should be displayed
        return d3.select($element[0]).select('.dataInfo').append('div')
            .attr('class', 'data-info-tooltip')
            .attr('data-info-tooltip', node.company.description)
            .style('opacity', 0);
    }

    function handleMouseOverInfo(divTooltip) {
        divTooltip.transition()
            .duration(200)
            .style("opacity", 1);
    }

    function handleMouseOutInfo(divTooltip) {
        divTooltip.transition()
            .duration(500)
            .style("opacity", 0);
    }

    var $infoContainer = $element.find('.dataInfo');
    $infoContainer.removeClass('hidden');
    $infoContainer.html('');

    // info text
    var $companyNode = ($('<p></p>')
            .addClass('company')
            .append(node.company.name)
    );

    if (node.company.description) {
        var divTooltip = createDataTooltip();
        var $companyInfo = ($('<span class="fa fa-info-circle"></span>'));
        $companyInfo.hover(
            function() {
                return handleMouseOverInfo(divTooltip)
            },
            function() {
                return handleMouseOutInfo(divTooltip)
            }
        );
        $companyNode.append($companyInfo);

    }

    var $paragraphNode = $('<div></div>')
        .addClass('text-info')
        .append($('<p></p>')
            .addClass('name')
            .append(node.id)
        )
        .append($('<p></p>')
            .addClass('position')
            .append(node.position)
        )
        .append($companyNode);

    // image
    var $imgNode = $('<img />')
        .attr('src', node.img_url)
        .attr('alt', node.id + ', ' + node.position + ', ' + node.company.name);

    // overlay
    var $overlay = $('<div></div>')
        .addClass('data-info-overlay');

    $infoContainer.append($imgNode);
    $infoContainer.append($paragraphNode);
    $infoContainer.append($overlay);
}

module.exports = {
    getNearLinksAndNodes: getNearLinksAndNodes,
    getInfoForSelectedNode: getInfoForSelectedNode,
    highlightElements: highlightElements
};