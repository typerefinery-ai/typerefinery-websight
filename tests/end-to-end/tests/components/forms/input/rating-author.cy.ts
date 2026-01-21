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

import { selectors, testIds } from "../../../../support/const";

const paths = {
  ratingInput:
    "ComponentOverlay_/content/typerefinery-showcase/pages/components/forms/input/jcr:content/rootcontainer/container/form1/container_8/input_rating_1/field"
};

describe("Input Component - Rating Type (Author)", () => {
  beforeEach(() => {
    cy.login();
  });

  it("renders rating component correctly in edit mode", () => {
    cy.intercept(
      "POST",
      "**/section/input/websight-dialogs-service.save-properties.action"
    ).as("saveProperties");

    cy.visit(
      "/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/input::editor"
    );
  });

  it("has rating input component overlay", () => {
    cy.visit(
      "/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/input::editor"
    );

    cy.getByTestId(paths.ratingInput)
      .find(selectors.overlayName)
      .should("have.text", "blockInput");
  });

  it("has editable General tab in dialog for rating input", () => {
    cy.visit(
      "/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/input::editor"
    );

    cy.getByTestId(paths.ratingInput).click();
    cy.getByTestId(testIds.gearIcon).click();

    // Verify dialog opens
    cy.get('[data-testid^="ModalDialog_"]').should("be.visible");

    // Verify General tab is present
    cy.contains("General").should("be.visible");
  });

  it("shows validation tab in dialog", () => {
    cy.visit(
      "/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/input::editor"
    );

    cy.getByTestId(paths.ratingInput).click();
    cy.getByTestId(testIds.gearIcon).click();

    cy.get('[data-testid^="ModalDialog_"]').should("be.visible");

    // Verify Validation tab exists
    cy.contains("Validation").should("be.visible");
  });

  it("shows style tab in dialog", () => {
    cy.visit(
      "/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/input::editor"
    );

    cy.getByTestId(paths.ratingInput).click();
    cy.getByTestId(testIds.gearIcon).click();

    cy.get('[data-testid^="ModalDialog_"]').should("be.visible");

    // Verify Style tab exists
    cy.contains("Style").should("be.visible");
  });

  it("has rating-specific fields in dialog when inputType is rating", () => {
    cy.visit(
      "/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/input::editor"
    );

    cy.getByTestId(paths.ratingInput).click();
    cy.getByTestId(testIds.gearIcon).click();

    // Wait for dialog to open
    cy.get('[data-testid^="ModalDialog_"]').should("be.visible");

    // Set inputType to rating
    cy.get('input[name="inputType"]').clear().type("rating");

    // Verify rating-specific fields appear
    cy.contains("Maximum Stars").should("be.visible");
    cy.contains("Allow Half Stars").should("be.visible");
    cy.contains("Filled Icon Class").should("be.visible");
    cy.contains("Empty Icon Class").should("be.visible");
    cy.contains("Half Icon Class").should("be.visible");
    cy.contains("Icon Color").should("be.visible");
  });

  it("allows configuring icon color for rating", () => {
    cy.visit(
      "/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/input::editor"
    );

    cy.getByTestId(paths.ratingInput).click();
    cy.getByTestId(testIds.gearIcon).click();

    cy.get('[data-testid^="ModalDialog_"]').should("be.visible");

    // Set inputType to rating
    cy.get('input[name="inputType"]').clear().type("rating");

    // Verify Icon Color field exists and has default value
    cy.contains("Icon Color")
      .parent()
      .find('input[name="ratingIconColor"]')
      .should("exist")
      .should("have.value", "#ffc107");
  });
});
