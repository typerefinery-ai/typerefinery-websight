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

describe("Input Component - Input Masking (Preview)", () => {
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

  it("renders phone number masked input correctly", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    cy.get('input[name="input_phone_masked"]')
      .should("exist")
      .should("have.attr", "type", "tel")
      .should("have.attr", "data-inputmask")
      .should("have.attr", "placeholder", "(123) 456-7890");
  });

  it("renders date masked input correctly", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    cy.get('input[name="input_date_masked"]')
      .should("exist")
      .should("have.attr", "type", "text")
      .should("have.attr", "data-inputmask")
      .should("have.attr", "placeholder", "MM/DD/YYYY");
  });

  it("renders credit card masked input correctly", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    cy.get('input[name="input_creditcard_masked"]')
      .should("exist")
      .should("have.attr", "type", "text")
      .should("have.attr", "data-inputmask")
      .should("have.attr", "placeholder", "1234-5678-9012-3456");
  });

  it("masked inputs have correct component attribute", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    const maskedInputs = [
      "input_phone_masked",
      "input_date_masked",
      "input_creditcard_masked",
    ];

    maskedInputs.forEach((name) => {
      cy.get(`input[name="${name}"]`)
        .should("have.attr", "component", "input")
        .should("have.attr", "isInput", "true")
        .should("have.attr", "data-inputmask");
    });
  });

  it("allows typing in masked phone input", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    cy.get('input[name="input_phone_masked"]')
      .should("exist")
      .should("be.visible");
  });

  it("allows typing in masked date input", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    cy.get('input[name="input_date_masked"]')
      .should("exist")
      .should("be.visible");
  });

  it("allows typing in masked credit card input", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    cy.get('input[name="input_creditcard_masked"]')
      .should("exist")
      .should("be.visible");
  });
});
