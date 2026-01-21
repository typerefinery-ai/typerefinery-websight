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

describe("Input Component - Colour Picker (Preview)", () => {
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

  it("renders basic colour picker correctly", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    cy.get('input[name="input_color_basic"]')
      .should("exist")
      .should("have.attr", "type", "color")
      .should("have.value", "#4285f4")
      .should("have.class", "form-control")
      .should("have.class", "form-control-color");
  });

  it("renders colour picker with default value", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    cy.get('input[name="input_color_default"]')
      .should("exist")
      .should("have.attr", "type", "color")
      .should("have.value", "#ff0000");
  });

  it("renders required colour picker", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    cy.get('input[name="input_color_required"]')
      .should("exist")
      .should("have.attr", "type", "color")
      .should("have.attr", "required")
      .should("have.value", "#00ff00");
  });

  it("renders disabled colour picker", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    cy.get('input[name="input_color_disabled"]')
      .should("exist")
      .should("have.attr", "type", "color")
      .should("have.attr", "disabled")
      .should("have.value", "#0000ff")
      .should("be.disabled");
  });

  it("allows changing colour picker value", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    cy.get('input[name="input_color_basic"]')
      .invoke("val", "#ff0000")
      .trigger("change")
      .should("have.value", "#ff0000");
  });

  it("has correct component attribute on all colour picker inputs", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    const colorInputs = [
      "input_color_basic",
      "input_color_default",
      "input_color_required",
      "input_color_disabled",
    ];

    colorInputs.forEach((name) => {
      cy.get(`input[name="${name}"]`)
        .should("have.attr", "component", "input")
        .should("have.attr", "isInput", "true")
        .should("have.attr", "type", "color");
    });
  });

  it("colour picker has correct CSS classes", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    cy.get('input[name="input_color_basic"]')
      .should("have.class", "form-control")
      .should("have.class", "form-control-color");
  });
});
