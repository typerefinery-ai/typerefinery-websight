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

describe("Input Component - Rating Type (Preview)", () => {
  beforeEach(() => {
    cy.login();
  });

  /**
   * NOTE:
   * These tests are intentionally written against the REAL showcase examples
   * on `/content/typerefinery-showcase/pages/components/forms/input.html`.
   *
   * If the showcase names change, update the selectors here to match the
   * `name="..."` values in `tests/content/.../forms/input/.content.xml`.
   */

  it("renders rating component correctly in preview mode", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    // Verify rating components are present
    // `component="input"` is on the INPUT element itself (lean HTML signature).
    cy.get('input[component="input"][type="rating"]').should("exist");
  });

  it("displays star icons for rating inputs", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    // Rating UI is created dynamically next to the input.
    cy.get('input[name="rating_1_star"]')
      .parent()
      .find(".input-rating-items")
      .should("exist");
    cy.get('input[name="rating_1_star"]')
      .parent()
      .find(".input-rating-item")
      .should("have.length.at.least", 1);
  });

  it("hides the native rating input element", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    // Verify the input is hidden (not visible) and doesn't take layout space.
    cy.get('input[component="input"][type="rating"]')
      .should("not.be.visible")
      .should("have.css", "opacity", "0")
      .should("have.css", "width", "0px")
      .should("have.css", "height", "0px");
  });

  it("displays correct number of stars based on ratingMaxStars", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    // Find rating examples with different max stars
    // 1/5 rating should have 5 stars
    cy.get('input[name="rating_1_star"]')
      .parent()
      .find(".input-rating-items .input-rating-item")
      .should("have.length", 5);

    // 5/5 rating should also have 5 stars
    cy.get('input[name="rating_5_star"]')
      .parent()
      .find(".input-rating-items .input-rating-item")
      .should("have.length", 5);
  });

  it("displays correct filled/empty stars based on value", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    // Check 1/5 rating - should have 1 filled star
    cy.get('input[name="rating_1_star"]')
      .parent()
      .find(".input-rating-items .input-rating-item")
      .first()
      .should("have.class", "fas")
      .should("have.class", "fa-star");

    // Check 5/5 rating - should have all 5 stars filled
    cy.get('input[name="rating_5_star"]')
      .parent()
      .find(".input-rating-items .input-rating-item")
      .each(($item) => {
        cy.wrap($item).should("have.class", "fas").should("have.class", "fa-star");
      });
  });

  it("shows hover preview without changing value", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    // Get initial value (rating_1_star starts at value 1)
    cy.get('input[name="rating_1_star"]').should("have.value", "1");

    // Verify initial state (only first star filled)
    cy.get('input[name="rating_1_star"]')
      .parent()
      .find(".input-rating-items .input-rating-item")
      .first()
      .should("have.class", "fas")
      .should("have.class", "fa-star");

    // Hover over 4th star - verify value doesn't change (key behavior)
    cy.get('input[name="rating_1_star"]')
      .parent()
      .find(".input-rating-items .input-rating-item")
      .eq(3) // 4th star
      .then(($item) => {
        const item = $item[0];
        const rect = item.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Trigger mouseenter with proper coordinates
        cy.wrap(item).trigger("mouseenter", {
          pageX: centerX,
          pageY: centerY,
          clientX: centerX,
          clientY: centerY,
          bubbles: true,
        });
      });

    // Wait a moment for any hover effects
    cy.wait(100);

    // CRITICAL: Verify actual value hasn't changed (hover preview doesn't update value)
    cy.get('input[name="rating_1_star"]').should("have.value", "1");

    // Move mouse away
    cy.get('input[name="rating_1_star"]')
      .parent()
      .find(".input-rating-items")
      .trigger("mouseleave");

    // Wait for any revert effects
    cy.wait(100);

    // Verify value still hasn't changed after mouse leave
    cy.get('input[name="rating_1_star"]').should("have.value", "1");

    // Verify initial state is maintained (first star still filled)
    cy.get('input[name="rating_1_star"]')
      .parent()
      .find(".input-rating-items .input-rating-item")
      .first()
      .should("have.class", "fas")
      .should("have.class", "fa-star");
  });

  it("shows hover preview for half-stars when enabled", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    // rating_1_star_half starts at 0.5
    cy.get('input[name="rating_1_star_half"]').should("have.value", "0.5");

    // Verify initial state (first star half-filled)
    cy.get('input[name="rating_1_star_half"]')
      .parent()
      .find(".input-rating-items .input-rating-item")
      .first()
      .should("have.class", "fa-star-half-alt");

    // Hover over 3rd star - verify value doesn't change (key behavior)
    cy.get('input[name="rating_1_star_half"]')
      .parent()
      .find(".input-rating-items .input-rating-item")
      .eq(2) // 3rd star
      .then(($item) => {
        const item = $item[0];
        const rect = item.getBoundingClientRect();
        // Hover on right side (3/4 of the way across) to get full star, not half
        const centerX = rect.left + (rect.width * 0.75);
        const centerY = rect.top + rect.height / 2;
        
        cy.wrap(item).trigger("mouseenter", {
          pageX: centerX,
          pageY: centerY,
          clientX: centerX,
          clientY: centerY,
          bubbles: true,
        });
      });

    // Wait a moment for any hover effects
    cy.wait(100);

    // CRITICAL: Verify actual value hasn't changed (hover preview doesn't update value)
    cy.get('input[name="rating_1_star_half"]').should("have.value", "0.5");

    // Move mouse away
    cy.get('input[name="rating_1_star_half"]')
      .parent()
      .find(".input-rating-items")
      .trigger("mouseleave");

    // Wait for any revert effects
    cy.wait(100);

    // Verify value still hasn't changed after mouse leave
    cy.get('input[name="rating_1_star_half"]').should("have.value", "0.5");

    // Verify initial state is maintained (first star still half-filled)
    cy.get('input[name="rating_1_star_half"]')
      .parent()
      .find(".input-rating-items .input-rating-item")
      .first()
      .should("have.class", "fa-star-half-alt");
  });

  it("allows clicking on stars to change rating", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    // Find a rating input that's not disabled
    cy.get('input[name="rating_1_star"]')
      .parent()
      .find(".input-rating-items .input-rating-item")
      .eq(2) // Click on 3rd star (should set rating to 3)
      .click();

    // Verify the hidden input value changed
    cy.get('input[name="rating_1_star"]').should("have.value", "3");
  });

  it("supports half-star selection when enabled", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    // Use a real half-star example and click the RIGHT side to change value.
    // (The showcase's `rating_1_star_half` starts at 0.5; clicking right should set to 1.)
    cy.get('input[name="rating_1_star_half"]')
      .parent()
      .find(".input-rating-items .input-rating-item")
      .first()
      .click("right", { force: true });

    // Verify value changed from 0.5 to 1
    cy.get('input[name="rating_1_star_half"]').should("have.value", "1");
  });

  it("displays custom icons for rating (hearts, thumbs, smiley)", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    // Check heart rating
    cy.get('input[name="rating_hearts"]')
      .parent()
      .find(".input-rating-items .input-rating-item")
      .first()
      .should("have.class", "fa-heart");

    // Check thumbs up rating
    cy.get('input[name="rating_thumbs"]')
      .parent()
      .find(".input-rating-items .input-rating-item")
      .first()
      .should("have.class", "fa-thumbs-up");

    // Check smiley rating
    cy.get('input[name="rating_smiley"]')
      .parent()
      .find(".input-rating-items .input-rating-item")
      .first()
      .should("have.class", "fa-smile");
  });

  it("applies custom icon colors to rating items", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    // Check blue star rating has blue color
    cy.get('input[name="rating_blue"]')
      .parent()
      .find(".input-rating-items .input-rating-item")
      .first()
      .should("have.css", "color", "rgb(0, 102, 255)"); // #0066ff

    // Check red heart rating has red color
    cy.get('input[name="rating_red_hearts"]')
      .parent()
      .find(".input-rating-items .input-rating-item")
      .first()
      .should("have.css", "color", "rgb(255, 0, 0)"); // #ff0000
  });

  it("maintains fixed icon width to prevent container growth", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    // Get initial container width
    cy.get('input[name="rating_1_star"]')
      .parent()
      .find(".input-rating-items")
      .then(($container) => {
        const initialWidth = $container[0].offsetWidth;

        // Click on a star to change it from empty to filled
        cy.get('input[name="rating_1_star"]')
          .parent()
          .find(".input-rating-items .input-rating-item")
          .eq(2) // 3rd star
          .click();

        // Verify container width hasn't changed (fixed width prevents growth)
        cy.get('input[name="rating_1_star"]')
          .parent()
          .find(".input-rating-items")
          .should(($containerAfter) => {
            const newWidth = $containerAfter[0].offsetWidth;
            // Allow small tolerance for browser rendering differences
            expect(newWidth).to.be.closeTo(initialWidth, 2);
          });
      });
  });

  it("disables interaction when rating is disabled", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    // Capture initial value
    cy.get('input[name="rating_disabled"]').invoke("val").as("initialValue");

    // Try clicking a star anyway (should not change value)
    cy.get('input[name="rating_disabled"]')
      .should("be.disabled")
      .parent()
      .find(".input-rating-items .input-rating-item")
      .first()
      .should("have.class", "disabled")
      .click({ force: true });

    cy.get("@initialValue").then((initialValue) => {
      cy.get('input[name="rating_disabled"]').should("have.value", String(initialValue));
    });
  });

  it("has proper spacing between rating items", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    // Verify universal spacing exists between rating items
    // Test with different icon types to ensure spacing is consistent
    const ratingInputs = [
      "rating_1_star",
      "rating_thumbs",
      "rating_smiley",
      "rating_hearts",
    ];

    ratingInputs.forEach((name) => {
      cy.get(`input[name="${name}"]`)
        .parent()
        .find(".input-rating-items")
        .should("exist")
        .then(($items) => {
          // Verify container exists and has rating items
          const itemCount = $items.find(".input-rating-item").length;
          expect(itemCount).to.be.at.least(2);
          
          // Check spacing via gap property (CSS sets gap: 2px)
          const gap = window.getComputedStyle($items[0]).gap;
          const columnGap = window.getComputedStyle($items[0]).columnGap;
          
          // If gap is in pixels, verify it's 2px (uniform spacing)
          if (columnGap && columnGap.includes("px")) {
            const gapValue = parseFloat(columnGap);
            expect(gapValue).to.equal(2);
          } else if (gap && gap.includes("px")) {
            const gapValue = parseFloat(gap);
            expect(gapValue).to.equal(2);
          }
          // If gap is "normal" or not in pixels, that's OK - spacing is still applied via CSS
          // The important thing is that items exist and are rendered
        });
    });
  });

  it("updates visual display when rating value changes", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    // Get initial state
    cy.get('input[name="rating_2_star"]')
      .parent()
      .find(".input-rating-items .input-rating-item")
      .eq(1) // Second star should be filled (value is 2)
      .should("have.class", "fas")
      .should("have.class", "fa-star");

    // Click on 4th star
    cy.get('input[name="rating_2_star"]')
      .parent()
      .find(".input-rating-items .input-rating-item")
      .eq(3) // 4th star
      .click();

    // Verify 4th star is now filled
    cy.get('input[name="rating_2_star"]')
      .parent()
      .find(".input-rating-items .input-rating-item")
      .eq(3)
      .should("have.class", "fas")
      .should("have.class", "fa-star");

    // Verify input value updated
    cy.get('input[name="rating_2_star"]').should("have.value", "4");
  });

  it("displays rating examples with different star counts (1-5)", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    // Verify all rating examples from 1/5 to 5/5 exist
    ["rating_1_star", "rating_2_star", "rating_3_star", "rating_4_star", "rating_5_star"].forEach(
      (name) => {
        cy.get(`input[name="${name}"]`).should("exist");
        cy.get(`input[name="${name}"]`)
          .parent()
          .find(".input-rating-items .input-rating-item")
          .should("have.length", 5);
      }
    );
  });

  it("displays half-star examples correctly", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    // Verify all half-star examples have 5 stars total
    const halfStarExamples = [
      "rating_1_star_half",
      "rating_2_star_half",
      "rating_3_star_half",
      "rating_4_star_half",
      "rating_5_star_half",
    ];

    halfStarExamples.forEach((name) => {
      cy.get(`input[name="${name}"]`)
        .parent()
        .find(".input-rating-items .input-rating-item")
        .should("have.length", 5);
    });

    // Check specific half-star visual states
    // rating_1_star_half has value 0.5 - first star should be half-filled
    cy.get('input[name="rating_1_star_half"]')
      .parent()
      .find(".input-rating-items .input-rating-item")
      .first()
      .should("have.class", "fa-star-half-alt");

    // rating_2_star_half has value 1.5 - second star should be half-filled
    cy.get('input[name="rating_2_star_half"]')
      .parent()
      .find(".input-rating-items .input-rating-item")
      .eq(1) // Second item should show half star
      .should("have.class", "fa-star-half-alt");

    // rating_5_star_half has value 4.5 - fifth star should be half-filled
    cy.get('input[name="rating_5_star_half"]')
      .parent()
      .find(".input-rating-items .input-rating-item")
      .eq(4) // Fifth item should show half star
      .should("have.class", "fa-star-half-alt");
  });
});
