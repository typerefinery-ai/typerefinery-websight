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
  requiredEmailInput:
    "ComponentOverlay_/content/typerefinery-showcase/pages/components/forms/input/jcr:content/rootcontainer/container/form1/container_3/input_11/field",
};

describe("Input Component - Validation (Author)", () => {
  beforeEach(() => {
    cy.login();
  });

  it("renders validation examples correctly in edit mode", () => {
    cy.intercept(
      "POST",
      "**/section/input/websight-dialogs-service.save-properties.action"
    ).as("saveProperties");

    cy.visit(
      "/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/input::editor"
    );
  });

  it("has required input component overlay", () => {
    cy.visit(
      "/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/input::editor"
    );

    cy.getByTestId(paths.requiredEmailInput)
      .find(selectors.overlayName)
      .should("have.text", "blockInput");
  });

  it("has editable General tab in dialog for required input", () => {
    cy.visit(
      "/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/input::editor"
    );

    cy.getByTestId(paths.requiredEmailInput).click();
    cy.getByTestId(testIds.gearIcon).click();

    cy.get('[data-testid^="ModalDialog_"]').should("be.visible");
    cy.contains("General").should("be.visible");
  });

  it("shows validation tab in dialog with required checkbox", () => {
    cy.visit(
      "/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/input::editor"
    );

    cy.getByTestId(paths.requiredEmailInput).click();
    cy.getByTestId(testIds.gearIcon).click();

    cy.get('[data-testid^="ModalDialog_"]').should("be.visible");
    cy.contains("Validation").should("be.visible").click();

    // Verify required checkbox is present
    cy.contains("Required").should("be.visible");
  });

  it("shows style tab in dialog", () => {
    cy.visit(
      "/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/input::editor"
    );

    cy.getByTestId(paths.requiredEmailInput).click();
    cy.getByTestId(testIds.gearIcon).click();

    cy.get('[data-testid^="ModalDialog_"]').should("be.visible");
    cy.contains("Style").should("be.visible");
  });
});
