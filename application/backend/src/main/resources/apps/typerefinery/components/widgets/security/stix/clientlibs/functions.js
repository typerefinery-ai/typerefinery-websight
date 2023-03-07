window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Widgets = Typerefinery.Components.Widgets || {};
window.Typerefinery.Components.Widgets.Security = Typerefinery.Components.Widgets.Security || {};
window.Typerefinery.Components.Widgets.Security.Stix = Typerefinery.Components.Widgets.Chart.Stix || {};
window.Typerefinery.Page.Tms = Typerefinery.Page.Tms || {};


(function ($, ns, tmsNs, componentNs, d3, stix2viz, document, window) {
  "use strict";
  class ComponentElements {
    canvasElement = null;
    legendElement = null;
    selectedElement = null;
    simpleListElement = null;
    linkedNodesElement = null;
  }

  /* ******************************************************
   * Comon functions
   * ******************************************************/

  ns.init = function ($component) {
    // var $selected = $component.find("#stix-selected-node-content");
    // var $linkedNodes = $component.find("#stix-linked-nodes-content");
    // var $legend = $component.find("#stix-legend-content");
    // var $simpleList = $component.find("#stix-simple-list");
    // // uploader = document.getElementById('uploader');
    // // canvasContainer = document.getElementById('canvas-container');
    // var canvas = $component.find("#stix-canvas");
    // // styles = window.getComputedStyle(uploader);
    // console.log("Initializing STIX visualizer");
    // console.log([$component, $selected, $linkedNodes, $legend, canvas]);

    // create a class with all the elements we need to pass to the visualizer
    // var componentElements = new ComponentElements();
    // componentElements.canvasElement = canvas.get(0);
    // componentElements.legendElement = $legend.get(0);
    // componentElements.selectedElement = $selected.get(0);
    // componentElements.simpleListElement = $simpleList.get(0);
    // componentElements.linkedNodesElement = $linkedNodes.get(0);

    // var dataUrl = $component.data("dataUrl".toLowerCase());


    // var maxCount = ns.parseIntOrDefault($component.data("maxCount".toLowerCase()), 200);
    // console.log(["dataUrl",dataUrl, "maxCount", maxCount]);


    // parse json value from data-model attribute as component config
    const componentConfig = componentNs.getComponentConfig($component);

    console.log(["componentConfig",componentConfig]);

    const componentTopic = componentConfig?.flowapi_topic;
    const componentHost = componentConfig.flowapi_websocketurl;
    const componentPath = componentConfig.resourcePath;
    // TMS.
    if (componentHost && componentTopic) {            
        ns.connectToTMS(componentHost, componentTopic, $component);
    } else if (componentDataSource) {
        ns.loadDataFromJson(componentDataSource, $component);
    } else {
       ns.alert("No data source found.");
    }

  }    

  // update component with data and start vizualization
  ns.updateComponentWithData = (data, $component) => {
    if (!$component && !data) {
        return;
    }
    // const componentConfig = componentNs.getComponentConfig($component);

    console.log("Initializing STIX visualizer");

    var $selected = $component.find("#stix-selected-node-content");
    var $linkedNodes = $component.find("#stix-linked-nodes-content");
    var $legend = $component.find("#stix-legend-content");
    var $simpleList = $component.find("#stix-simple-list");
    // uploader = document.getElementById('uploader');
    // canvasContainer = document.getElementById('canvas-container');
    var $canvas = $component.find("#stix-canvas");
    // styles = window.getComputedStyle(uploader);

    var maxCount = ns.parseIntOrDefault($component.data("maxCount".toLowerCase()), 200);

    console.log([$component, $selected, $linkedNodes, $legend, $simpleList, $canvas]);

    var componentElements = new ComponentElements();
    componentElements.canvasElement = $canvas.get(0);
    componentElements.legendElement = $legend.get(0);
    componentElements.selectedElement = $selected.get(0);
    componentElements.simpleListElement = $simpleList.get(0);
    componentElements.linkedNodesElement = $linkedNodes.get(0);

    var cfg = {
      iconDir: "/apps/typerefinery/components/widgets/security/stix/clientlibs/resources/stix2viz/icons"
    }

    ns.vizStixWrapper(data, cfg, componentElements, maxCount);
    
  }

  // load data from json source
  ns.loadDataFromJson = async (dataSourceURL, $component) => {
    try {
        const response = await fetch(dataSourceURL).then((res) => res.json());
        if (response) {
            ns.updateComponentWithData(response, $component);
            return;
        }
    } catch (error) {
        ns.alert(`Could load data from JsonL: ${dataSourceURL}`);
        ns.alert(error);
    }
  }

  // TMS callaback
  ns.tmsCallback = (data, $component) => {
    ns.alert("Recived data from TMS.");
    ns.updateComponentWithData(data, $component);
  }

  // connect to TMS
  ns.connectToTMS = async (host, topic, $component) => {
    try {
        if (!topic || !host) {
            ns.alert("Topic or host is not specified can't connect.");
            return;
        }
        
        let componentConfig = componentNs.getComponentConfig($component);
        tmsNs.registerToTms(host, topic, componentConfig.resourcePath, (data) => ns.tmsCallback(data, $component));
        const componentData = localStorage.getItem(`${topic}`);
        if (componentData) {
          ns.updateComponentWithData(JSON.parse(componentData), $component);
        } else {
          ns.alert("No data found in local storage.");
        }
    } catch (error) {
      ns.alert(`Could not connect to TMS host: ${host}, topic: ${topic}.`);
      ns.alert(error);
    }
  }


  ns.parseIntOrDefault = function (value, defaultValue) {
    var parsed = parseInt(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  
  /* ******************************************************
   * Initializes the graph, then renders it.
   * ******************************************************/
  ns.vizStixWrapper = function(content, customConfig, componentElements, maxCount) {

    // initialize the visualizer
    var visualizer = new stix2viz.Viz(
      componentElements.canvasElement, 
      customConfig, 
      function(data) { console.log(["vizStixWrapper - populateLegend", data]); ns.populateLegend(visualizer, componentElements.legendElement, data); }, 
      function(data) { console.log(["vizStixWrapper - populateSelected", data]); ns.populateSelected(visualizer, componentElements.selectedElement, componentElements.linkedNodesElement, data); }, 
      function(data) { console.log(["vizStixWrapper - populateList", data]);  ns.populateList(visualizer, componentElements.selectedElement, componentElements.linkedNodesElement, componentElements.simpleListElement, data); },
      componentElements
    );

    // run the visualizer
    visualizer.vizStix(
      content, 
      customConfig, 
      function() { ns.vizCallback(this) }, 
      function() { ns.alert("vizStix error.") }, 
      maxCount, 
      true
    );

    componentElements.canvasElement.visualizer = visualizer;
  }


  /* ******************************************************
   * Will be called right before the graph is built.
   * ******************************************************/
  ns.vizCallback = function(instance) {
    // hideMessages();
    // resizeCanvas();
  }

  /* ******************************************************
  * Adds icons and information to the legend.
  *
  * Takes an array of type names as input
  * ******************************************************/
  ns.populateLegend = function (visualizer, legend, typeGroups) {
    var ul = legend;
    var color = d3.scale.category20();

    typeGroups.forEach(function(typeName, index) {
      var li = document.createElement('li');
      li.setAttribute("class", "list-group-item");

      var val = document.createElement('span');
      val.setAttribute("class", "p-3");
      var key = document.createElement('span');
      var keyImg = document.createElement('img');
      keyImg.onerror = function() {
        // set the node's icon to the default if this image could not load
        this.src = visualizer.d3Config.iconDir + "/stix2_custom_object_icon_tiny_round_v1.svg";
      }
      keyImg.src = visualizer.iconFor(typeName);
      keyImg.width = "37";
      keyImg.height = "37";
      keyImg.style.background = "radial-gradient(" + color(index) + " 16px,transparent 16px)";
      key.appendChild(keyImg);
      val.innerText = typeName.charAt(0).toUpperCase() + typeName.substr(1).toLowerCase(); // Capitalize it
      li.appendChild(key);
      li.appendChild(val);
      ul.appendChild(li);
    });
  }

  /* ******************************************************
   * Adds information to the selected node table.
   *
   * Takes datum as input
   * ******************************************************/
  ns.populateSelected = function(visualizer, selectedContainer, linkedNodes, selectedNodeData) {
    console.log(["populateSelected", visualizer, selectedContainer, linkedNodes, selectedNodeData, visualizer.componentElements])
    // Remove old values from HTML
    selectedContainer.innerHTML = "";
    linkedNodes.innerHTML = "<ol></ol>";
    // ns.populateParent(visualizer, selectedContainer, linkedNodes, selectedNodeData, 0);
    ns.populateParent(visualizer, selectedContainer, linkedNodes, selectedContainer, selectedNodeData);
    const links = visualizer.linkMap[selectedNodeData.id];

    console.log(["populateSelected links", links]);
    // build out the list of all linked objects to the current one
    var text
    for(let i = 0; i < links.length; i++) {
      const cur = visualizer.objectMap[links[i].target];
      let name = links[i].type + ": " + cur.type;

      if(links[i].flip) {
        text += cur.type + " had " + links[i].type;
      }
      console.log(["populateSelected text", visualizer, selectedContainer, linkedNodes, linkedNodes.firstChild, cur, name, "mainList"]);
      ns.addListElement(visualizer, selectedContainer, linkedNodes, linkedNodes.firstChild, cur, name, "mainList");
    }

    console.log(["populateSelected text", text]);

  }

  ns.populateParent = function(visualizer, selectedContainer, linkedNodes, parent, nodeData) {
    console.log(["populateParent", visualizer, selectedContainer, linkedNodes, parent, nodeData])
    if (!nodeData) {
      return;
    }
    Object.keys(nodeData).forEach(function(key) {
      // skip embedded in a basic pass since they should be handled by a call directly to that array
      if(key == "__embeddedLinks" || key == "__isEmbedded") {
        return;
      }

      // Create new, empty HTML elements to be filled and injected
      const title = document.createElement('span');
      const wrapper = document.createElement('div');
      const isRef = key.endsWith("_ref") || key.endsWith("_refs"); // controls the style of children and if they should be clickable

      title.classList.add("title");
      title.innerText = key + ": ";
      wrapper.classList.add("wrapper");
      wrapper.appendChild(title);

      // Add the text to the new inner html elements
      var value = nodeData[key];
      
      if(Array.isArray(value) && value.length > 0) {
        const open = document.createElement('span');
        open.innerText = "[";
        wrapper.appendChild(open);
        if(typeof value[0] === "object" && value[0] !== null) {
          for(let i = 0; i < value.length; i++) {
            const subWrapper = document.createElement('div');
            subWrapper.classList.add("wrapper");

            const openObj = document.createElement('span');
            openObj.innerText = "{";
            subWrapper.appendChild(openObj);
            ns.populateParent(visualizer, selectedContainer, linkedNodes, subWrapper, value[i]);

            const closeObj = document.createElement('div');
            closeObj.innerText = "}";
            subWrapper.appendChild(closeObj);

            wrapper.appendChild(subWrapper);
          }
        }
        else {
          

          for(let i = 0; i < value.length; i++) {
            const subWrapper = document.createElement('div');
            subWrapper.classList.add("wrapper");
            const element = value[i];
            const val = document.createElement('span');
            if(isRef) {
              if(element in visualizer.objectMap) {
                val.classList.add("ref_value_resolved");
                val.onclick = function() {
                  ns.populateByUUID(visualizer, selectedContainer, linkedNodes, element)
                  selectedContainer.scrollIntoView();
                }
              }
              else {
                val.classList.add("ref_value_unresolved");
              }
            }
            else if(typeof element == "string") {
              val.classList.add("text_value");
            }
            else {
              val.classList.add("num_value");
            }
            
            val.innerText = element;
            val.classList.add("value");
            subWrapper.appendChild(val);
            wrapper.appendChild(subWrapper);
          }
        }

        const close = document.createElement('span');
        close.innerText = "]";
        wrapper.appendChild(close);
      }
      else if(typeof value === "object" && value !== null) {
        const openObj = document.createElement('span');
        openObj.innerText = "{";
        wrapper.appendChild(openObj);
        ns.populateParent(visualizer, selectedContainer, linkedNodes, wrapper, value);

        const closeObj = document.createElement('span');
        closeObj.innerText = "}";
        wrapper.appendChild(closeObj);
      }
      else {
        const val = document.createElement('span');
        if(isRef) {
          if(value in visualizer.objectMap) {
            val.classList.add("ref_value_resolved");
            val.onclick = function() {
              ns.populateByUUID(visualizer, selectedContainer, linkedNodes, value);
              selectedContainer.scrollIntoView();
            }
          }
          else {
            val.classList.add("ref_value_unresolved");
          }
        }
        else if(typeof value == "string") {
          val.classList.add("text_value");
        }
        else {
          val.classList.add("num_value");
        }

        val.innerText = value;
        val.classList.add("value");
        wrapper.appendChild(val);
      }

      // Add new divs to "Selected Node"
      
      parent.appendChild(wrapper);
    });
  }

  ns.populateByUUID = function(visualizer, selectedContainer, linkedNodes, uuid) {
    console.log(["populateByUUID", visualizer, selectedContainer, linkedNodes, uuid, visualizer.objectMap])
    if(uuid in visualizer.objectMap) {
      ns.populateSelected(visualizer, selectedContainer, linkedNodes, visualizer.objectMap[uuid]);
    }
    else {
      ns.alert(uuid + " was not found in this STIX");
    }
  }

  
  /**
   * This builds the list of objects when a graph representation would be too slow
   * 
   * @param object[] objects 
   */
  ns.populateList = function (visualizer, selectedContainer, linkedNodes, list, objects) {
    console.log(["populateList", list, objects])

    // make sure we hide the canvas and display the list
    // const simpleListWrapper = document.getElementById('simple-list-container');
    // simpleListWrapper.classList.remove("hidden");
    const simpleList = list; //document.getElementById('simple-list');
    // const canvasGroup = document.getElementById("canvas-group")
    // canvasGroup.classList.add("hidden"); // we need to make sure we hide the canvas
    // canvasGroup.classList.remove("top-wrapper"); // we need to make sure we hide the canvas
    simpleList.innerHTML = "";


    for(let i = 0; i < objects.length; i++) {
      let name = objects[i]["type"];
      if("name" in objects[i]) {
        name = name + ": " + objects[i]["name"];
      }

      ns.addListElement(visualizer, selectedContainer, linkedNodes, simpleList, objects[i], name, "mainList");
    }
  }

  ns.addListElement = function (visualizer, selectedContainer, linkedNodes, parent, cur, summaryText, listName) {
    console.log(["addListElement", visualizer, selectedContainer, linkedNodes, parent, cur, summaryText, listName])
    const entry = document.createElement("li");
    const details = document.createElement("details");
    const summary = document.createElement("summary");
    summary.innerText = summaryText;

    
    const iconFont = '<i class="bi-search"></i>';
    const iconSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-search" viewBox="0 0 16 16"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/></svg>';

    // link to navigate to the object in the graph
    const button = document.createElement("button");
    button.setAttribute("type", "button");
    button.setAttribute("name", listName);
    button.setAttribute("value", cur.id);
    button.setAttribute("class", "btn btn-primary btn-sm m-2");
    button.innerHTML = iconFont;
    console.log(button);


    button.onclick = function() {
      ns.populateByUUID(visualizer, selectedContainer, linkedNodes, cur.id);
      selectedContainer.scrollIntoView();
    }

    summary.appendChild(button);
    details.appendChild(summary);
    ns.populateParent(visualizer, selectedContainer, linkedNodes, details, cur);
    entry.appendChild(details);
    parent.appendChild(entry);
  }


  // HELPERS


/* ******************************************************
  * Generic AJAX 'GET' request.
  *
  * Takes a URL and a callback function as input.
  * ******************************************************/
  ns.fetchJsonAjax = function(url, cfunc) {
    var regex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/i;
    if (!regex.test(url)) {
      ns.alert("ERROR: Double check url provided");
    }

    var xhttp;
    if (window.XMLHttpRequest) {
      xhttp = new XMLHttpRequest();
    } else {
      xhttp = new ActiveXObject("Microsoft.XMLHTTP"); // For IE5 and IE6 luddites
    }
    xhttp.onreadystatechange = function() {
      if (xhttp.readyState == 4 && xhttp.status == 200) {
        cfunc(xhttp.responseText);
      } else if (xhttp.status != 200 && xhttp.status != 0) {
        ns.alert("ERROR: " + xhttp.status + ": " + xhttp.statusText + " - Double check url provided");
        return;
      }

      xhttp.onerror = function() {
        ns.alert("ERROR: Unable to fetch JSON. The domain entered has either rejected the request, \nis not serving JSON, or is not running a webserver.\n\nA GitHub Gist can be created to host RAW JSON data to prevent this.");
      };
    }
    xhttp.open("GET", url, true);
    xhttp.send();
  }

    
  /* ******************************************************
   * AJAX 'GET' request from `?url=` parameter
   *
   * Will check the URL during `window.onload` to determine
   * if `?url=` parameter is provided
   * ******************************************************/
  ns.fetchJsonFromUrl = function(url, callback) {
    if (url == "") {
      url = window.location.href;

      var queryStrings = ns.parseQuery(ns.getQueryStringAfter(url,"?"))
      var hashbangStrings = ns.parseQuery(ns.getQueryStringAfter(url,"#"))
      url = queryStrings["url"] || hashbangStrings["url"]
  
      console.log([queryStrings, hashbangStrings, urlString]);
    }

    if (url !== "") {

      // Fetch JSON from the url
      ns.fetchJsonAjax(url, function(content) {
        callback(content)
      });

    } else {
      ns.alert("ERROR: Invalid url - Request must start with '?url=http[s]://' and be a valid domain");
    }
  }

  ns.getQueryStringAfter = function(url,separator) {
    if (url.indexOf(separator)) {
       return url.split(separator)[1];
    }
    return url
  }

  ns.parseQuery = function(str) {
    if(typeof str != "string" || str.length == 0) return {};
    var s = str.split("&");
    var s_length = s.length;
    var bit, query = {}, first, second;
    for(var i = 0; i < s_length; i++)
        {
          bit = s[i].split("=");
          first = decodeURIComponent(bit[0]);
          if(first.length == 0) continue;
          second = decodeURIComponent(bit[1]);
          if(typeof query[first] == "undefined") query[first] = second;
          else if(query[first] instanceof Array) query[first].push(second);
          else query[first] = [query[first], second];
        }
    return query;
  }


  /**
   * output a message to the user
   * @param {*} message 
   */
  ns.alert = function(message) {
    console.log(message);
  }

})(jQuery, 
    window.Typerefinery.Components.Widgets.Security.Stix, 
    Typerefinery.Page.Tms, 
    Typerefinery.Components,
    d3, 
    window.Typerefinery.Vendor.Stix2Viz, 
    document, 
    window
  );
