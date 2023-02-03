const defaultHTMLData = `
var theme = {
    'attribute': { 'colour': '#7f2704', 'tcolour': 'white', 'label_name': true, 'label_value': true, 'corner': 5, 'split_line': false, 'tsize': '10px' },
    'entity': { 'colour': '#08306b', 'tcolour': 'white', 'label_name': true, 'label_iid': true, 'iid_shorten': true, 'corner': 5, 'split_line': false },
    'relation': { 'colour': '#006d2c', 'tcolour': "black", 'label_name': true, 'label_iid': false, 'label_offset': 0, 'radius': 10, 'iid_shorten': true, 'split_line': false, 'tsize': '10px' },
    'shadow': { 'colour': '#fdae6b', 'tcolour': 'black' },
    'edges': { 'colour': 'black', 'stroke': '1px', 'arrow': true, 'acolour': 'black', 'labels': true, 'split_line': true, 'tsize': '10px' },
    'tooltip': { 'fill': 'white', 'stroke': '1px', 'scolour': 'black', 'corner': 5, 'tcolour': 'black', 'tsize': '11px', 'padding': '10px' },
    'd3sim': { 'linkdistance': 150, 'charge': -200 },
    'super': { 'radius': 25, 'label_name': true, 'label_iid': false, 'iid_shorten': true, 'split_line': true, 'tsize': '10px' },
    'tt_description': {
        'title': true, 'name': true, 'role': true, 'value': true, 'boldtitle': true, 'subtitle': true,
        'type': true, 'g_G_name': true, 'g_role': true, 'v_G_name': true, 'v_Value': true, 'where': true, 'number': true
    }
};
// create the svg
var width = 900;
var height = 500;
var textPadding = 4;
var grp_corner = 8;
var mouseTipX = 15;
var mouseTipY = 15;

var local_svg = d3.select("#svg")
    .attr("width", width)
    .attr("height", height)
    .call(
        d3.zoom().on("zoom", function () {
            local_svg.attr("transform", d3.event.transform);
        })
    )
    .append("g");


// graph.json
var Graph_Data = { "basic": { "nodes": [{ "type": "entity", "symbol": "b", "G_id": "0x826e80018000000000000003", "G_name": "event", "has": ["0x836f800428000163"], "dtype": "actual", "id": 0 }, { "type": "entity", "symbol": "b", "G_id": "0x826e80018000000000000001", "G_name": "event", "has": ["0x836f800428000161"], "dtype": "actual", "id": 1 }, { "type": "entity", "symbol": "b", "G_id": "0x826e80018000000000000007", "G_name": "event", "has": ["0x836f800428000163"], "dtype": "actual", "id": 2 }, { "type": "entity", "symbol": "b", "G_id": "0x826e8001800000000000000b", "G_name": "event", "has": ["0x836f800428000163"], "dtype": "actual", "id": 3 }, { "type": "entity", "symbol": "b", "G_id": "0x826e80018000000000000005", "G_name": "event", "has": ["0x836f800428000161"], "dtype": "actual", "id": 4 }, { "type": "entity", "symbol": "b", "G_id": "0x826e80018000000000000009", "G_name": "event", "has": ["0x836f800428000161"], "dtype": "actual", "id": 5 }, { "type": "entity", "symbol": "b", "G_id": "0x826e80018000000000000004", "G_name": "event", "has": ["0x836f800428000164"], "dtype": "actual", "id": 6 }, { "type": "entity", "symbol": "b", "G_id": "0x826e80018000000000000008", "G_name": "event", "has": ["0x836f800428000164"], "dtype": "actual", "id": 7 }, { "type": "entity", "symbol": "b", "G_id": "0x826e8001800000000000000c", "G_name": "event", "has": ["0x836f800428000164"], "dtype": "actual", "id": 8 }, { "type": "entity", "symbol": "b", "G_id": "0x826e80018000000000000002", "G_name": "event", "has": ["0x836f800428000162"], "dtype": "actual", "id": 9 }, { "type": "entity", "symbol": "a", "G_id": "0x826e80028000000000000000", "G_name": "log", "has": [], "dtype": "actual", "id": 10 }, { "type": "attribute", "symbol": "f", "G_id": "0x836f8001148000000000000002", "G_name": "index", "value": 2, "datatype": "LONG", "has": [], "dtype": "actual", "id": 11 }, { "type": "attribute", "symbol": "c", "G_id": "0x836f800428000163", "G_name": "eventName", "value": "c", "datatype": "STRING", "has": [], "dtype": "actual", "id": 12 }, { "type": "attribute", "symbol": "c", "G_id": "0x836f800428000161", "G_name": "eventName", "value": "a", "datatype": "STRING", "has": [], "dtype": "actual", "id": 13 }, { "type": "attribute", "symbol": "f", "G_id": "0x836f8001148000000000000000", "G_name": "index", "value": 0, "datatype": "LONG", "has": [], "dtype": "actual", "id": 14 }, { "type": "attribute", "symbol": "e", "G_id": "0x836f80022800034c3131", "G_name": "traceId", "value": "L11", "datatype": "STRING", "has": [], "dtype": "actual", "id": 15 }, { "type": "attribute", "symbol": "c", "G_id": "0x836f800428000164", "G_name": "eventName", "value": "d", "datatype": "STRING", "has": [], "dtype": "actual", "id": 16 }, { "type": "attribute", "symbol": "e", "G_id": "0x836f80022800034c3132", "G_name": "traceId", "value": "L12", "datatype": "STRING", "has": [], "dtype": "actual", "id": 17 }, { "type": "attribute", "symbol": "f", "G_id": "0x836f8001148000000000000003", "G_name": "index", "value": 3, "datatype": "LONG", "has": [], "dtype": "actual", "id": 18 }, { "type": "attribute", "symbol": "e", "G_id": "0x836f80022800034c3130", "G_name": "traceId", "value": "L10", "datatype": "STRING", "has": [], "dtype": "actual", "id": 19 }, { "type": "attribute", "symbol": "f", "G_id": "0x836f8001148000000000000001", "G_name": "index", "value": 1, "datatype": "LONG", "has": [], "dtype": "actual", "id": 20 }, { "type": "attribute", "symbol": "c", "G_id": "0x836f800428000162", "G_name": "eventName", "value": "b", "datatype": "STRING", "has": [], "dtype": "actual", "id": 21 }, { "type": "relation", "symbol": "d", "G_id": "0x847080018000000000000002", "G_name": "trace", "has": ["0x836f8001148000000000000002", "0x836f80022800034c3130"], "edges": { "item": ["0x826e80018000000000000003"], "owner": ["0x826e80028000000000000000"] }, "dtype": "actual", "id": 22 }, { "type": "relation", "symbol": "d", "G_id": "0x847080018000000000000000", "G_name": "trace", "has": ["0x836f8001148000000000000000", "0x836f80022800034c3130"], "edges": { "item": ["0x826e80018000000000000001"], "owner": ["0x826e80028000000000000000"] }, "dtype": "actual", "id": 23 }, { "type": "relation", "symbol": "d", "G_id": "0x847080018000000000000006", "G_name": "trace", "has": ["0x836f8001148000000000000002", "0x836f80022800034c3131"], "edges": { "item": ["0x826e80018000000000000007"], "owner": ["0x826e80028000000000000000"] }, "dtype": "actual", "id": 24 }, { "type": "relation", "symbol": "d", "G_id": "0x84708001800000000000000a", "G_name": "trace", "has": ["0x836f8001148000000000000002", "0x836f80022800034c3132"], "edges": { "item": ["0x826e8001800000000000000b"], "owner": ["0x826e80028000000000000000"] }, "dtype": "actual", "id": 25 }, { "type": "relation", "symbol": "d", "G_id": "0x847080018000000000000004", "G_name": "trace", "has": ["0x836f8001148000000000000000", "0x836f80022800034c3131"], "edges": { "item": ["0x826e80018000000000000005"], "owner": ["0x826e80028000000000000000"] }, "dtype": "actual", "id": 26 }, { "type": "relation", "symbol": "d", "G_id": "0x847080018000000000000008", "G_name": "trace", "has": ["0x836f8001148000000000000000", "0x836f80022800034c3132"], "edges": { "item": ["0x826e80018000000000000009"], "owner": ["0x826e80028000000000000000"] }, "dtype": "actual", "id": 27 }, { "type": "relation", "symbol": "d", "G_id": "0x847080018000000000000003", "G_name": "trace", "has": ["0x836f8001148000000000000003", "0x836f80022800034c3130"], "edges": { "item": ["0x826e80018000000000000004"], "owner": ["0x826e80028000000000000000"] }, "dtype": "actual", "id": 28 }, { "type": "relation", "symbol": "d", "G_id": "0x847080018000000000000007", "G_name": "trace", "has": ["0x836f8001148000000000000003", "0x836f80022800034c3131"], "edges": { "item": ["0x826e80018000000000000008"], "owner": ["0x826e80028000000000000000"] }, "dtype": "actual", "id": 29 }, { "type": "relation", "symbol": "d", "G_id": "0x84708001800000000000000b", "G_name": "trace", "has": ["0x836f8001148000000000000003", "0x836f80022800034c3132"], "edges": { "item": ["0x826e8001800000000000000c"], "owner": ["0x826e80028000000000000000"] }, "dtype": "actual", "id": 30 }, { "type": "relation", "symbol": "d", "G_id": "0x847080018000000000000001", "G_name": "trace", "has": ["0x836f8001148000000000000001", "0x836f80022800034c3130"], "edges": { "item": ["0x826e80018000000000000002"], "owner": ["0x826e80028000000000000000"] }, "dtype": "actual", "id": 31 }], "links": [{ "G_target": "0x836f800428000163", "role": "has", "G_source": "0x826e80018000000000000003", "target": 12, "source": 0, "is_act_Attr": true }, { "G_target": "0x836f800428000161", "role": "has", "G_source": "0x826e80018000000000000001", "target": 13, "source": 1, "is_act_Attr": true }, { "G_target": "0x836f800428000163", "role": "has", "G_source": "0x826e80018000000000000007", "target": 12, "source": 2, "is_act_Attr": true }, { "G_target": "0x836f800428000163", "role": "has", "G_source": "0x826e8001800000000000000b", "target": 12, "source": 3, "is_act_Attr": true }, { "G_target": "0x836f800428000161", "role": "has", "G_source": "0x826e80018000000000000005", "target": 13, "source": 4, "is_act_Attr": true }, { "G_target": "0x836f800428000161", "role": "has", "G_source": "0x826e80018000000000000009", "target": 13, "source": 5, "is_act_Attr": true }, { "G_target": "0x836f800428000164", "role": "has", "G_source": "0x826e80018000000000000004", "target": 16, "source": 6, "is_act_Attr": true }, { "G_target": "0x836f800428000164", "role": "has", "G_source": "0x826e80018000000000000008", "target": 16, "source": 7, "is_act_Attr": true }, { "G_target": "0x836f800428000164", "role": "has", "G_source": "0x826e8001800000000000000c", "target": 16, "source": 8, "is_act_Attr": true }, { "G_target": "0x836f800428000162", "role": "has", "G_source": "0x826e80018000000000000002", "target": 21, "source": 9, "is_act_Attr": true }, { "G_target": "0x836f8001148000000000000002", "role": "has", "G_source": "0x847080018000000000000002", "target": 11, "source": 22, "is_act_Attr": true }, { "G_target": "0x836f80022800034c3130", "role": "has", "G_source": "0x847080018000000000000002", "target": 19, "source": 22, "is_act_Attr": true }, { "G_target": "0x836f8001148000000000000000", "role": "has", "G_source": "0x847080018000000000000000", "target": 14, "source": 23, "is_act_Attr": true }, { "G_target": "0x836f80022800034c3130", "role": "has", "G_source": "0x847080018000000000000000", "target": 19, "source": 23, "is_act_Attr": true }, { "G_target": "0x836f8001148000000000000002", "role": "has", "G_source": "0x847080018000000000000006", "target": 11, "source": 24, "is_act_Attr": true }, { "G_target": "0x836f80022800034c3131", "role": "has", "G_source": "0x847080018000000000000006", "target": 15, "source": 24, "is_act_Attr": true }, { "G_target": "0x836f8001148000000000000002", "role": "has", "G_source": "0x84708001800000000000000a", "target": 11, "source": 25, "is_act_Attr": true }, { "G_target": "0x836f80022800034c3132", "role": "has", "G_source": "0x84708001800000000000000a", "target": 17, "source": 25, "is_act_Attr": true }, { "G_target": "0x836f8001148000000000000000", "role": "has", "G_source": "0x847080018000000000000004", "target": 14, "source": 26, "is_act_Attr": true }, { "G_target": "0x836f80022800034c3131", "role": "has", "G_source": "0x847080018000000000000004", "target": 15, "source": 26, "is_act_Attr": true }, { "G_target": "0x836f8001148000000000000000", "role": "has", "G_source": "0x847080018000000000000008", "target": 14, "source": 27, "is_act_Attr": true }, { "G_target": "0x836f80022800034c3132", "role": "has", "G_source": "0x847080018000000000000008", "target": 17, "source": 27, "is_act_Attr": true }, { "G_target": "0x836f8001148000000000000003", "role": "has", "G_source": "0x847080018000000000000003", "target": 18, "source": 28, "is_act_Attr": true }, { "G_target": "0x836f80022800034c3130", "role": "has", "G_source": "0x847080018000000000000003", "target": 19, "source": 28, "is_act_Attr": true }, { "G_target": "0x836f8001148000000000000003", "role": "has", "G_source": "0x847080018000000000000007", "target": 18, "source": 29, "is_act_Attr": true }, { "G_target": "0x836f80022800034c3131", "role": "has", "G_source": "0x847080018000000000000007", "target": 15, "source": 29, "is_act_Attr": true }, { "G_target": "0x836f8001148000000000000003", "role": "has", "G_source": "0x84708001800000000000000b", "target": 18, "source": 30, "is_act_Attr": true }, { "G_target": "0x836f80022800034c3132", "role": "has", "G_source": "0x84708001800000000000000b", "target": 17, "source": 30, "is_act_Attr": true }, { "G_target": "0x836f8001148000000000000001", "role": "has", "G_source": "0x847080018000000000000001", "target": 20, "source": 31, "is_act_Attr": true }, { "G_target": "0x836f80022800034c3130", "role": "has", "G_source": "0x847080018000000000000001", "target": 19, "source": 31, "is_act_Attr": true }, { "G_target": "0x826e80018000000000000003", "role": "item", "G_source": "0x847080018000000000000002", "target": 0, "source": 22, "is_act_Attr": false }, { "G_target": "0x826e80028000000000000000", "role": "owner", "G_source": "0x847080018000000000000002", "target": 10, "source": 22, "is_act_Attr": false }, { "G_target": "0x826e80018000000000000001", "role": "item", "G_source": "0x847080018000000000000000", "target": 1, "source": 23, "is_act_Attr": false }, { "G_target": "0x826e80028000000000000000", "role": "owner", "G_source": "0x847080018000000000000000", "target": 10, "source": 23, "is_act_Attr": false }, { "G_target": "0x826e80018000000000000007", "role": "item", "G_source": "0x847080018000000000000006", "target": 2, "source": 24, "is_act_Attr": false }, { "G_target": "0x826e80028000000000000000", "role": "owner", "G_source": "0x847080018000000000000006", "target": 10, "source": 24, "is_act_Attr": false }, { "G_target": "0x826e8001800000000000000b", "role": "item", "G_source": "0x84708001800000000000000a", "target": 3, "source": 25, "is_act_Attr": false }, { "G_target": "0x826e80028000000000000000", "role": "owner", "G_source": "0x84708001800000000000000a", "target": 10, "source": 25, "is_act_Attr": false }, { "G_target": "0x826e80018000000000000005", "role": "item", "G_source": "0x847080018000000000000004", "target": 4, "source": 26, "is_act_Attr": false }, { "G_target": "0x826e80028000000000000000", "role": "owner", "G_source": "0x847080018000000000000004", "target": 10, "source": 26, "is_act_Attr": false }, { "G_target": "0x826e80018000000000000009", "role": "item", "G_source": "0x847080018000000000000008", "target": 5, "source": 27, "is_act_Attr": false }, { "G_target": "0x826e80028000000000000000", "role": "owner", "G_source": "0x847080018000000000000008", "target": 10, "source": 27, "is_act_Attr": false }, { "G_target": "0x826e80018000000000000004", "role": "item", "G_source": "0x847080018000000000000003", "target": 6, "source": 28, "is_act_Attr": false }, { "G_target": "0x826e80028000000000000000", "role": "owner", "G_source": "0x847080018000000000000003", "target": 10, "source": 28, "is_act_Attr": false }, { "G_target": "0x826e80018000000000000008", "role": "item", "G_source": "0x847080018000000000000007", "target": 7, "source": 29, "is_act_Attr": false }, { "G_target": "0x826e80028000000000000000", "role": "owner", "G_source": "0x847080018000000000000007", "target": 10, "source": 29, "is_act_Attr": false }, { "G_target": "0x826e8001800000000000000c", "role": "item", "G_source": "0x84708001800000000000000b", "target": 8, "source": 30, "is_act_Attr": false }, { "G_target": "0x826e80028000000000000000", "role": "owner", "G_source": "0x84708001800000000000000b", "target": 10, "source": 30, "is_act_Attr": false }, { "G_target": "0x826e80018000000000000002", "role": "item", "G_source": "0x847080018000000000000001", "target": 9, "source": 31, "is_act_Attr": false }, { "G_target": "0x826e80028000000000000000", "role": "owner", "G_source": "0x847080018000000000000001", "target": 10, "source": 31, "is_act_Attr": false }], "G_types": { "entity": ["log", "event"], "attribute": ["eventName", "traceId", "index"], "relation": ["trace"], "schema": [{ "direction": "down", "target_name": "index", "role": "has", "source_name": "trace" }, { "target_name": "log", "role": "owner", "source_name": "trace", "direction": "down" }, { "target_name": "eventName", "source_name": "event", "role": "has", "direction": "down" }, { "role": "item", "direction": "down", "source_name": "trace", "target_name": "event" }, { "direction": "down", "role": "has", "source_name": "trace", "target_name": "traceId" }] }, "groups": [], "constraints": [] }, "grouped": {} };

//----------------------------------------
// key id functions
var getLinkId = function (d) {
    return d.source.index + "-" + d.target.index;
};
var getNodeId = function (d, i) {
    return d.G_id + "-" + i;
};



//------------------------------------------
// visualisation component
//-----------------------------------------
var G_graph = (function () {



    // load file
    function G_graph(graph, local_svg, theme) {
        var _this = this;

        this.theme = theme
        console.log('width is -> ', width)
        console.log('height is -> ', height)

        console.log('------- Opening data -------')
        console.log(graph)

        this.d3cola = cola.d3adaptor(d3)
            .size([width, height])
            .linkDistance(100)
            .avoidOverlaps(true)
            .handleDisconnected(false)
            .alpha(0);

        console.log('cola loaded')

        this.svg = local_svg;

        console.log('svg setup')


        this.groupgroup = this.svg.append("g")
        this.edgegroup = this.svg.append("g")
        this.nodegroup = this.svg.append("g")



        console.log('DOM groups setup')


        console.log('========')
        console.log(graph)
        _this.edgelist = graph.basic.links;
        _this.nodelist = graph.basic.nodes;
        _this.grouplist = graph.basic.groups;
        _this.constraintlist = graph.basic.constraints;
        _this.data = graph;
        console.log('basic lists loaded')
        console.log('node list is ', graph.basic.nodes)
        console.log('edge list is ', graph.basic.links)
        console.log('node list is ', graph.basic.groups)
        console.log('constraint list is ', graph.basic.constraints)

        this.showGraph();





    };

    // add constraints
    G_graph.prototype.addConstraints = function () {
        console.log('add constraints')
        var _this = this;
        this.d3cola.stop();
        this.d3cola = null;

        this.d3cola = cola.d3adaptor(d3)
            .size([width, height])
            .linkDistance(100)
            .avoidOverlaps(true)
            .handleDisconnected(false)
            .alpha(0);

        //this.d3cola.on("tick", null);
        // change to grouped dataset for nodes and links
        this.edgelist = this.data.grouped.links;
        this.nodelist = this.data.grouped.nodes;
        this.grouplist = this.data.grouped.groups;
        this.constraintlist = this.data.grouped.constraints

        console.log('====================== add constraints ============================')
        console.log('edges are -> ', this.edgelist)
        console.log('nodes are -> ', this.nodelist)
        console.log('groups are -> ', this.grouplist)
        console.log('constraints are -> ', this.constraintlist)
        console.log('d3coal is -> ', this.d3cola)
        console.log('====================== finish constraints ============================')



        // go to setup
        this.showGraph();

    };

    // add constraints
    G_graph.prototype.removeConstraints = function () {
        console.log('add constraints')
        var _this = this;
        this.d3cola.stop();
        this.d3cola = null;

        this.d3cola = cola.d3adaptor(d3)
            .size([width, height])
            .linkDistance(100)
            .avoidOverlaps(true)
            .handleDisconnected(false)
            .alpha(0);

        //this.d3cola.on("tick", null);
        // change to grouped dataset for nodes and links
        this.edgelist = this.data.grouped.links;
        this.nodelist = this.data.grouped.nodes;
        this.grouplist = this.data.grouped.groups;
        this.constraintlist = []

        console.log('====================== removeConstraints constraints ============================')
        console.log('edges are -> ', this.edgelist)
        console.log('nodes are -> ', this.nodelist)
        console.log('groups are -> ', this.grouplist)
        console.log('constraints are -> ', this.constraintlist)
        console.log('d3coal is -> ', this.d3cola)
        console.log('====================== finish removeConstraints ============================')



        // go to setup
        this.showGraph();

    };

    // add constraints
    G_graph.prototype.addCollapsed = function (cgraph) {
        console.log('add constraints')
        var _this = this;
        this.d3cola.stop();
        this.d3cola = null;

        this.d3cola = cola.d3adaptor(d3)
            .size([width, height])
            .linkDistance(100)
            .avoidOverlaps(true)
            .handleDisconnected(false)
            .alpha(0);

        //this.d3cola.on("tick", null);
        // change to grouped dataset for nodes and links
        this.edgelist = cgraph.links;
        this.nodelist = cgraph.nodes;
        this.grouplist = cgraph.groups;
        this.constraintlist = []

        console.log('====================== add constraints ============================')
        console.log('edges are -> ', this.edgelist)
        console.log('nodes are -> ', this.nodelist)
        console.log('groups are -> ', this.grouplist)
        console.log('constraints are -> ', this.constraintlist)
        console.log('d3coal is -> ', this.d3cola)
        console.log('====================== finish constraints ============================')



        // go to setup
        this.showGraph();

    };

    // remove collapsed
    G_graph.prototype.removeCollapsed = function () {
        console.log('add constraints')
        var _this = this;
        this.d3cola.stop();
        this.d3cola = null;

        this.d3cola = cola.d3adaptor(d3)
            .size([width, height])
            .linkDistance(100)
            .avoidOverlaps(true)
            .handleDisconnected(false)
            .alpha(0);

        //this.d3cola.on("tick", null);
        // change to grouped dataset for nodes and links
        this.edgelist = this.data.grouped.links;
        this.nodelist = this.data.grouped.nodes;
        this.grouplist = this.data.grouped.groups;
        this.constraintlist = []

        console.log('====================== removeConstraints constraints ============================')
        console.log('edges are -> ', this.edgelist)
        console.log('nodes are -> ', this.nodelist)
        console.log('groups are -> ', this.grouplist)
        console.log('constraints are -> ', this.constraintlist)
        console.log('d3coal is -> ', this.d3cola)
        console.log('====================== finish removeConstraints ============================')



        // go to setup
        this.showGraph();

    };


    // add shadows
    G_graph.prototype.addShadows = function () {
        console.log('add shadows')
        var _this = this;
        this.d3cola.stop();
        this.d3cola = null;
        //this.d3cola.on("tick", null);
        // change to grouped dataset for nodes and links
        this.edgelist = this.data.grouped.links;
        this.nodelist = this.data.grouped.nodes;
        this.grouplist = [];
        this.constraintlist = [];

        this.d3cola = cola.d3adaptor(d3)
            .size([width, height])
            .linkDistance(100)
            .avoidOverlaps(true)
            .handleDisconnected(false)
            .alpha(0);

        console.log('====================== add addShadows ============================')
        console.log('edges are -> ', this.edgelist)
        console.log('nodes are -> ', this.nodelist)
        console.log('groups are -> ', this.grouplist)
        console.log('constraints are -> ', this.constraintlist)
        console.log('d3coal is -> ', this.d3cola)
        console.log('====================== finish addShadows ============================')


        // go to setup
        this.showGraph();

    };

    // back to basics
    G_graph.prototype.backtoBasics = function () {
        console.log('back to basics')
        var _this = this;
        this.d3cola.stop();
        this.d3cola = null;
        //this.d3cola.on("tick", null);
        // change to grouped dataset for nodes and links
        this.grouplist = this.data.basic.groups;
        this.edgelist = this.data.basic.links;
        this.nodelist = this.data.basic.nodes;
        this.constraintlist = this.data.basic.constraints

        this.d3cola = cola.d3adaptor(d3)
            .size([width, height])
            .linkDistance(100)
            .avoidOverlaps(true)
            .handleDisconnected(false)
            .alpha(0);

        console.log('back to basics, going to show graph')

        console.log('====================== add backtoBasics ============================')
        console.log('edges are -> ', this.edgelist)
        console.log('nodes are -> ', this.nodelist)
        console.log('groups are -> ', this.grouplist)
        console.log('constraints are -> ', this.constraintlist)
        console.log('d3coal is -> ', this.d3cola)
        console.log('====================== finish backtoBasics ============================')


        // go to setup
        this.showGraph();

    };

    // disconnect node
    G_graph.prototype.map = function () {
        console.log('map')
        var _this = this;
        this.d3cola.stop();
        //this.d3cola = null;
        //this.d3cola.on("tick", null);
        this.edgelist = []
        this.grouplist = []
        this.constraintlist = []
        this.nodelist = this.nodelist.filter(function (e, i) {
            return e.type == 'super'
        })
        console.log('====================== disconnAttributes ============================')
        console.log('edges are -> ', this.edgelist)
        console.log('previous edges are -> ', this.prev_edgelist)
        console.log('nodes are -> ', this.nodelist)
        console.log('previous nodes are -> ', this.prev_nodelist)
        console.log('groups are -> ', this.grouplist)
        console.log('constraints are -> ', this.constraintlist)
        console.log('d3coal is -> ', this.d3cola)
        console.log('====================== finish disconnAttributes ============================')

        this.svg.selectAll('g').remove();
        this.mapgroup = this.svg.append("g")
        this.nodelist.forEach(function (s) {
            var local_name = (s.display_name == 'NULL') ? null : s.leaf_description[3].value
            s.display_name = local_name;
            s.latitude = parseFloat(s.leaf_description[4].value);
            s.longitude = parseFloat(s.leaf_description[5].value);
            console.log(' station name', s.display_name)
            console.log(' latitude ', s.latitude)
            console.log(' longitude', s.longitude)
        });
        var margin = { top: 20, right: 20, bottom: 30, left: 40 }
        var w = Math.max(760, width) - margin.left - margin.right
        var h = Math.max(500, height) - margin.top - margin.bottom
        // Find min and max long and lat
        var minLat = d3.min(_this.nodelist, function (d) { return d.latitude });
        var minLon = d3.min(_this.nodelist, function (d) { return d.longitude });
        var maxLat = d3.max(_this.nodelist, function (d) { return d.latitude });
        var maxLon = d3.max(_this.nodelist, function (d) { return d.longitude });
        console.log(' minLat ', minLat, ' minlon ', minLon)
        console.log('maxLat ', maxLat, ' maxLon ', maxLon)
        // Set up the scales
        var x = d3.scaleLinear()
            .domain([minLon, maxLon])
            .range([0, w]);

        var y = d3.scaleLinear()
            .domain([minLat, maxLat])
            .range([h, 0]);

        // Set up the axis
        var xAxis = d3.axisBottom()
            .scale(x)
            .tickSize(-h);

        var yAxis = d3.axisLeft()
            .scale(y)
            .ticks(5)
            .tickSize(-w);

        // Drawing all the stations
        var station = this.mapgroup.selectAll("station")
            .data(this.nodelist)
            .enter().append("circle")
            .attr("class", "station")
            .attr("id", function (d) { return 'station' + d.id })
            .attr("cx", function (d) { return x(d.longitude); })
            .attr("cy", function (d) { return y(d.latitude); })
            .attr("data-cx", function (d) { return d.longitude; })
            .attr("data-cy", function (d) { return d.latitude; })
            .attr("title", function (d) {
                console.log('id is ', d.id)
                console.log(' lon is ', d.longitude)
                console.log(' lon is ', d.latitude)

                return d.name
            })
            .attr("r", 2)
            .style("stroke", 'gray')
            .style("fill", 'orange')
            .style("opacity", 1)
            .call(d3.drag)
            .on("mouseover", d => _this.mouseover(d))
            .on("mousemove", d => _this.mousemove(d))
            .on("mouseout", d => _this.mouseleave(d));

        // Adding axis
        main_viz_svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + h + ")")
            .call(xAxis);

        main_viz_svg.append("g")
            .attr("class", "y axis")
            .call(yAxis);



    };

    // disconnect node
    G_graph.prototype.disconnAttributes = function () {
        console.log('disconnect attributes')
        var _this = this;
        this.d3cola.stop();
        //this.d3cola = null;
        //this.d3cola.on("tick", null);
        this.prev_edgelist = this.edgelist
        this.edgelist = this.edgelist.filter(function (e, i) {
            return e.is_act_Attr == false;
        })
        this.prev_nodelist = this.nodelist
        this.nodelist = this.nodelist.filter(function (e, i) {
            if ((e.type != 'attribute')) {
                return e
            }
            if ((e.type == 'attribute')) {
                if (e.dtype != 'actual') {
                    return e
                }
            }
        })
        console.log('====================== disconnAttributes ============================')
        console.log('edges are -> ', this.edgelist)
        console.log('previous edges are -> ', this.prev_edgelist)
        console.log('nodes are -> ', this.nodelist)
        console.log('previous nodes are -> ', this.prev_nodelist)
        console.log('groups are -> ', this.grouplist)
        console.log('constraints are -> ', this.constraintlist)
        console.log('d3coal is -> ', this.d3cola)
        console.log('====================== finish disconnAttributes ============================')

        this.d3cola = cola.d3adaptor(d3)
            .size([width, height])
            .linkDistance(100)
            .avoidOverlaps(true)
            .handleDisconnected(false)
            .alpha(0);

        // go to setup
        this.showGraph();
    };

    // connect node
    G_graph.prototype.connAttributes = function () {
        console.log('connect attributes')
        var _this = this;
        this.d3cola.stop();
        this.d3cola = null;
        //this.d3cola.on("tick", null);
        this.edgelist = this.prev_edgelist
        this.nodelist = this.prev_nodelist
        console.log(this.edgelist)

        this.d3cola = cola.d3adaptor(d3)
            .size([width, height])
            .linkDistance(100)
            .avoidOverlaps(true)
            .handleDisconnected(false)
            .alpha(0);

        console.log('====================== connAttributes ============================')
        console.log('edges are -> ', this.edgelist)
        console.log('nodes are -> ', this.nodelist)
        console.log('groups are -> ', this.grouplist)
        console.log('constraints are -> ', this.constraintlist)
        console.log('d3coal is -> ', this.d3cola)
        console.log('====================== finish connAttributes ============================')

        // go to setup
        this.showGraph();
    };

    // setup groups
    G_graph.prototype.setupGroups = function () {
        console.log('setup Groups')
        var _this = this;
        this.d3cola.stop();
        //this.d3cola = null;
        //this.d3cola.on("tick", null);
        // change to grouped dataset for nodes and links
        this.edgelist = this.data.grouped.links;
        this.nodelist = this.data.grouped.nodes;
        this.grouplist = this.data.grouped.groups;
        this.constraintlist = []

        this.d3cola = cola.d3adaptor(d3)
            .size([width, height])
            .linkDistance(100)
            .avoidOverlaps(true)
            .handleDisconnected(false)
            .alpha(0);


        console.log('====================== setupGroups ============================')
        console.log('edges are -> ', this.edgelist)
        console.log('nodes are -> ', this.nodelist)
        console.log('groups are -> ', this.grouplist)
        console.log('constraints are -> ', this.constraintlist)
        console.log('d3coal is -> ', this.d3cola)
        console.log('====================== finish setupGroups ============================')

        // go to setup
        this.showGraph();

    };

    // dissolve groups
    G_graph.prototype.dissolveGroups = function () {
        console.log('dissolve groups')
        var _this = this;
        this.d3cola.stop();
        this.d3cola = null;
        //this.d3cola.on("tick", null);
        // change to grouped dataset for nodes and links
        this.grouplist = this.data.basic.groups;
        this.constraintlist = this.data.basic.constraints

        this.d3cola = cola.d3adaptor(d3)
            .size([width, height])
            .linkDistance(100)
            .avoidOverlaps(true)
            .handleDisconnected(false)
            .alpha(0);

        console.log('====================== dissolveGroups ============================')
        console.log('edges are -> ', this.edgelist)
        console.log('nodes are -> ', this.nodelist)
        console.log('groups are -> ', this.grouplist)
        console.log('constraints are -> ', this.constraintlist)
        console.log('d3coal is -> ', this.d3cola)
        console.log('====================== finish dissolveGroups ============================')
        // go to setup
        this.showGraph();

    };


    // regular tick
    var regularTick = function (link, node, label, group, offset) {
        link.attr("x1", function (d) { return d.source.x; })
            .attr("y1", function (d) { return d.source.y; })
            .attr("x2", function (d) { return d.target.x; })
            .attr("y2", function (d) { return d.target.y; });

        node.attr("x", function (d) { return d.x - d.width / 2; })
            .attr("y", function (d) { return d.y - d.height / 2; });

        group.attr("x", function (d) { return d.bounds.x - pad; })
            .attr("y", function (d) { return d.bounds.y - pad; })
            .attr("width", function (d) { return d.bounds.width() + 2 * pad; })
            .attr("height", function (d) { return d.bounds.height() + 2 * pad; });

        label.attr("x", function (d) { return d.x; })
            .attr("y", function (d) {
                var h = this.getBBox().height;
                if (d.type != 'relation') {
                    return d.y + h / 4;
                } else {
                    return d.y - h - offset;
                }
            });
    };



    //-----------------------------------------
    // tooltip stuff
    //----------------------------------------------
    // A function that change this tooltip when the user hover a point.
    // Its opacity is set to 1: we can now see it. Plus it set the text and position of tooltip depending on the datapoint (d)
    G_graph.prototype.mouseover = function (d) {
        console.log('i am inside mouseover ', this.tooltip.style, d)
        var tt_options = this.theme.tt_description
        var tt_theme = this.theme.tooltip
        var loc_theme = this.theme

        function get2ndLeafSummary(int_list1, tt_options, dash, indent) {
            var local_desc = '';
            local_layer = int_list1[0]
            console.log('getLeaf, level 2')
            console.log('local layer, ', local_layer)
            local_desc += indent + dash
            if (local_layer.direction == "down") {
                local_desc += '<i>links ' + local_layer.role + '</i> '
            } else {
                local_desc += '<i>plays ' + local_layer.role + '</i> '
            }
            local_desc += getLeafSummary(int_list1, tt_options, dash, indent)

            return local_desc

        }

        function getLeafSummary(int_list1, tt_options, dash, indent) {
            var local_desc = '';
            console.log('-------------- Leaf Summary ------------------')
            console.log('list is ', int_list1)
            // title
            local_layer = int_list1[0]
            console.log('getLeaf, level 1')
            console.log('local layer, ', local_layer)
            local_desc += (tt_options.title) ? ('<b>' + local_layer.title + '</b>') : '';
            local_desc += (tt_options.boldtitle) ? '<br/>' : '<br/>';
            // main leaf
            console.log('getLeaf, level 1')
            local_layer = int_list1[1]
            console.log('local layer, ', local_layer)
            local_desc += indent + dash;
            local_desc += (tt_options.type) ? ('(' + local_layer.type + ') ') : '';
            local_desc += (tt_options.name) ? (local_layer.name + ' ') : '';
            local_desc += (tt_options.value) ? (' :' + local_layer.value) : '';
            local_desc += '<br/>'
            console.log('end of Leaf, level 1')
            // secondary leaves
            for (i = 2; i < int_list1.length; i++) {
                console.log('getLeaf, level ', i)
                local_layer = int_list1[i]
                local_desc += indent + dash;
                local_desc += (tt_options.role) ? ('<i>' + local_layer.role + '</i> ') : '';
                local_desc += (tt_options.type) ? ('(' + local_layer.type + ') ') : '';
                local_desc += (tt_options.name) ? (local_layer.name + ' ') : '';
                local_desc += (tt_options.value) ? (' :' + String(local_layer.value)) : '';
                local_desc += '<br/>'
            }

            return local_desc

        }

        function getGroupSummary(int_list2, tt_options, dash, indent) {
            var local_desc = '';
            // title
            local_layer = int_list2[0]
            local_desc += (tt_options.title) ? ('<b>' + local_layer.title + '</b>') : '';
            local_desc += (tt_options.boldtitle) ? '<br/>' : '<br/>';
            // number of sub groups
            local_layer = int_list2[1]
            local_desc += indent + dash;
            local_desc += (tt_options.number) ? (String(local_layer.number) + ' x ') : '';
            local_desc += (tt_options.subtitle) ? (local_layer.subtitle) : '';
            local_desc += '<br/>'
            // condition for sub groups
            local_layer = int_list2[2]
            local_desc += indent + dash;
            local_desc += (tt_options.where) ? ('<i>' + 'where' + '</i> ') : '';
            local_desc += (tt_options.g_G_name) ? (local_layer.condition_g_G_name + ' ') : '';
            local_desc += (tt_options.g_role) ? ('<i>' + local_layer.condition_g_role + '</i> ' + ' ') : '';
            local_desc += (tt_options.v_G_name) ? (local_layer.condition_v_G_name + ' = ') : '';
            local_desc += (tt_options.v_Value) ? String(local_layer.condition_value) : '';
            local_desc += '<br/>'

            return local_desc

        }



        const space = '          ';
        const dash = ' - ';
        const nil = '';
        var desc_string, desc_string2;
        var pgraph_style = '<p style="font-size:12px">'
        pgraph_style += '<font color="' + tt_theme.tcolour + '">'
        if ('group_type' in d) {
            var groupType = d.group_type;

            switch (groupType) {
                case "group_of_leaves":
                    list1 = d.leaf_description
                    desc_string = pgraph_style
                    desc_string += getLeafSummary(list1, tt_options, dash, nil)
                    desc_string += '</p>'
                    break

                case "leaves_to_group":
                    list1 = d.leaf_description
                    list2 = d.group_description
                    desc_string = pgraph_style
                    console.log('=========================================')
                    console.log('leaves to group')
                    desc_string += getLeafSummary(list1, tt_options, dash, nil)
                    console.log('description 1, ', desc_string)
                    console.log('list 2 is  ', list2)
                    desc_string += get2ndLeafSummary(list2[0], tt_options, dash, space)
                    console.log('description 2, ', desc_string)
                    console.log('=======================================')
                    desc_string += '</p>'
                    break

                case "group_of_groups":
                    list2 = d.group_description
                    desc_string = pgraph_style
                    desc_string += getGroupSummary(list2, tt_options, dash, nil)
                    desc_string += '</p>'
                    break

                case "leaves_to_group_of_groups":
                    list1 = d.leaf_description
                    list2 = d.group_description
                    desc_string = pgraph_style
                    desc_string += getLeafSummary(list1, tt_options, dash, nil)
                    desc_string += getGroupSummary(list2, tt_options, dash, space)
                    desc_string += '</p>'
                    break

                default:
                    desc_string = 'Problem with group type'
            }

        } else {
            // its an attribute, entity or relation
            desc_string = pgraph_style
            switch (d.type) {
                case 'entity':
                    console.log("Line 741, ", d.G_name, this)
                    local_title = 'Entity : ' + d.G_name
                    desc_string += (tt_options.title) ? ('<b>' + local_title + '</b>') : '';
                    desc_string += (tt_options.boldtitle) ? '<br/>' : '<br/>';
                    // iid
                    desc_string += dash + 'iid : '
                    desc_string += this.get_local_iid(d.G_id, loc_theme.entity.iid_shorten)
                    desc_string += '<br/>'
                    // has
                    for (var i = 0; i < d.has.length; i++) {
                        desc_string += dash + '(has) - '
                        desc_string += this.get_local_iid(d.has[i], loc_theme.entity.iid_shorten)
                        desc_string += '<br/>'
                    }
                    break

                case 'attribute':
                    local_title = 'Attribute : ' + d.G_name
                    desc_string += (tt_options.title) ? ('<b>' + local_title + '</b>') : '';
                    desc_string += (tt_options.boldtitle) ? '<br/>' : '<br/>';
                    // iid
                    desc_string += dash + 'value : '
                    desc_string += d.value
                    desc_string += '<br/>'
                    // has
                    for (var i = 0; i < d.has.length; i++) {
                        desc_string += dash + '(has) - '
                        desc_string += this.get_local_iid(d.has[i], loc_theme.entity.iid_shorten)
                        desc_string += '<br/>'
                    }
                    break

                case 'relation':
                    local_title = 'Relation : ' + d.G_name
                    desc_string += (tt_options.title) ? ('<b>' + local_title + '</b>') : '';
                    desc_string += (tt_options.boldtitle) ? '<br/>' : '<br/>';
                    // iid
                    desc_string += dash + 'iid : '
                    desc_string += this.get_local_iid(d.G_id, loc_theme.relation.iid_shorten)
                    desc_string += '<br/>'
                    // has
                    for (var i = 0; i < d.has.length; i++) {
                        desc_string += dash + '(has) - '
                        desc_string += this.get_local_iid(d.has[i], loc_theme.relation.iid_shorten)
                        desc_string += '<br/>'
                    }
                    break
            }
            desc_string += '</p>'

        }


        this.tooltip
            .style("opacity", 1, 999)
            .html(desc_string);

        console.log("final tooltip", this.tooltip, desc_string)
    }

    G_graph.prototype.get_local_iid = function (G_id, iid_shorten) {
        if (iid_shorten != true) {
            return G_id
        } else {
            var regex_check = /[0]{4,}/
            var regex_replace = '0..0'
            return G_id.replace(regex_check, regex_replace)
        }
    }

    G_graph.prototype.mousemove = function (d) {
        //console.log('i am inside mousemove ', this.tooltip)
        this.tooltip
            .style("opacity", 1)
            .style("top", (event.pageY - mouseTipX) + "px")
            .style("left", (event.pageX + mouseTipY) + "px");

    }

    // A function that change this tooltip when the leaves a point: just need to set opacity to 0 again
    G_graph.prototype.mouseleave = function (d) {
        //console.log('i am inside mouseleave ', this.tooltip)
        this.tooltip
            .transition()
            .duration(200)
            .style("opacity", 0);
    }

    // loaded
    G_graph.prototype.showGraph = function () {
        var _this = this;



        console.log('in show graph')
        console.log('d3cola is ', this.d3cola)
        console.log('nodes are ', this.nodelist)
        console.log('groups is ', this.grouplist)
        console.log('edges are ', this.edgelist)

        this.d3cola
            .nodes(_this.nodelist)
            .links(_this.edgelist)
            .groups(_this.grouplist)
            .constraints(_this.constraintlist)
            .handleDisconnected(false)
            .start(5);

        console.log('d3 loaded')

        this.group = this.groupgroup.selectAll(".group")
            .data(_this.grouplist);

        this.group.exit().remove();

        this.groupmerge = this.group.enter().append("rect")
            // .attr("rx", grp_corner).attr("ry", grp_corner)
            .attr("class", "group")
            .style("fill", function (d, i) {
                return colors.find(colour => colour.name == d.colour_list)['colors'][d.level];
            })
            .attr("stroke-width", 1)
            .attr("stroke", function (d, i) {
                return colors.find(colour => colour.name == d.colour_list)['colors'][7];
            })
            .call(_this.d3cola.drag)
            .on("mouseover", d => _this.mouseover(d))
            .on("mousemove", d => _this.mousemove(d))
            .on("mouseout", d => _this.mouseleave(d))
            .merge(_this.group);

        console.log('groups setup')

        //this.group.append("title")
        //  .text(function (d) { return d.label; });

        this.link = this.edgegroup.selectAll(".link")
            .data(_this.edgelist, getLinkId);

        this.link.exit().remove();

        this.linkmerge = this.link.enter().append("line")
            .attr("class", "link")
            .style("stroke-width", _this.theme.edges.stroke)
            .style("cursor", "default")
            .attr('stroke', _this.theme.edges.colour)
            .merge(_this.link)
            .attr("x1", function (d) { return d.source.x; })
            .attr("y1", function (d) { return d.source.y; })
            .attr("x2", function (d) { return d.target.x; })
            .attr("y2", function (d) { return d.target.y; });

        console.log('links are setup')

        this.node = this.nodegroup.selectAll(".node")
            .data(_this.nodelist, getNodeId);

        this.node.exit().remove();

        this.nodemerge = this.node.enter().append("rect")
            .attr('class', function (d) {
                return "node " + d.type + ' ' + d.G_name;
            })
            .attr('id', d => d.G_id)
            .merge(_this.node);

        console.log('nodes are loaded')

        this.label = this.nodegroup.selectAll(".label")
            .data(_this.nodelist, getNodeId);

        this.label.exit().remove();

        this.labelmerge = this.label.enter()
            .append("text")
            .attr("class", "label")
            .style("pointer-events", "none")
            .style("cursor", "default")
            .attr('id', d => 'heading-' + d.G_id)
            .style('text-anchor', 'middle')
            .text(d => getLabelText(d))
            .style('font-size', d => d.tsize)
            .style('fill', d => d.tcolour)
            .call(_this.d3cola.drag)
            .merge(_this.label);

        console.log('labels loaded ..')
        console.log(document, window)

        // function to setup tooltip
        this.tooltip = d3.select(document).select("body")
            .append("div")
            .style('display', 'block')
            .style("position", "absolute")
            .style("opacity", 0)
            .style("background-color", _this.theme.tooltip.fill)
            .style("border", "solid")
            .style("border-width", _this.theme.tooltip.stroke)
            .style("border-color", _this.theme.tooltip.scolour)
            .style("border-radius", _this.theme.tooltip.corner)
            .style("padding", _this.theme.tooltip.padding);

        // function to handle the text
        function getLabelText(d) {
            var loc_type = d.type;
            loc_str = ''
            switch (loc_type) {
                case 'attribute':
                    if (_this.theme.attribute.label_name == true) {
                        loc_str = loc_str + d.G_name
                    }
                    if ((_this.theme.attribute.label_name == true) & (_this.theme.attribute.label_value == true)) {
                        loc_str = loc_str + ': '
                    }
                    if (_this.theme.attribute.label_value == true) {
                        loc_str = loc_str + d.value
                    }
                    if (d.dtype == 'actual') {
                        d.tcolour = _this.theme.attribute.tcolour
                    } else {
                        d.tcolour = _this.theme.shadow.tcolour
                    }
                    d.tsize = _this.theme.attribute.tsize
                    d.split = _this.theme.attribute.split_line
                    d.label = loc_str
                    break;

                case 'entity':
                    if (_this.theme.entity.label_name == true) {
                        loc_str = loc_str + d.G_name
                    }
                    if ((_this.theme.entity.label_name == true) & (_this.theme.entity.label_iid == true)) {
                        loc_str = loc_str + ': '
                    }
                    if (_this.theme.entity.label_iid == true) {
                        loc_str = loc_str + _this.get_local_iid(d.G_id, _this.theme.entity.iid_shorten)
                    }
                    d.tcolour = _this.theme.entity.tcolour
                    d.tsize = _this.theme.entity.tsize
                    d.split = _this.theme.entity.split_line
                    d.label = loc_str
                    break

                case 'relation':
                    if (_this.theme.relation.label_name == true) {
                        loc_str = loc_str + d.G_name
                    }
                    if ((_this.theme.relation.label_name == true) & (_this.theme.relation.label_iid == true)) {
                        loc_str = loc_str + ': '
                    }
                    if (_this.theme.relation.label_iid == true) {
                        loc_str = loc_str + _this.get_local_iid(d.G_id, _this.theme.relation.iid_shorten)
                    }
                    d.tcolour = _this.theme.relation.tcolour
                    d.tsize = _this.theme.relation.tsize
                    d.split = _this.theme.relation.split_line
                    d.label = loc_str
                    break

                case 'super':
                    if (_this.theme.super.label_name == true) {
                        loc_str = loc_str + d.G_name
                    }
                    if ((_this.theme.super.label_name == true) & (_this.theme.super.label_iid == true)) {
                        loc_str = loc_str + ': '
                    }
                    if (_this.theme.super.label_iid == true) {
                        loc_str = loc_str + _this.get_local_iid(d.G_id, _this.theme.super.iid_shorten)
                    }
                    d.tsize = _this.theme.super.tsize
                    d.split = _this.theme.super.split_line
                    d.label = loc_str
                    break

                default:
                    loc_str = 'default string'
                    d.tcolour = 'black'
                    d.tsize = '10px'
                    d.split = false
                    d.label = loc_str

            }
            return loc_str
        }

        var wrapLabel = function (d) {
            var text = d3.select(this)
            console.log('el is ', text)
            console.log('d is ', d)
            console.log('d.label is', d.label)

            var words = []
            if (d.split) {
                words = d.label.split(/\s+/);
            } else {
                words.push(d.label)
            }

            text.text(null);
            var lineNumber = 0,
                lineHeight = 1.1, //em's
                y = text.attr('y'),
                dy = parseFloat(text.attr("dy"))
            dx = parseFloat(text.attr("dy"))
            console.log('dy is ', dy)


            for (var i = 0; i < words.length; i++) {
                var tspan = text.append('tspan').text(words[i]);
                tspan.attr('x', 0).attr('y', y)
                    .attr("dy", ++lineNumber * lineHeight + dy + "em")
                    .attr("dx", dx);
            }
        }

        //this.labelmerge.each(wrapLabel)

        console.log('about to do node merge')

        this.nodemerge
            .attr('width', d => nodeWidth(d))
            .attr('height', d => d.height)
            .attr('rx', d => d.corner)
            .attr('ry', d => d.corner)
            .attr('x', d => d.x)
            .attr('y', d => d.y)
            .style("fill", d => d.colour)
            .on("mouseover", d => _this.mouseover(d))
            .on("mousemove", d => _this.mousemove(d))
            .on("mouseout", d => _this.mouseleave(d))
            .on('dblclick', releasenode)
            .call(_this.d3cola.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        //this.nodemerge.append("title")
        //.text(function (d) { return d.label })

        console.log('node 2 is loaded')

        function dragstarted(d) {
            console.log('================= start drag ==========')
            console.log('cola is   ', cola)
            console.log('d.fx  ', d.fx, ' d.fy ', d.fy)
            console.log('d.x  ', d.x, ' d.y ', d.y)
            if (!_this.d3cola.active) _this.d3cola.start();
            d3.select(this).classed("fixed", d.fixed = true);
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(d) {
            console.log('================= i am dragged ==========')
            console.log('cola is   ', cola)
            console.log('d.fx  ', d.fx, ' d.fy ', d.fy)
            console.log('d.x  ', d.x, ' d.y ', d.y)
            d.fx = d3.event.x;
            d.fy = d3.event.y;
        }

        function dragended(d) {
            console.log('================= end drag ==========')
            console.log('cola is   ', cola)
            console.log('d.fx  ', d.fx, ' d.fy ', d.fy)
            console.log('d.x  ', d.x, ' d.y ', d.y)
            if (!_this.d3cola.active) _this.d3cola.start();
            // Allows NODE FIXING
            d.fx = null;
            d.fy = null;
        }
        function releasenode(d) {
            console.log('================= release node ==========')
            console.log('cola is   ', cola)
            console.log('d.fx  ', d.fx, ' d.fy ', d.fy)
            console.log('d.x  ', d.x, ' d.y ', d.y)
            d3.select(this).classed("fixed", d.fixed = false);
            d.fx = null;
            d.fy = null;
            if (!_this.d3cola.active) _this.d3cola.start();
        }


        // function to set dimensions and colours for shapes
        function nodeWidth(d) {
            let headingid = '#heading-' + d.G_id;
            let headingbbox = d3.select(headingid).node().getBBox();

            d.width = d3.max([5, headingbbox.width]) + (textPadding * 2)
            d.height = headingbbox.height + textPadding * 2

            function double_px(px_value) {
                // split string
                var local_val = px_value.slice(0, -2)
                var local_int = parseInt(local_val)
                return toString(2 * local_int) + "px"
            }

            // attributes and entities rounded rectangle, relation is circle
            switch (d.type) {
                case 'attribute':
                    d.corner = _this.theme.attribute.corner
                    d.x = headingbbox.x - textPadding
                    d.y = headingbbox.y - textPadding
                    if (d.dtype === 'shadow') {
                        d.colour = _this.theme.shadow.colour;
                    } else {
                        d.colour = _this.theme.attribute.colour;
                    }
                    break;

                case 'entity':
                    d.corner = _this.theme.entity.corner
                    d.colour = _this.theme.entity.colour
                    d.x = headingbbox.x - textPadding
                    d.y = headingbbox.y - textPadding
                    break;

                case 'relation':
                    d.width = _this.theme.relation.radius * 2
                    d.height = _this.theme.relation.radius * 2
                    d.corner = _this.theme.relation.radius
                    d.colour = _this.theme.relation.colour
                    d.x = headingbbox.x + (headingbbox.width) / 2 - d.width / 2
                    d.y = headingbbox.y + d.height / 2
                    break;

                case 'super':
                    d.width = _this.theme.super.radius * 2
                    d.height = _this.theme.super.radius * 2
                    d.corner = _this.theme.super.radius
                    d.colour = colors.find(colour => colour.name == d.colour_list)['colors'][d.level];
                    d.x = headingbbox.x + (headingbbox.width) / 2 - d.width / 2
                    d.y = headingbbox.y + d.height / 2
                    break;

                default:
                    break;
            }
            return d.width;
        };

        console.log('d3 cola is -> ', this.d3cola)

        this.d3cola.on("tick", function () { regularTick(_this.linkmerge, _this.nodemerge, _this.labelmerge, _this.groupmerge, _this.theme.relation.label_offset) });


    };

    return G_graph;

})();


// run the viz algorithm
new G_graph(Graph_Data, local_svg, theme)
`;

async function d3graphComponentMounted(id, component) {
    var htmlData = defaultHTMLData;
    const fetchData = async (dataSourceURL) => {
        try {
            const response = await fetch(dataSourceURL).then((res) => res.text());
            if (response) htmlData = response;
        } catch (error) {
            console.log(error, "HE")
        }
    };
    // if (component.getAttribute("data-html")) {
    //     await fetchData(component.getAttribute("data-html"));
    // }
    htmlData = htmlData.replaceAll("#svg", `#d3graphSvg`);

    setTimeout(htmlData, 1);
}

$(document).ready(function (e) {
    Array.from(document.querySelectorAll("#d3graph")).forEach(component => {
        var componentDataPath = component.getAttribute("data-path");
        component.setAttribute("id", componentDataPath);
        d3graphComponentMounted(componentDataPath, component);
    })
});