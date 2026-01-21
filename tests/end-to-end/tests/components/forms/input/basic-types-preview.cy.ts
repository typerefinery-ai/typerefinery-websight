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

describe("Input Component - Basic Types (Preview)", () => {
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

  it("renders email input correctly", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    cy.get('input[name="input_email"]')
      .should("exist")
      .should("have.attr", "type", "email")
      .should("have.attr", "placeholder", "Eg. test@example.com");
  });

  it("renders text input correctly", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    cy.get('input[name="input_name"]')
      .should("exist")
      .should("have.attr", "type", "text")
      .should("have.attr", "placeholder", "Eg. John Henry");
  });

  it("renders tel input correctly", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    cy.get('input[name="input_phone"]')
      .should("exist")
      .should("have.attr", "type", "tel")
      .should("have.attr", "placeholder", "Eg. 65412441245");
  });

  it("renders date input correctly", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    cy.get('input[name="input_date"]')
      .should("exist")
      .should("have.attr", "type", "date");
  });

  it("renders password input correctly", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    cy.get('input[name="input_password"]')
      .should("exist")
      .should("have.attr", "type", "password")
      .should("have.attr", "placeholder", "Eg. 123456");
  });

  it("allows typing in email input", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    cy.get('input[name="input_email"]')
      .type("test@example.com")
      .should("have.value", "test@example.com");
  });

  it("allows typing in text input", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    cy.get('input[name="input_name"]')
      .type("John Doe")
      .should("have.value", "John Doe");
  });

  it("allows typing in tel input", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    cy.get('input[name="input_phone"]')
      .type("1234567890")
      .should("have.value", "1234567890");
  });

  it("allows selecting date in date input", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    cy.get('input[name="input_date"]')
      .should("exist")
      .should("be.visible");
  });

  it("masks password input", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    cy.get('input[name="input_password"]')
      .type("secretpassword")
      .should("have.value", "secretpassword")
      .should("have.attr", "type", "password");
  });

  it("has correct component attribute on all basic inputs", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    const basicInputs = [
      "input_email",
      "input_name",
      "input_phone",
      "input_date",
      "input_password",
    ];

    basicInputs.forEach((name) => {
      cy.get(`input[name="${name}"]`)
        .should("have.attr", "component", "input")
        .should("have.attr", "isInput", "true");
    });
  });
});
