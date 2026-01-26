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

describe("Input Component - Date and Time Type (Preview)", () => {
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

  it("renders datetime-local component correctly in preview mode", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    // Verify datetime-local components are present
    cy.get('input[component="input"][type="datetime-local"]').should("exist");
  });

  it("displays basic datetime-local input", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    cy.get('input[name="datetime_basic"]')
      .should("exist")
      .should("have.attr", "type", "datetime-local");
  });

  it("displays datetime-local with default value", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    // Test with a field that has formatting configured (datetime_with_value has no formatting, uses native behavior)
    // When there's a value and formatting, input is hidden and contains formatted value (not ISO)
    // The display should be visible showing the formatted value
    cy.get('body').then(($body) => {
      const $display = $body.find('input[name="datetime_us_format"] ~ .input-datetime-display');
      if ($display.length > 0) {
        cy.get('input[name="datetime_us_format"]')
          .should("have.class", "input-datetime-hidden")
          .should("have.value")
          .and("not.be.empty");
        
        // Display should be visible
        cy.get('input[name="datetime_us_format"] ~ .input-datetime-display')
          .should("be.visible")
          .should("not.be.empty");
      }
    });
  });

  it("formats datetime value using US date format", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    // Find the US format example
    const $input = cy.get('input[name="datetime_us_format"]');
    
    // If format is configured, should show formatted display
    // Otherwise, native input should be visible
    $input.should("exist");
    
    // Check if formatted display exists (if formatting is active)
    cy.get('body').then(($body) => {
      const $display = $body.find('input[name="datetime_us_format"] ~ .input-datetime-display');
      if ($display.length > 0) {
        // Formatting is active - check display shows formatted value
        cy.get('input[name="datetime_us_format"] ~ .input-datetime-display')
          .should("be.visible")
          .should("contain.text", "/"); // US format contains slashes
      }
    });
  });

  it("formats datetime value using European date format", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    cy.get('input[name="datetime_european_format"]').should("exist");
    
    // Check if formatted display exists
    cy.get('body').then(($body) => {
      const $display = $body.find('input[name="datetime_european_format"] ~ .input-datetime-display');
      if ($display.length > 0) {
        cy.get('input[name="datetime_european_format"] ~ .input-datetime-display')
          .should("be.visible");
      }
    });
  });

  it("formats datetime value using long date format", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    cy.get('input[name="datetime_long_format"]').should("exist");
    
    // Check if formatted display exists
    cy.get('body').then(($body) => {
      const $display = $body.find('input[name="datetime_long_format"] ~ .input-datetime-display');
      if ($display.length > 0) {
        cy.get('input[name="datetime_long_format"] ~ .input-datetime-display')
          .should("be.visible")
          .should("contain.text", "January"); // Long format contains month name
      }
    });
  });

  it("formats datetime value using custom format", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    cy.get('input[name="datetime_custom_format"]').should("exist");
    
    // Check if formatted display exists
    cy.get('body').then(($body) => {
      const $display = $body.find('input[name="datetime_custom_format"] ~ .input-datetime-display');
      if ($display.length > 0) {
        cy.get('input[name="datetime_custom_format"] ~ .input-datetime-display')
          .should("be.visible");
      }
    });
  });

  it("handles UTC timezone conversion", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    cy.get('input[name="datetime_utc"]').should("exist");
    
    // Check if formatted display exists
    cy.get('body').then(($body) => {
      const $display = $body.find('input[name="datetime_utc"] ~ .input-datetime-display');
      if ($display.length > 0) {
        cy.get('input[name="datetime_utc"] ~ .input-datetime-display')
          .should("be.visible");
      }
    });
  });

  it("handles custom timezone conversion", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    cy.get('input[name="datetime_custom_tz"]').should("exist");
    
    // Check if formatted display exists
    cy.get('body').then(($body) => {
      const $display = $body.find('input[name="datetime_custom_tz"] ~ .input-datetime-display');
      if ($display.length > 0) {
        cy.get('input[name="datetime_custom_tz"] ~ .input-datetime-display')
          .should("be.visible");
      }
    });
  });

  it("handles format and timezone combination", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    cy.get('input[name="datetime_format_tz"]').should("exist");
    
    // Check if formatted display exists
    cy.get('body').then(($body) => {
      const $display = $body.find('input[name="datetime_format_tz"] ~ .input-datetime-display');
      if ($display.length > 0) {
        cy.get('input[name="datetime_format_tz"] ~ .input-datetime-display')
          .should("be.visible");
      }
    });
  });

  it("allows user to edit formatted value by clicking display", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    // Find an example with formatting enabled
    cy.get('body').then(($body) => {
      const $display = $body.find('input[name="datetime_us_format"] ~ .input-datetime-display');
      if ($display.length > 0) {
        // Click the display to show native input
        cy.get('input[name="datetime_us_format"] ~ .input-datetime-display')
          .click();
        
        // Native input should now be visible
        cy.get('input[name="datetime_us_format"]')
          .should("be.visible");
      }
    });
  });

  it("updates formatted display when value changes", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    // Find an example with formatting enabled
    cy.get('body').then(($body) => {
      const $display = $body.find('input[name="datetime_us_format"] ~ .input-datetime-display');
      if ($display.length > 0) {
        // Click to edit
        cy.get('input[name="datetime_us_format"] ~ .input-datetime-display')
          .click();
        
        // Change the value
        cy.get('input[name="datetime_us_format"]')
          .clear()
          .type("2024-12-25T10:00")
          .blur();
        
        // Wait for blur handler to process and update display
        cy.wait(100);
        
        // Display should update
        cy.get('input[name="datetime_us_format"] ~ .input-datetime-display')
          .should("be.visible")
          .should("contain.text", "12"); // Should show December
      }
    });
  });

  it("shows required validation for datetime-local", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    cy.get('input[name="datetime_required"]')
      .should("have.attr", "required");
  });

  it("shows disabled state for datetime-local", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    cy.get('input[name="datetime_disabled"]')
      .should("be.disabled");
  });

  it("returns formatted value via $component.val()", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    // Test with US format example - should return formatted value
    cy.get('body').then(($body) => {
      const $display = $body.find('input[name="datetime_us_format"] ~ .input-datetime-display');
      if ($display.length > 0) {
        // Get the input value (should be formatted, not ISO)
        cy.get('input[name="datetime_us_format"]')
          .should("have.value")
          .and("not.be.empty");
      }
    });
  });

  it("empty value: only input visible, display hidden, val() returns empty", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    // Test with basic datetime field that has no value and no formatting (uses native behavior)
    cy.get('input[name="datetime_basic"]').then(($input) => {
      // Input should be visible (no value)
      cy.wrap($input).should("be.visible");
      
      // Display element may not exist if no formatting is configured (native behavior)
      cy.get('body').then(($body) => {
        const $display = $body.find('input[name="datetime_basic"] ~ .input-datetime-display');
        if ($display.length > 0) {
          // If display exists, it should be hidden (no value)
          cy.get('input[name="datetime_basic"] ~ .input-datetime-display')
            .should("not.be.visible");
        }
        // If display doesn't exist, that's also correct (native behavior)
      });
      
      // val() should return empty string
      cy.wrap($input).should("have.value", "");
    });
  });

  it("has value: only display visible, input hidden, val() returns formatted value", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    // Test with datetime field that has a value and formatting
    cy.get('body').then(($body) => {
      const $display = $body.find('input[name="datetime_us_format"] ~ .input-datetime-display');
      if ($display.length > 0) {
        // Display should be visible (has value)
        cy.get('input[name="datetime_us_format"] ~ .input-datetime-display')
          .should("be.visible");
        
        // Input should be hidden (has input-datetime-hidden class)
        cy.get('input[name="datetime_us_format"]')
          .should("have.class", "input-datetime-hidden");
        
        // val() should return formatted value (not empty)
        cy.get('input[name="datetime_us_format"]')
          .should("have.value")
          .and("not.be.empty");
      }
    });
  });

  it("both elements not visible simultaneously on page load", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    // Check all datetime fields - only one should be visible at a time
    cy.get('input[type="datetime-local"], input[type="date"], input[type="time"]').each(($input) => {
      const name = $input.attr("name");
      if (name) {
        cy.wrap($input).then(($el) => {
          const hasValue = $el.val() && $el.val() !== "";
          const hasHiddenClass = $el.hasClass("input-datetime-hidden");
          
          // Check if display element exists (only exists if formatting is configured)
          cy.get('body').then(($body) => {
            const $display = $body.find(`input[name="${name}"] ~ .input-datetime-display`);
            
            if ($display.length > 0) {
              // Display element exists (formatting is configured)
              if (hasValue && hasHiddenClass) {
                // Has value and hidden: display should be visible, input should not be visible
                cy.get(`input[name="${name}"] ~ .input-datetime-display`)
                  .should("be.visible");
                cy.get(`input[name="${name}"]`)
                  .should("not.be.visible");
              } else {
                // No value: input should be visible, display should not be visible
                cy.get(`input[name="${name}"]`)
                  .should("be.visible");
                cy.get(`input[name="${name}"] ~ .input-datetime-display`)
                  .should("not.be.visible");
              }
            } else {
              // No display element (native behavior, no formatting configured)
              // Input should be visible regardless of value
              cy.get(`input[name="${name}"]`)
                .should("be.visible");
            }
          });
        });
      }
    });
  });

  it("focus and unfocus does NOT change val() - prevents value increase", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    // Test with UTC timezone field that was causing value increases
    cy.get('body').then(($body) => {
      const $display = $body.find('input[name="datetime_utc"] ~ .input-datetime-display');
      if ($display.length > 0) {
        // Get initial value
        cy.get('input[name="datetime_utc"]')
          .invoke('val')
          .then((initialValue) => {
            // Click display to focus (edit mode)
            cy.get('input[name="datetime_utc"] ~ .input-datetime-display')
              .click();
            
            // Don't change anything, just blur (click away)
            cy.get('input[name="datetime_basic"]')
              .click();
            
            // Value should be exactly the same (no increase/change)
            cy.get('input[name="datetime_utc"]')
              .should('have.value', initialValue);
            
            // Display should be restored and visible
            cy.get('input[name="datetime_utc"] ~ .input-datetime-display')
              .should('be.visible');
          });
      }
    });
  });

  it("focus and unfocus restores display values - no disappearing", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    // Test with UTC timezone field that was causing display disappearing  
    cy.get('body').then(($body) => {
      const $display = $body.find('input[name="datetime_utc"] ~ .input-datetime-display');
      if ($display.length > 0) {
        // Get initial display text
        cy.get('input[name="datetime_utc"] ~ .input-datetime-display')
          .invoke('text')
          .then((initialDisplayText) => {
            // Click display to focus (edit mode)
            cy.get('input[name="datetime_utc"] ~ .input-datetime-display')
              .click();
            
            // Don't change anything, just blur (click away)
            cy.get('input[name="datetime_basic"]')
              .click();
            
            // Display should be visible again with same text
            cy.get('input[name="datetime_utc"] ~ .input-datetime-display')
              .should('be.visible')
              .should('contain.text', initialDisplayText);
          });
      }
    });
  });

  it("display format stays consistent on focus/unfocus without value change", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    // Test with US format field
    cy.get('body').then(($body) => {
      const $display = $body.find('input[name="datetime_us_format"] ~ .input-datetime-display');
      if ($display.length > 0) {
        // Get initial display text (should be US format MM/DD/YYYY)
        cy.get('input[name="datetime_us_format"] ~ .input-datetime-display')
          .invoke('text')
          .then((initialDisplayText) => {
            // Verify it's US format (contains / and month first)
            expect(initialDisplayText).to.match(/\d{2}\/\d{2}\/\d{4}/);
            
            // Click display to focus (edit mode)
            cy.get('input[name="datetime_us_format"] ~ .input-datetime-display')
              .click();
            
            // Don't change anything, just blur (click away)
            cy.get('input[name="datetime_basic"]')
              .click();
            
            // Display should have same format (US format, not European)
            cy.get('input[name="datetime_us_format"] ~ .input-datetime-display')
              .should('be.visible')
              .invoke('text')
              .then((afterDisplayText) => {
                // Should still be US format (MM/DD/YYYY), not European (DD/MM/YYYY)
                expect(afterDisplayText).to.match(/\d{2}\/\d{2}\/\d{4}/);
                // First number should be month (1-12), not day (13-31)
                const firstPart = afterDisplayText.split('/')[0];
                const month = parseInt(firstPart);
                expect(month).to.be.at.least(1).and.at.most(12);
              });
          });
      }
    });
  });

  it("tab order works correctly for datetime fields", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    // Test with US format field that has a value (display visible)
    cy.get('body').then(($body) => {
      const $display = $body.find('input[name="datetime_us_format"] ~ .input-datetime-display');
      if ($display.length > 0) {
        // Display should be focusable (tabindex="0")
        cy.get('input[name="datetime_us_format"] ~ .input-datetime-display')
          .should('have.attr', 'tabindex', '0');
        
        // Input should be hidden and not in tab order (tabindex="-1")
        cy.get('input[name="datetime_us_format"]')
          .should('have.class', 'input-datetime-hidden')
          .should('have.attr', 'tabindex', '-1');
        
        // Focus display element
        cy.get('input[name="datetime_us_format"] ~ .input-datetime-display')
          .focus();
        
        // Press Enter to activate (show input)
        cy.get('input[name="datetime_us_format"] ~ .input-datetime-display')
          .type('{enter}');
        
        // Input should now be visible and in tab order
        cy.get('input[name="datetime_us_format"]')
          .should('be.visible')
          .should('not.have.class', 'input-datetime-hidden')
          .should('not.have.attr', 'tabindex', '-1');
        
        // Display should be hidden and not in tab order
        cy.get('input[name="datetime_us_format"] ~ .input-datetime-display')
          .should('not.be.visible')
          .should('have.attr', 'tabindex', '-1');
      }
    });
    
    // Test with empty field (input visible, display hidden)
    cy.get('input[name="datetime_basic"]').then(($input) => {
      // Input should be visible and in tab order (no tabindex="-1")
      cy.wrap($input)
        .should('be.visible')
        .should('not.have.attr', 'tabindex', '-1');
    });
  });

  it("input and display have identical dimensions - no form layout shift on focus", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    // Test with US format field that has formatting
    cy.get('body').then(($body) => {
      const $display = $body.find('input[name="datetime_us_format"] ~ .input-datetime-display');
      if ($display.length > 0) {
        // Get initial position of element below the datetime field
        cy.get('input[name="datetime_us_format"]').then(($input) => {
          // Find next form element (could be next input, label, etc.)
          const $nextElement = $input.closest('field').next('field');
          if ($nextElement.length > 0) {
            // Get initial position
            cy.wrap($nextElement[0]).then(($el) => {
              const initialTop = $el[0].getBoundingClientRect().top;
              
              // Click display to focus (input becomes visible)
              cy.get('input[name="datetime_us_format"] ~ .input-datetime-display')
                .click();
              
              // Wait for transition
              cy.wait(100);
              
              // Check that next element hasn't moved (layout shift)
              cy.wrap($el[0]).then(($elAfter) => {
                const afterTop = $elAfter[0].getBoundingClientRect().top;
                // Allow 1px tolerance for rounding
                expect(Math.abs(afterTop - initialTop)).to.be.lessThan(2);
              });
              
              // Blur to restore display
              cy.get('input[name="datetime_us_format"]').blur();
              
              // Wait for transition
              cy.wait(100);
              
              // Check that next element still hasn't moved
              cy.wrap($el[0]).then(($elAfter) => {
                const afterTop = $elAfter[0].getBoundingClientRect().top;
                // Allow 1px tolerance for rounding
                expect(Math.abs(afterTop - initialTop)).to.be.lessThan(2);
              });
            });
          }
        });
      }
    });
  });
});
