/*
 * Copyright (C) 2023 Typerefinery.io
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.Components.Forms = Typerefinery.Components.Forms || {};
window.Typerefinery.Components.Forms.Input = Typerefinery.Components.Forms.Input || {};

(function ($, ns) {
    "use strict";

    /**
     * Safely parse a number from a value that might be string/number/undefined.
     * @param {unknown} value
     * @param {number} fallback
     * @returns {number}
     */
    const parseNumber = (value, fallback) => {
      const parsed = typeof value === "number" ? value : parseFloat(String(value));
      return Number.isFinite(parsed) ? parsed : fallback;
    };

    /**
     * Determine if the configured "half icon" class actually renders a Font Awesome glyph.
     * If FA doesn't have a matching rule, getComputedStyle(::before).content will be 'none' or 'normal'.
     *
     * @param {string} iconHalfClass
     * @returns {boolean}
     */
    const hasRenderableHalfIcon = (iconHalfClass) => {
      try {
        const el = document.createElement("i");
        iconHalfClass
          .split(" ")
          .filter((c) => c)
          .forEach((c) => el.classList.add(c));
        document.body.appendChild(el);
        const content = window.getComputedStyle(el, "::before").getPropertyValue("content");
        document.body.removeChild(el);
        // Font Awesome sets a quoted glyph content like "\f005" (appears as quoted string in computed style)
        // Missing glyph usually yields 'none' or 'normal'.
        return content !== "none" && content !== "normal" && content !== "";
      } catch (e) {
        // If anything goes wrong, assume it's not renderable and fall back to layered rendering.
        return false;
      }
    };

    ns.initRating = ($component, componentConfig) => {
      console.group("initRating");
      console.log("$component:", $component);
      console.log("componentConfig:", componentConfig);
      
      // $component is the element with [component="input"] attribute
      // This is the INPUT element itself (not a wrapper)
      let $hiddenInput = $component;
      console.log("Initial $component is input?", $component.is('input'));
      
      // If $component is not an input, find the input within it
      if (!$component.is('input')) {
        console.log("$component is not an input, searching for input element");
        $hiddenInput = $component.find(`input[type="rating"]`);
        console.log("Found input[type='rating']:", $hiddenInput.length);
        
        if ($hiddenInput.length === 0) {
          $hiddenInput = $component.find(`input[id="${componentConfig.id}"]`);
          console.log("Found input by ID:", $hiddenInput.length);
        }
        if ($hiddenInput.length === 0) {
          $hiddenInput = $component.find('input').first();
          console.log("Found first input:", $hiddenInput.length);
        }
      }
      
      // If still not found, try finding by component attribute and ID globally
      if ($hiddenInput.length === 0 || !$hiddenInput.is('input')) {
        console.log("Searching globally for input[component='input'][id='" + componentConfig.id + "']");
        $hiddenInput = $(`input[component="input"][id="${componentConfig.id}"]`);
        console.log("Found globally:", $hiddenInput.length);
      }
      
      if ($hiddenInput.length === 0 || !$hiddenInput.is('input')) {
        console.error('Rating input not found for component:', componentConfig.id);
        console.error('$component:', $component);
        console.error('$hiddenInput:', $hiddenInput);
        console.groupEnd();
        return;
      }

      console.log("Rating input found:", $hiddenInput);
      console.log("Input element:", $hiddenInput[0]);

      // Read all config from componentConfig (from data-model)
      const maxItems = componentConfig.ratingMaxStars || 5;
      const allowHalf = componentConfig.ratingAllowHalf !== false;
      const iconFilled = componentConfig.ratingIconClass || 'fas fa-star';
      const iconEmpty = componentConfig.ratingIconClassEmpty || 'far fa-star';
      const iconHalf = componentConfig.ratingIconClassHalf || 'fas fa-star-half-alt';
      const iconColor = componentConfig.ratingIconColor || '#ffc107';
      const isDisabled = componentConfig.disabled === true;
      const currentValue = parseNumber(componentConfig.value, 0);
      const canUseHalfIconClass = allowHalf && hasRenderableHalfIcon(iconHalf);
      
      console.log("Rating configuration:", {
        maxItems,
        allowHalf,
        iconFilled,
        iconEmpty,
        iconHalf,
        canUseHalfIconClass,
        iconColor,
        isDisabled,
        currentValue
      });

      // Get the wrapper (parent div) to search for existing rating items
      // The input is inside a wrapper div from input.html
      console.log("Finding wrapper div");
      let $wrapper = $hiddenInput.parent();
      console.log("Parent wrapper:", $wrapper.length, $wrapper.is('div'));
      
      if ($wrapper.length === 0 || !$wrapper.is('div')) {
        $wrapper = $hiddenInput.closest('div');
        console.log("Closest div wrapper:", $wrapper.length);
      }

      // Create rating items container if it doesn't exist
      // Search in wrapper first, then create after the input
      console.log("Searching for existing .input-rating-items");
      let $ratingItems = $wrapper.length > 0 ? $wrapper.find('.input-rating-items') : $();
      console.log("Found in wrapper:", $ratingItems.length);
      
      if ($ratingItems.length === 0) {
        // Check if rating items already exist as sibling of input
        console.log("Searching for sibling .input-rating-items");
        $ratingItems = $hiddenInput.siblings('.input-rating-items');
        console.log("Found as sibling:", $ratingItems.length);
      }
      if ($ratingItems.length === 0) {
        console.log("Creating new .input-rating-items container");
        $ratingItems = $('<div>').addClass('input-rating-items');
        $hiddenInput.after($ratingItems);
        console.log("Rating items container created and inserted");
      } else {
        console.log("Using existing .input-rating-items container");
      }

      // Generate rating items - ensure exactly maxItems items are created
      console.log("Generating", maxItems, "rating items");
      $ratingItems.empty();
      
      // Clear any existing items first to prevent duplicates
      $ratingItems.find('.input-rating-item').remove();
      
      for (let i = 1; i <= maxItems; i++) {
        // Use layered structure ONLY for hearts (when half-icon class doesn't exist)
        // Keep simple single-icon structure for stars (which have fa-star-half-alt)
        // 
        // Simple (stars): <i class="input-rating-item ..." data-rating="1"></i>
        // Layered (hearts): <span class="input-rating-item input-rating-item--layered" data-rating="1">
        //                     <i class="input-rating-icon-empty ..."></i>
        //                     <i class="input-rating-icon-filled ..."></i>
        //                   </span>
        
        let $item;
        if (!canUseHalfIconClass && allowHalf) {
          // Layered structure for hearts - empty outline always visible, filled icon clips to 50% for half
          $item = $("<span>")
            .addClass("input-rating-item")
            .addClass("input-rating-item--layered")
            .attr("data-rating", i);
          
          // Empty icon - always visible behind (full width)
          const $emptyIcon = $("<i>")
            .addClass("input-rating-icon-empty")
            .addClass(iconEmpty)
            .css("color", iconColor);
          
          // Filled icon - on top, width controlled by JS (0%, 50%, 100%)
          const $filledIcon = $("<i>")
            .addClass("input-rating-icon-filled")
            .addClass(iconFilled)
            .css("color", iconColor)
            .css("width", "0%"); // Start at 0% (empty)
          
          $item.append($emptyIcon);
          $item.append($filledIcon);
        } else {
          // Simple single-icon structure for stars and other icons with half-icon class
          $item = $("<i>")
            .addClass("input-rating-item")
            .addClass(iconEmpty) // Start with empty icon
            .attr("data-rating", i)
            .css("color", iconColor);
        }

        if (isDisabled) {
          $item.addClass('disabled');
        }

        $ratingItems.append($item);
      }
      
      // Store fixed icon width for half-star calculations (prevents width changes affecting calculation)
      // Use first item's width or fallback to CSS width (1.5rem = 24px typically)
      const firstItem = $ratingItems.find('.input-rating-item').first();
      const fixedItemWidth = firstItem.length > 0 ? firstItem.outerWidth() : 24; // 1.5rem typically = 24px
      console.log("Fixed item width for calculations:", fixedItemWidth);
      
      // Verify correct number of items were created
      const itemCount = $ratingItems.find('.input-rating-item').length;
      console.log("Generated", itemCount, "rating items (expected", maxItems, ")");
      if (itemCount !== maxItems) {
        console.error("MISMATCH: Expected", maxItems, "items but found", itemCount);
      }

      // Store actual value for hover preview revert
      const getActualValue = () => parseNumber($hiddenInput.val(), 0);
      
      // Update visual state
      console.log("Updating rating display with value:", currentValue);
      ns.updateRatingDisplay(
        $ratingItems,
        currentValue,
        iconFilled,
        iconEmpty,
        iconHalf,
        allowHalf,
        iconColor,
        canUseHalfIconClass
      );

      if (!isDisabled) {
        console.log("Adding click and hover preview handlers to rating items");
        
        // Add mouseenter handler for hover preview (scale effect only)
        $ratingItems.find('.input-rating-item').on('mouseenter', function(e) {
          const $item = $(this);
          // Scale effect
          $item.css('transform', 'scale(1.1)');
        });
        
        // Store current preview value to avoid unnecessary updates
        let currentPreviewValue = null;
        
        // Add mousemove handler to continuously track mouse position within each icon
        // This allows the preview to update dynamically as the mouse moves from left to right half
        $ratingItems.find('.input-rating-item').on('mousemove', function(e) {
          const $item = $(this);
          const rating = parseInt($item.data('rating'));
          
          // Calculate preview value based on current mouse position
          // Use fixed width for accurate half-star detection (prevents width changes affecting calculation)
          let previewValue = rating;
          if (allowHalf) {
            const itemOffset = $item.offset();
            const mouseX = e.pageX - itemOffset.left;
            
            // Use fixed width (from initialization) for consistent calculation
            const midPoint = fixedItemWidth / 2;
            
            // Use simple 50% split for accurate half-star detection
            if (mouseX < midPoint) {
              // Left side - half star
              previewValue = rating - 0.5;
            } else {
              // Right side - full star
              previewValue = rating;
            }
            
            // Only update if preview value changed (prevents unnecessary class changes that break :before)
            if (currentPreviewValue !== previewValue) {
              console.log("Hover preview (mousemove) - rating:", rating, "mouseX:", mouseX, "fixedItemWidth:", fixedItemWidth, "midPoint:", midPoint, "previewValue:", previewValue);
              currentPreviewValue = previewValue;
              // Update preview dynamically as mouse moves within icon
              ns.updateRatingDisplay(
                $ratingItems,
                previewValue,
                iconFilled,
                iconEmpty,
                iconHalf,
                allowHalf,
                iconColor,
                canUseHalfIconClass
              );
            }
          } else {
            // If half-stars disabled, just show full star for this rating
            previewValue = rating;
            if (currentPreviewValue !== previewValue) {
              console.log("Hover preview (mousemove) - rating:", rating, "previewValue:", previewValue);
              currentPreviewValue = previewValue;
              ns.updateRatingDisplay(
                $ratingItems,
                previewValue,
                iconFilled,
                iconEmpty,
                iconHalf,
                allowHalf,
                iconColor,
                canUseHalfIconClass
              );
            }
          }
        });
        
        // Add mouseleave handler to revert to actual value
        $ratingItems.on('mouseleave', function() {
          console.log("Mouse left rating items - reverting to actual value");
          currentPreviewValue = null; // Reset preview value
          const actualValue = getActualValue();
          ns.updateRatingDisplay(
            $ratingItems,
            actualValue,
            iconFilled,
            iconEmpty,
            iconHalf,
            allowHalf,
            iconColor,
            canUseHalfIconClass
          );
        });
        
        // Add mouseleave handler for individual items (scale effect only)
        $ratingItems.find('.input-rating-item').on('mouseleave', function() {
          $(this).css('transform', 'scale(1)');
        });
        
        // Add click handlers
        $ratingItems.find('.input-rating-item').on('click', function(e) {
          console.log("Rating item clicked");
          const $item = $(this);
          const rating = parseInt($item.data('rating'));
          console.log("Clicked rating:", rating, "allowHalf:", allowHalf);
          
          if (allowHalf) {
            // Check if click is on left or right half of item
            // Use fixed width for accurate half-star detection (same as hover)
            const itemOffset = $item.offset();
            const clickX = e.pageX - itemOffset.left;
            
            // Use fixed width (from initialization) for consistent calculation
            const midPoint = fixedItemWidth / 2;
            
            // Use simple 50% split for accurate half-star detection
            let finalRating;
            if (clickX < midPoint) {
              // Left side - half star
              finalRating = rating - 0.5;
            } else {
              // Right side - full star
              finalRating = rating;
            }
            
            console.log("Half-star click - fixedItemWidth:", fixedItemWidth, "clickX:", clickX, "midPoint:", midPoint, "finalRating:", finalRating);
            
            $hiddenInput.val(finalRating);
            ns.updateRatingDisplay(
              $ratingItems,
              finalRating,
              iconFilled,
              iconEmpty,
              iconHalf,
              allowHalf,
              iconColor,
              canUseHalfIconClass
            );
            $hiddenInput.trigger('change');
            console.log("Rating updated to:", finalRating);
          } else {
            console.log("Full-star click - rating:", rating);
            $hiddenInput.val(rating);
            ns.updateRatingDisplay(
              $ratingItems,
              rating,
              iconFilled,
              iconEmpty,
              iconHalf,
              allowHalf,
              iconColor,
              canUseHalfIconClass
            );
            $hiddenInput.trigger('change');
            console.log("Rating updated to:", rating);
          }
        });
      } else {
        console.log("Rating is disabled - skipping event handlers");
      }
      
      console.log("Rating initialization complete");
      console.groupEnd();
    };

    /**
     * Update rating display.
     *
     * - Uses layered rendering by default: the empty icon is always visible, and the filled icon width is set to:
     *   - 0% (empty)
     *   - 50% (half)
     *   - 100% (full)
     *
     * - If a valid half icon class exists (e.g., stars), we still keep the layered approach; the half icon class
     *   is optional and no longer required for correctness.
     */
    ns.updateRatingDisplay = (
      $ratingItems,
      value,
      iconFilled,
      iconEmpty,
      iconHalf,
      allowHalf,
      iconColor,
      canUseHalfIconClass
    ) => {
      console.log(
        "updateRatingDisplay - value:",
        value,
        "allowHalf:",
        allowHalf,
        "iconColor:",
        iconColor,
        "canUseHalfIconClass:",
        canUseHalfIconClass
      );

      const items = $ratingItems.find(".input-rating-item");
      console.log("Updating", items.length, "rating items");

      // Get icon color from first item if not provided
      // For layered structure, check filled icon; for simple, check the item itself
      const firstItem = items.first();
      let color = iconColor;
      if (!color) {
        if (firstItem.hasClass("input-rating-item--layered")) {
          const firstFilled = firstItem.find(".input-rating-icon-filled");
          color = firstFilled.css("color") || "#ffc107";
        } else {
          color = firstItem.css("color") || "#ffc107";
        }
      }

      items.each(function () {
        const $item = $(this);
        const rating = parseInt($item.data("rating"));
        const halfRating = rating - 0.5;
        const isLayered = $item.hasClass("input-rating-item--layered");

        if (isLayered) {
          // Layered structure: update both empty and filled icons
          const $emptyIcon = $item.find(".input-rating-icon-empty");
          const $filledIcon = $item.find(".input-rating-icon-filled");
          
          // Remove all icon classes
          const filledClasses = iconFilled.split(' ').filter(c => c);
          const emptyClasses = iconEmpty.split(' ').filter(c => c);
          $emptyIcon.removeClass(emptyClasses.join(' '));
          $filledIcon.removeClass(filledClasses.join(' '));
          
          // Always ensure classes are correct
          $emptyIcon.addClass(iconEmpty);
          $filledIcon.addClass(iconFilled);
          $filledIcon.css("color", color);

          // IMPORTANT: For FontAwesome glyphs (rendered via ::before), width/clip-path on the <i> can be unreliable.
          // We use a CSS mask controlled by a CSS variable to reveal 0/50/100% of the filled glyph.
          let fillPercent = "0%";
          if (value >= rating) {
            fillPercent = "100%";
            console.log("Item", rating, "- filled (100%)");
          } else if (allowHalf && value >= halfRating) {
            fillPercent = "50%";
            console.log("Item", rating, "- half (50%)");
          } else {
            console.log("Item", rating, "- empty (0%)");
          }
          $filledIcon.css("--tr-rating-fill", fillPercent);
        } else {
          // Simple single-icon structure
          // Remove all icon classes individually to ensure clean state
          const filledClasses = iconFilled.split(' ').filter(c => c);
          const emptyClasses = iconEmpty.split(' ').filter(c => c);
          const halfClasses = iconHalf.split(' ').filter(c => c);
          
          // Remove all classes from all three icon types
          $item.removeClass(filledClasses.join(' '));
          $item.removeClass(emptyClasses.join(' '));
          $item.removeClass(halfClasses.join(' '));
          
          // Ensure color is always applied
          $item.css('color', color);

          if (value >= rating) {
            // Full icon - use filled classes
            $item.addClass(iconFilled);
            console.log("Item", rating, "- filled (classes:", iconFilled, ")");
          } else if (allowHalf && value >= halfRating) {
            // Half icon - use half class (stars have this)
            $item.addClass(iconHalf);
            console.log("Item", rating, "- half (classes:", iconHalf, ")");
          } else {
            // Empty icon
            $item.addClass(iconEmpty);
            console.log("Item", rating, "- empty (classes:", iconEmpty, ")");
          }
        }
      });

      console.log("Rating display update complete");
    };

})(jQuery, window.Typerefinery.Components.Forms.Input);
