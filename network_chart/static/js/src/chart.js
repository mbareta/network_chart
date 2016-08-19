function initChart() {

var chart = document.getElementById("chart");

var svg = d3.select("svg"),
    width = parseInt(chart.offsetWidth),
    height = parseInt(chart.offsetHeight);

var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().distance(150).strength(0.5))
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
        .on("click", function (selected_node) {
            var data = getNearLinksAndNodes(selected_node);
            highlightElements(data, selected_node);
            exposeSiblingNodes(data.nodes);
            getInfoForSelectedNode(selected_node);
        })
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    node.append("title")
        .text(function (d) {
            return d.id;
        });

    simulation
        .nodes(nodes)
        .on("tick", ticked);

    simulation.force("link")
        .links(links);

    function ticked() {
        link.attr("d", positionLink);
        node.attr("transform", positionNode);
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
            imgNode.src = 'http://54.83.196.116:18010/asset-v1:edX+DemoX+Demo_Course+type@asset+block@person.jpg';
            imgNode.onclick = function () {
                simulateClick(contains('title', node.id)[0].parentNode);
            };
            listElementNode.appendChild(imgNode);
            listNode.appendChild(listElementNode);
        })
    }

});

/**
 *  Helpers
 */

// Check if DOM element contains text
function contains(selector, text) {
    var elements = document.querySelectorAll(selector);
    return [].filter.call(elements, function (element) {
        return new RegExp(text).test(element.textContent);
    });
}

// Simulate click on DOM element
function simulateClick(elem /* Must be the element, not d3 selection */) {
    var evt = document.createEvent("MouseEvents");
    evt.initMouseEvent(
        "click", /* type */
        true, /* canBubble */
        true, /* cancelable */
        window, /* view */
        0, /* detail */
        0, /* screenX */
        0, /* screenY */
        0, /* clientX */
        0, /* clientY */
        false, /* ctrlKey */
        false, /* altKey */
        false, /* shiftKey */
        false, /* metaKey */
        0, /* button */
        null);
    /* relatedTarget */
    elem.dispatchEvent(evt);
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
        data.nodes.forEach(function (el) {
            if (el.id === node.id) {
                svgNode.classed("inactive", false);
            } else if (selected_node.id === node.id) {
                svgNode.classed("active", true);
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
    infoContainer.className = ""; // remove class hidden
    // TODO: it looks ugly. Make it better.
    infoContainer.firstElementChild.innerHTML = "";
    infoContainer.firstElementChild.innerHTML = "<p>" + node.id + "</p>";
}

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
    d.fx = d3.event.x;
    d.fy = d3.event.y;
}

function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}

}
