window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Forms = Typerefinery.Components.Forms || {};
window.Typerefinery.Components.Forms.Button = Typerefinery.Components.Forms.Button || {};
window.Typerefinery.Modal = Typerefinery.Modal || {};
window.Typerefinery.Dropdown = Typerefinery.Dropdown || {};
window.Typerefinery.ToggleComponent = Typerefinery.ToggleComponent || {};
window.Typerefinery.Page.Theme = Typerefinery.Page.Theme || {};

(function ($, ns, componentNs, modalNs, dropdownNs, toggleComponentNs, themeNs, document, window) {
    "use strict";

    ns.selectorComponent = '[component=accordion]';
    ns.selectorTemplate = "> template";
    ns.selectorButton = 'button.accordion-button';
    ns.attributeTarget = "data-bs-target";
    ns.attributeParent = "data-bs-parent";
    ns.attributeAriaControls = "aria-controls";

    ns.addNewItem = ($component) => {
      const componentId = $component.attr('id');
      const $template = $component.find(ns.selectorTemplate);
      var $newRow = $($template.html());
      const itemId = Math.random().toString(36).substring(2, 15);
      console.group('addNewItem');

      $newRow.attr('state', "new");
      $newRow.attr('id', itemId);

      console.log('itemId', itemId);

      const itemContentId = `accordionitem_${itemId}`;

      console.log('itemContentId', itemContentId);

      const $itemButton = $newRow.find(ns.selectorButton);
      const itemButtonTarget = $itemButton.attr(ns.attributeTarget); //needs to be updated with new id
      const itemAriaControls = $itemButton.attr(ns.attributeAriaControls); //needs to be updated with new id
      $itemButton.attr(ns.attributeTarget, `#${itemContentId}`);
      $itemButton.attr(ns.attributeAriaControls, itemContentId);

      const $itemCollapse = $newRow.find(itemButtonTarget);
      const itemCollapseId = $itemCollapse.attr('id'); //needs to be updated with new id
      $itemCollapse.attr('id', itemContentId);

      const itemDataParent = $itemCollapse.attr(ns.attributeParent); // is pointing to the parent, needs to be updated to current component
      $itemCollapse.attr(ns.attributeParent, componentId);

      console.log('$newRow', $newRow);
      
      $template.before($newRow);

      console.groupEnd();
    }

    ns.init = ($component) => {
        const componentConfig = componentNs.getComponentConfig($component);
        ns.addNewItem($component);      
    }
})(jQuery, Typerefinery.Components.Forms.Button, Typerefinery.Components, Typerefinery.Modal, Typerefinery.Dropdown, Typerefinery.ToggleComponent, window.Typerefinery.Page.Theme, document, window);