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
  disabledTextInput:
    "ComponentOverlay_/content/typerefinery-showcase/pages/components/forms/input/jcr:content/rootcontainer/container/form1/container_5/input_16/field",
};

describe("Input Component - Disabled States (Author)", () => {
  beforeEach(() => {
    cy.login();
  });

  it("renders disabled inputs correctly in edit mode", () => {
    cy.intercept(
      "POST",
      "**/section/input/websight-dialogs-service.save-properties.action"
    ).as("saveProperties");

    cy.visit(
      "/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/input::editor"
    );
  });

  it("has disabled input component overlay", () => {
    cy.visit(
      "/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/input::editor"
    );

    cy.getByTestId(paths.disabledTextInput)
      .find(selectors.overlayName)
      .should("have.text", "blockInput");
  });

  it("has editable General tab in dialog for disabled input", () => {
    cy.visit(
      "/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/input::editor"
    );

    cy.getByTestId(paths.disabledTextInput).click();
    cy.getByTestId(testIds.gearIcon).click();

    cy.get('[data-testid^="ModalDialog_"]').should("be.visible");
    cy.contains("General").should("be.visible");
  });

  it("shows validation tab in dialog", () => {
    cy.visit(
      "/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/input::editor"
    );

    cy.getByTestId(paths.disabledTextInput).click();
    cy.getByTestId(testIds.gearIcon).click();

    cy.get('[data-testid^="ModalDialog_"]').should("be.visible");
    cy.contains("Validation").should("be.visible");
  });

  it("shows style tab in dialog", () => {
    cy.visit(
      "/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/input::editor"
    );

    cy.getByTestId(paths.disabledTextInput).click();
    cy.getByTestId(testIds.gearIcon).click();

    cy.get('[data-testid^="ModalDialog_"]').should("be.visible");
    cy.contains("Style").should("be.visible");
  });
});
