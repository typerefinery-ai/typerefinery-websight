window.Typerefinery = window.Typerefinery || {};
Typerefinery.Components = Typerefinery.Components || {};
Typerefinery.Components.Forms = Typerefinery.Components.Forms || {};
Typerefinery.Components.Forms.Fileupload = Typerefinery.Components.Forms.Fileupload || {};


(function ($, ns, componentNs, eventNs, document, window) {

    "use strict";

    ns.selectorComponent = '[component=fileupload]';

    ns.ACTION_FILEUPLOAD_CHANGE = "FILEUPLOAD_CHANGE"; // action to handle fileupload change for all fileuploads with the same name

    //actions supported by this component
    ns.ACTIONS = {
        FILEUPLOAD_CHANGE: ns.ACTION_FILEUPLOAD_CHANGE // action to handle fileupload change
    }

    // map event types to handlers in component
    // this will indicate which events are supported by component
    // ns.eventMap = eventNs.genericEventsTopicMap();
    ns.eventMap = {};

    // this will add event listener to the component and register the event for all textareas with the same name
    ns.addEventListener = ($component, componentConfig) => {
        
      const { events, id } = componentConfig;
      const defaultTopic = componentConfig.name || id;
      const comonentEventId = componentConfig.name || id;
      console.group('addEventListener ' + comonentEventId);
      
      console.log(["config", events, comonentEventId, defaultTopic, componentConfig]);
      
      console.log("registering events");
      //register events
      if (events) {        
        events.forEach(event => {
          const { topic, type, name, nameCustom, action, config, value } = event;

          //if topic not set use component id as topic
          const topicName = topic || defaultTopic;
          // if type is not defined then its listen event
          let typeName = type || eventNs.EVENT_TYPE_LISTEN || "custom";

          let eventName = nameCustom || name || topic;
          
          console.groupCollapsed(`event ${typeName} - ${action}:${topic}`);
          console.log(["event config", topic, type, name, nameCustom, action, config]);

          console.log(["event to register", topicName, typeName, eventName, action]);

          console.log(["registerEventActionMapping", JSON.stringify(ns.eventMap), topicName, typeName, action, eventName, config]);
          eventNs.registerEventActionMapping(ns.eventMap, comonentEventId, topicName, typeName, action, eventName, config);
          console.log(["registerEventActionMapping", JSON.stringify(ns.eventMap)]);

          // if event type is listen then add event listener for the event

          if (typeName === eventNs.EVENT_TYPE_EMIT) {
              console.log("adding event listener " + action);
              if (action === ns.ACTION_FILEUPLOAD_CHANGE) {
                console.group(`adding change listener to component ${comonentEventId}`);
  
                $component.on("change", (e) => {
                    console.group("change");
                    console.log(["change", e]);
          
                    console.log(["config", componentConfig]);
                    const $instance = $(e.target);
                    const value = $instance.attr('value');
                    const id = $instance.attr('id');
                    const type = $instance.attr('type');
  
                    ns.handleEventAction($component, componentConfig, ns.ACTION_FILEUPLOAD_CHANGE, { 
                      value: value,
                      type: type,
                      id: id,
                      action: action
                    });
          
                    console.groupEnd();
                });
                //set emitEvents to true
                $component.attr("emitEvents", true);
                console.groupEnd();
              } 
          } else {
              //listen register the event and listent for specific event on topic
              console.log(["register event listen", topicName, eventName]);
              eventNs.registerEvents(topicName, (data) => {
                  // check make sure the event is for this event
                  console.log(["registerEvents callback", topicName, eventName, data]);
                  if (data.type === eventName) {
                      ns.handleEventAction($component, componentConfig, action, data);
                  }
              });
          }
          console.groupEnd();
        });

        console.log(["eventMap", ns.eventMap]);

      } else {
        console.log("no events found");
      }

      console.groupEnd();
      
    }

    ns.FILEUPLOAD_CHANGE = ($component, componentConfig, data) => {
      console.group(ns.ACTION_FILEUPLOAD_CHANGE);
      const { id } = componentConfig;
      const comonentEventId = componentConfig.name || id;

      eventNs.emitLocalEvent($component, componentConfig, ns.eventMap, data, eventNs.EVENTS.EVENT_ITEM_UPDATE, ns.ACTION_FILEUPLOAD_CHANGE, {id: comonentEventId});

      console.groupEnd();
    }

    ns.handleEventAction = ($component, componentConfig, action, data) => {
      console.group('handleEvent');
      console.log(["handleEvent", $component, action, data]);
      // if componentConfig is not passed then get it from the component
      if (!componentConfig) {
        componentConfig = componentNs.getComponentConfig($component);
      }
      switch (action) {
        case ns.FILEUPLOAD_CHANGE:
            ns.FILEUPLOAD_CHANGE($component, componentConfig, data );
            break
        default:
            console.log("no action found");
            break;
      }
      console.groupEnd();
    }

    //keep track of files in the file input field, as we can't add the files to the input field as it is readonly
    ns.addFile = ($component, file) => {
        console.group('addFile');
        console.log(["addFile", $component, file]);
        //add file to the component prop files Map
        if (!$component[0].files) {
            $component[0].files = new Map();
        }
        const id = Math.random().toString(36).substr(2, 9);
        $component[0].files.set(id, file);

        console.log(["isEmitEvents", ns.isEmitEvents($component)]);

        if (ns.isEmitEvents($component)) {
          console.log("change add file emit");
          ns.handleEventAction($component, null, ns.ACTION_FILEUPLOAD_CHANGE, { 
            value: file.name,
            type: file.type,
            id: id,
            action: "add" 
          });
        }
        
        console.log(["$component.files", $component[0].files]);
        console.groupEnd();
        return id;
    }

    ns.removeFile = ($component, id) => {
        console.group('removeFile');
        console.log(["removeFile", $component, id]);
        //remove file from the component prop files Map
        let name = "";
        let type = "";
        if ($component[0].files) {
          // if file is not found then return
          if (!$component[0].files.has(id)) {
            return;
          }
          const file = $component[0].files.get(id);
          name = file.name;
          type = file.type;
          $component[0].files.delete(id);
        }

        if (ns.isEmitEvents($component)) {
          console.log("change remove file emit");
          ns.handleEventAction($component, null, ns.ACTION_FILEUPLOAD_CHANGE, { 
            value: name,
            type: type,
            id: id,
            action: "remove" 
          });
        }

        console.log(["$component.files", $component[0].files]);
        console.groupEnd();
    }

    ns.isEmitEvents = ($component) => {
        return $component.attr("emitEvents") === "true";
    }

    ns.isMultiple = ($component) => {
        return $component.attr("multiple") === "multiple";
    }

    //FIXME: file input field is not getting reflected with the files.
    ns.customDragAndDrop = ($component, componentConfig) => {
        const componentId = `#${componentConfig.id}-${componentConfig.name}`;
        console.log('componentId', componentId);
        let $fileInput = $component.find(componentId);
        let $container = $component;
        let $error = $component.find("#error");
        let $imageDisplay = $component.find("#image-display");
        console.log('$fileInput', $fileInput);
        console.log('$container', $container);
        console.log('$error', $error);
        console.log('$imageDisplay', $imageDisplay);
        // close-icon handle click.
        // $($component).on("click", ".close-icon", function () {
        //     if(this.id && this.id.split("close-").length >= 2){
        //       $component.find(`#figure-${this.id.split("close-")[1]}`).remove();
        //     }
        // });

        const fileHandler = (file, name, type) => {            
            const id = ns.addFile($component, file);

            type = type.split("/").legnth >= 2 ? type.split("/")[1] : type; 
            if (componentConfig.accept !== "*" && componentConfig.accept && !componentConfig.accept.includes(type)) {
                //File Type Error
                $error.innerText = "Please upload " + componentConfig.accept + " file type only";
                return false;
            }
            $error.innerText = "";
            let reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = () => {
                // console.log('reader result', reader.result);
                name = name?.trim()?.replace(/\s/g, "-");
                
                //image and file name
                let $imageContainer = $(`<figure 
                  id="figure-${name}"
                  class="figure-${name}"
                  fileName="${name}"
                  fileId="${id}">
                  <figcaption>${name}</figcaption>
                </figure>`);

                let $img = $(`<img id="img-${name}" fileName="${name}" fileId="${id}" alt="${name}">`);
                $img.attr("src", reader.result);

                // append a close icon which has position absolute styling.
                let $closeIcon = $(`<span fileId="${id}" fileName="${name}" class="close-icon pi pi-times" id="close-${name}"></span>`);

                console.log('$closeIcon', $closeIcon);

                $closeIcon.on("click", function () {
                    let id = this.getAttribute("fileId");
                    console.log('closeIcon click', id);
                    // remove the file from the component
                    ns.removeFile($component, id);
                    // remove the image container
                    $imageContainer.remove();
                });

                // add loader icon which is display none.
                let $loaderIcon = $(`<span fileId="${id}" fileName="${name}" class="loader-icon pi pi-spin pi-spinner" id="loader-${name}"></span>`);

                console.log('$loaderIcon', $loaderIcon);

                $imageContainer.prepend($closeIcon, $loaderIcon, $img);

                // append the image container to the image display
                $imageDisplay.append($imageContainer);
            };
        };
        $fileInput[0].addEventListener("change", (event) => {
            $imageDisplay.innerHTML = "";
            Array.from(event.target.files).forEach((file) => {
              console.log('pick file', file);
              fileHandler(file, file.name, file.type);
            });
        });
        $container[0].addEventListener(
            "dragenter",
            (e) => {
                e.preventDefault();
                e.stopPropagation();
                $container.addClass("active");
            },
            false
        );
        $container[0].addEventListener(
            "dragleave",
            (e) => {
                e.preventDefault();
                e.stopPropagation();
                $container.removeClass("active");
            },
            false
        );
        $container[0].addEventListener(
            "drop",
            (e) => {
                e.preventDefault();
                e.stopPropagation();
                $container.removeClass("active");
                let draggedData = e.dataTransfer;
                let files = draggedData.files;
                //$imageDisplay.innerHTML = "";
                console.log('files', files);
                $error.text("");
                // if multiple files are not allowed and multiple files are dropped then show error
                if (!ns.isMultiple($fileInput) && files.length > 1) {
                  console.log('multiple files not allowed');
                  $error.text("Please drop only one file");
                  return false;
                }                
                Array.from(files).forEach((file) => {
                    console.log('drop file', file);
                    fileHandler(file, file.name, file.type);
                });
            },
            false
        );
        window.onload = () => {
            $error.innerText = "";
        };
    }

    ns.init = ($component) => {
      const componentConfig = componentNs.getComponentConfig($component);
      const { id, actionType } = componentConfig;
      console.groupCollapsed(`fileupload init ${id}`);

      console.log("adding customDragAndDrop listeners");
      ns.customDragAndDrop($component, componentConfig);

      console.log("adding event listeners");
      ns.addEventListener($component, componentConfig);
      console.log(["ns.eventMap", ns.eventMap]);

      console.groupEnd();
    }
})(jQuery, Typerefinery.Components.Forms.Fileupload, Typerefinery.Components, Typerefinery.Page.Events, document, window);