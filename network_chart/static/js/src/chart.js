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
