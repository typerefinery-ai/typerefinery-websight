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

describe("Input Component - Validation (Preview)", () => {
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

  it("renders required email field correctly", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    cy.get('input[name="input_email_required"]')
      .should("exist")
      .should("have.attr", "type", "email")
      .should("have.attr", "required")
      .should("have.attr", "placeholder", "email@example.com");
  });

  it("renders required text field correctly", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    cy.get('input[name="input_text_required"]')
      .should("exist")
      .should("have.attr", "type", "text")
      .should("have.attr", "required")
      .should("have.attr", "placeholder", "This field is required");
  });

  it("required fields show required attribute", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    const requiredInputs = ["input_email_required", "input_text_required"];

    requiredInputs.forEach((name) => {
      cy.get(`input[name="${name}"]`).should("have.attr", "required");
    });
  });

  it("required fields have correct component attribute", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    const requiredInputs = ["input_email_required", "input_text_required"];

    requiredInputs.forEach((name) => {
      cy.get(`input[name="${name}"]`)
        .should("have.attr", "component", "input")
        .should("have.attr", "isInput", "true");
    });
  });

  it("allows typing in required email field", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    cy.get('input[name="input_email_required"]')
      .type("test@example.com")
      .should("have.value", "test@example.com");
  });

  it("allows typing in required text field", () => {
    cy.visit(
      "/content/typerefinery-showcase/pages/components/forms/input.html"
    );

    cy.get('input[name="input_text_required"]')
      .type("Required text")
      .should("have.value", "Required text");
  });
});
