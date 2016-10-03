function initChart() {
    var width,
        height,
        ratio = 0.78, // ideal ratio is w / h = 0.78 (ex. w: 250, h: 320)
        throttled = false,
        delay = 250;

    var $chart = $("#chart");

    function getDimensions() {
        var chart = document.getElementById("chart");
        var chart_parent = chart.parentElement;
        width = chart_parent.offsetWidth;
        height = chart_parent.offsetHeight;

        // in this case, the chart is rendering in studio, so we'll take
        // first known container's width as a reference
        if (width === 0) {
            width = $('.content-primary').width();
            height = width * 0.5;
        }
    }

    function createGraph() {
        var chart = document.getElementById("chart");
        $chart.find("svg").empty(); // clear previous html structure for precise rendering on resize

        var svg = d3.select("svg");

        var simulation = d3.forceSimulation()
            .force("link", d3.forceLink().distance(250).strength(0.5))
            .force("charge", d3.forceManyBody())
            .force("center", d3.forceCenter(width / 2, height / 2));

        d3.json(document.jsonUrl, function (error, graph) {
            if (error) throw new error;

            var nodes = graph.nodes,
                nodeById = d3.map(nodes, function (d) {
                    return d.id;
                }),
                links = graph.links,
                bilinks = [];

            links.forEach(function (link) {
                var s = link.source = nodeById.get(link.source),
                    t = link.target = nodeById.get(link.target),
                    i = {}; // intermediate node
                nodes.push(i);
                links.push({source: s, target: i}, {source: i, target: t});
                bilinks.push([s, i, t]);
            });

            var divTooltip = d3.select(".network-chart-main-container").append("div")
                .attr("class", "data-node-tooltip")
                .style("opacity", 0);

            var link = svg.selectAll(".link")
                .data(bilinks)
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
                .on("click", handleMouseClickNode)
                .on("mouseover", handleMouseOverNode)
                .on("mouseout", handleMouseOutNode)
                // .call -> Invokes the specified function exactly once, passing in this selection
                // along with any optional arguments. Returns this selection.
                .call(d3.drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended));

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

        });

        /**
         * Functions which take care of dragging the graph nodes
         */

        function positionLink(d) {
            return "M" + d[0].x + "," + d[0].y
                + "S" + d[1].x + "," + d[1].y
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
            getDimensions();
            createGraph();
            // we're throttled!
            throttled = true;
            // set a timeout to un-throttle
            setTimeout(function () {
                throttled = false;
                getDimensions();
                createGraph();
            }, delay);
        }
    });

    getDimensions();
    createGraph();
}
