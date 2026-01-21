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

describe("Input Component - Additional Types (Preview)", () => {
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

  it("renders number input correctly", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    cy.get('input[name="input_number"]')
      .should("exist")
      .should("have.attr", "type", "number")
      .should("have.attr", "placeholder", "Enter a number");
  });

  it("renders time input correctly", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    cy.get('input[name="input_time"]')
      .should("exist")
      .should("have.attr", "type", "time")
      .should("have.attr", "placeholder", "Select time");
  });

  it("renders range input correctly with default attributes", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    cy.get('input[name="input_range_volume"]')
      .should("exist")
      .should("have.attr", "type", "range")
      .should("have.attr", "min", "0")
      .should("have.attr", "max", "100")
      .should("have.attr", "step", "1")
      .should("have.class", "form-range");
  });

  it("renders range input with custom step", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    cy.get('input[name="input_range_percentage"]')
      .should("exist")
      .should("have.attr", "type", "range")
      .should("have.attr", "min", "0")
      .should("have.attr", "max", "100")
      .should("have.attr", "step", "5")
      .should("have.value", "50");
  });

  it("renders range input with negative min value", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    cy.get('input[name="input_range_temperature"]')
      .should("exist")
      .should("have.attr", "type", "range")
      .should("have.attr", "min", "-10")
      .should("have.attr", "max", "40")
      .should("have.attr", "step", "1")
      .should("have.value", "20");
  });

  it("allows changing range input value", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    cy.get('input[name="input_range_volume"]')
      .invoke("val", "75")
      .trigger("change")
      .should("have.value", "75");
  });

  it("renders hidden input (visible in edit mode only)", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    // Hidden inputs should not be visible in preview mode
    cy.get('input[name="input_hidden"]')
      .should("exist")
      .should("have.attr", "type", "hidden")
      .should("have.attr", "value", "hidden-value");
  });

  it("allows typing in number input", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    cy.get('input[name="input_number"]')
      .type("42")
      .should("have.value", "42");
  });

  it("allows selecting time in time input", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    cy.get('input[name="input_time"]')
      .should("exist")
      .should("be.visible");
  });

  it("has correct component attribute on all additional type inputs", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    const additionalInputs = [
      "input_number",
      "input_time",
      "input_range_volume",
      "input_range_percentage",
      "input_range_temperature",
    ];

    additionalInputs.forEach((name) => {
      cy.get(`input[name="${name}"]`)
        .should("have.attr", "component", "input")
        .should("have.attr", "isInput", "true");
    });
  });
});
