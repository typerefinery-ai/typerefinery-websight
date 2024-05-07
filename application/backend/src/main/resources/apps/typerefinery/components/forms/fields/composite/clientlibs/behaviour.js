window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Forms = Typerefinery.Components.Forms || {};
window.Typerefinery.Components.Forms.Composite = Typerefinery.Components.Forms.Composite || {};

(function ($, ns, componentsNs, document) {
    "use strict";
    $(document).ready(function () {
      console.log('Composite component Behaviour loaded');

      //init and watch for new components
      componentsNs.watchDOMForComponent(`${ns.selectorComponent}${ns.selector}`, ns.init);

      //listen for change event on all input fields and compile value for composite input
      $(document).on("change", `${ns.selectorComponent}`, function() {
        console.group("document onchange - composite change");
        console.log($(this));
        ns.compileValue($(this));  
        console.groupEnd();
      });

      //composite list global event listeners
      //move current row to top
      $(document).on("click", `${ns.selectorComponent} .top`, function() {
        $(this).closest(".rows").prepend($(this).closest(".row"));
      });

      //move current row to bottom
      $(document).on("click", `${ns.selectorComponent} .bottom`, function() {
        $(this).closest(".rows").append($(this).closest(".row"));          
      });

      //move current row above next sibling
      $(document).on("click", `${ns.selectorComponent} .up`, function() {
        if ($(this).closest(".row").prev().length > 0) {
          $(this).closest(".row").prev().before($(this).closest(".row"));
        }
      });

      //move current row below previous sibling
      $(document).on("click", `${ns.selectorComponent} .down`, function() {
        if ($(this).closest(".row").next().length > 0) {
          $(this).closest(".row").next().after($(this).closest(".row"));
        }
      });

      //move current row to trash
      $(document).on("click", `${ns.selectorComponent} .delete`, function() {
        //remove row if new
        if ($(this).closest(".row").attr("state") == "new") {
          $(this).closest(".row").remove();
        } else {
          //move row to trash if existing
          $(this).closest(".row").attr("state", "deleted");
          $(this).closest(`${ns.selectorComponent}`).find(".trash").append($(this).closest(".row"));
        }
      });
      
    });
})(jQuery, window.Typerefinery.Components.Forms.Composite, window.Typerefinery.Components, document);
