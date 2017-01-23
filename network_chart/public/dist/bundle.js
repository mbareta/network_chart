(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
var utils = require('./utils.js');
var data_display = require('./manipulate_data_display.js');
var mouse_events = require('./mouse_events.js');

global.initChart = function (runtime, element, data) {
    // do not remove this comment
    /*var throttled = false;
     var delay = 250;*/


    function createGraph() {
        var chart_data = JSON.parse(data['json_data']);

        var $element = $(element);
        if (!chart_data) {
            var note = '<p class="note"> Please, go to edit and upload JSON file for the data. </p>';
            $element.find('.network-chart-main-container').html(note);
        }
        var dimensions = utils.getDimensions($element);
        var resolution = utils.getResolution();

        var width = dimensions.width;
        var height = dimensions.height;
        var ratio = 0.78; // ideal ratio is w / h = 0.78 (ex. w: 250, h: 320)

        var $chart = $element.find(".chart");

        $chart.find("svg").empty(); // clear previous html structure for precise rendering on resize

        var svg = d3.select($element[0]).select('svg');

        var simulation = d3.forceSimulation()
            .force("link", d3.forceLink().distance(setDistance).strength(setStrength))
            .force("charge", d3.forceManyBody())
            .force("center", d3.forceCenter(width / 2, height / 2));

        var nodes = chart_data['nodes'],
            central_node = nodes[0].id,
            nodeById = d3.map(nodes, function (d) {
                return d.id;
            }),
            links = chart_data['links'],
            bilinks = [],
            mainBilinks = [];

        links.forEach(function (link) {
            var s = link.source = nodeById.get(link.source),
                t = link.target = nodeById.get(link.target),
                i = {}; // intermediate node

            nodes.push(i);
            if (s.id === central_node || t.id === central_node) {
                mainBilinks.push([s, i, t]);
            } else {
                bilinks.push([s, i, t]);
            }
            links.push({source: s, target: i}, {source: i, target: t});
        });

        var divTooltip = d3.select($element[0]).select(".network-chart-main-container").append("div")
            .attr("class", "data-node-tooltip")
            .style("opacity", 0);

        var link = svg.selectAll(".link")
            .data(bilinks)
            .enter().append("path")
            .attr("class", "link");

        var mainLink = svg.selectAll(".mainLink")
            .data(mainBilinks)
            .enter().append("path")
            .attr("class", "link");


        var node = svg.selectAll(".node")
            .data(nodes.filter(function (d) {
                return d.id;
            }))
            .enter().append("circle")
            .attr("class", "node")
            .attr("r", 10)
            .attr("id", function (d) {
                return d.id.replace(' ', '');
            })
            .on("click", function (d) {
                return handleMouseClickNode(d)
            })
            .on("mouseover", function (d) {
                return mouse_events.handleMouseOverNode(d, divTooltip, svg)
            })
            .on("mouseout", function (d) {
                return mouse_events.handleMouseOutNode(d, divTooltip, svg)
            })
            // .call -> Invokes the specified function exactly once, passing in this selection
            // along with any optional arguments. Returns this selection.
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended)
            );

        // set width and height for dataInfo container
        var $dataInfo = $element.find('.dataInfo');
        var newWidth = width / 8;
        var newHeight = newWidth / ratio;

        $dataInfo.width(newWidth).height(newHeight);

        simulation
            .nodes(nodes)
            // tick - after each tick of the simulation’s internal timer.
            .on("tick", ticked);

        simulation.force("link")
            .links(links);

        function ticked() {
            link.attr("d", positionLink);
            mainLink.attr('d', straightLink);
            node.attr("transform", positionNode);
        }

        /**
         *  Mouseover, mouseout and onclick events
         */

        function handleMouseClickNode(d) {
            var data = data_display.getNearLinksAndNodes(d, links);
            data_display.highlightElements(data, d, svg);
            data_display.getInfoForSelectedNode($element, d);
            exposeSiblingNodes(data.nodes);
        }

        /**
         *  Expose data from nodes
         *  (1) simulate click on chart when user clicks on item list
         *  (2) simulate hover on chart when user hovers list item
         *  (3) add and remove mouseover event
         **/

        function exposeSiblingNodes(exposing_nodes) {
            var d = document;
            var listNode = $element.find('.dataList')[0];

            // clear existing list
            while (listNode.firstChild) {
                listNode.removeChild(listNode.firstChild);
            }

            exposing_nodes.forEach(function (node) {
                var listElementNode = d.createElement("LI");
                listElementNode.dataset.mit_tooltip = node.id;
                var imgNode = d.createElement('img');
                imgNode.src = node.img_url;
                imgNode.onclick = function () {
                    handleMouseClickNode(node);
                };
                imgNode.addEventListener("mouseover", function () {
                    mouse_events.handleMouseOverNode(node, divTooltip, svg);
                });
                imgNode.addEventListener("mouseout", function () {
                    mouse_events.handleMouseOutNode(node, divTooltip, svg);
                });

                listElementNode.appendChild(imgNode);
                listNode.appendChild(listElementNode);
            })
        }

        function setDistance(d) {
            var source_id = d.source.id,
                target_id = d.target.id,
                delta = 0;

            if (resolution <= 1399) {
                delta = 30;
            }
            if (source_id === central_node) {
                return 150 - delta;
            } else if (target_id === central_node) {
                return 90 - delta;
            } else {
                return 55 - delta;
            }
        }

        function setStrength(d) {
            var source_id = d.source.id,
                target_id = d.target.id;
            if (source_id === central_node || target_id === central_node) {
                return 0.1;
            } else {
                return 0.25;
            }
        }

        /**
         * Functions which take care of dragging and positioning the graph nodes and links
         */

        function positionLink(d) {
            return "M" + d[0].x + "," + d[0].y
                + "S" + d[1].x + "," + d[1].y
                + " " + d[2].x + "," + d[2].y;
        }

        function straightLink(d) {
            return "M" + d[0].x + "," + d[0].y
                + "S" + (d[0].x + d[2].x) / 2 + "," + (d[0].y + d[2].y) / 2.25
                + " " + d[2].x + "," + d[2].y;
        }

        function positionNode(d) {
            return "translate(" + d.x + "," + d.y + ")";
        }

        function dragstarted(d) {
            if (!d3.event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(d) {
            // d3.event stores the current event, if any.
            d.fx = d3.event.x;
            d.fy = d3.event.y;
        }

        function dragended(d) {
            if (!d3.event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
    }

    createGraph();

    window.addEventListener('resize', function () {
        // do not remove this comment
        /* only run if we're not throttled
         if (!throttled) {
         // actual callback action
         mainFunction();
         // we're throttled!
         throttled = true;
         // set a timeout to un-throttle
         setTimeout(function () {
         throttled = false;
         mainFunction();
         }, delay);
         }*/
        createGraph();
    });
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./manipulate_data_display.js":2,"./mouse_events.js":3,"./utils.js":4}],2:[function(require,module,exports){
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
        .attr('src', node.img_url);

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
},{}],3:[function(require,module,exports){
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
},{}],4:[function(require,module,exports){
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
},{}]},{},[1]);
