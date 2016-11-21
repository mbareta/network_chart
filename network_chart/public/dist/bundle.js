(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
var utils = require('./utils.js');

global.initChart = function (runtime, element, data) {
    //console.log("json data: ", data['json_data']);
    var chart_data = JSON.parse(data['json_data']);
    console.log("******************************************* nodes: ", chart_data['nodes']);
    //console.log(chart_data.nodes);
    //var _chart_data = JSON.parse(chart_data);
    //console.log(_chart_data['nodes']);
    //console.log(_chart_data.nodes);

    const central_node = 'KC';
    var $element = $(element);
    var dimensions = utils.getDimensions($element);

    var width = dimensions.width,
        height = dimensions.height,
        ratio = 0.78, // ideal ratio is w / h = 0.78 (ex. w: 250, h: 320)
        throttled = false,
        delay = 250;

    var $chart = $element.find("#chart");

    function createGraph(chart_data) {
        var chart = document.getElementById("chart");
        $chart.find("svg").empty(); // clear previous html structure for precise rendering on resize

        var svg = d3.select("svg");

        var simulation = d3.forceSimulation()
            .force("link", d3.forceLink().distance(setDistance).strength(setStrength))
            .force("charge", d3.forceManyBody())
            .force("center", d3.forceCenter(width / 2, height / 2));

        var nodes = chart_data['nodes'],
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

        var divTooltip = d3.select(".network-chart-main-container").append("div")
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
                return d.id
            })
            .on("click", function (d) {
                return handleMouseClickNode(d)
            })
            .on("mouseover", handleMouseOverNode)
            .on("mouseout", handleMouseOutNode)
            // .call -> Invokes the specified function exactly once, passing in this selection
            // along with any optional arguments. Returns this selection.
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended)
            );

        // set width and height for dataInfo container
        var $dataInfo = $("#dataInfo");
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
            var data = getNearLinksAndNodes(d);
            highlightElements(data, d);
            exposeSiblingNodes(data.nodes);
            getInfoForSelectedNode(d);
        }

        var existing_class = null;

        function handleMouseOverNode(d) {
            divTooltip.transition()
                .duration(200)
                .style("opacity", 1);
            divTooltip.attr("data-node-tooltip", d.id)
                .style("left", d.x + "px")
                .style("top", (d.y - 22) + "px");

            var d3Node = d3.select("#" + d.id);
            existing_class = d3Node.attr("class");
            d3Node.classed("active", true);
        }

        function handleMouseOutNode(d) {
            divTooltip.transition()
                .duration(500)
                .style("opacity", 0);
            var d3Node = d3.select("#" + d.id);
            var temp = d3Node.attr("class");
            if (!(temp.indexOf("clicked") !== -1 )) {
                d3Node.attr("class", existing_class);
            }
        }

        /**
         *  Find first sibling nodes and highlight their links
         */

        function getNearLinksAndNodes(node) {
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
         *  Expose data from nodes
         *  (1) simulate click on chart when user clicks on item list
         *  (2) simulate hover on chart when user hovers list item
         *  (3) add and remove mouseover event
         */

        function exposeSiblingNodes(nodes) {
            var d = document;
            var listNode = d.getElementById("dataList");

            // clear existing list
            while (listNode.firstChild) {
                listNode.removeChild(listNode.firstChild);
            }

            nodes.forEach(function (node) {
                var listElementNode = d.createElement("LI");
                listElementNode.dataset.mit_tooltip = node.id;
                var imgNode = d.createElement('img');
                imgNode.src = node.img_url;
                imgNode.onclick = function () {
                    handleMouseClickNode(node);
                };
                imgNode.addEventListener("mouseover", function () {
                    handleMouseOverNode(node);
                });
                imgNode.addEventListener("mouseout", function () {
                    handleMouseOutNode(node);
                });

                listElementNode.appendChild(imgNode);
                listNode.appendChild(listElementNode);
            })
        }

        function setDistance(d) {
            var source_id = d.source.id,
                target_id = d.target.id;
            if (source_id === central_node) {
                return 150;
            } else if (target_id === central_node) {
                return 90;
            } else {
                return 55;
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

        /**
         *  Function receives data (links and nodes) and selected node.
         *  Every node will be set as inactive except for the selected one.
         *  The same is with links.
         */

        function highlightElements(data, selected_node) {
            d3.selectAll(".link").each(function (link) {
                var svgLink = d3.select(this);
                svgLink.classed("inactive", true);
                data.links.forEach(function (el) {
                    if (el.source.id === link[0].id && el.target.id === link[2].id) {
                        svgLink.classed("inactive", false);
                    }
                })

            });

            d3.selectAll(".node").each(function (node) {
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

        function getInfoForSelectedNode(node) {
            var d = document;
            var infoContainer = d.getElementById("dataInfo");

            infoContainer.className = "active";
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
    }

    window.addEventListener('resize', function () {
        // only run if we're not throttled
        if (!throttled) {
            // actual callback action
            dimensions = utils.getDimensions($element);
            width = dimensions.width;
            height = dimensions.height;
            createGraph();

            // we're throttled!
            throttled = true;
            // set a timeout to un-throttle
            setTimeout(function () {
                throttled = false;
                createGraph();
            }, delay);
        }
    });

    createGraph(chart_data);
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./utils.js":2}],2:[function(require,module,exports){
'use strict';

function getDimensions($element) {
    var chart = $element.find('.network-chart-main-container')[0];
    var width = chart.offsetWidth,
      height = chart.offsetHeight;

    debugger;
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
    getDimensions: getDimensions
};
},{}]},{},[1]);
