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
  datetimeInput:
    "ComponentOverlay_/content/typerefinery-showcase/pages/components/forms/input/jcr:content/rootcontainer/container/form1/container_10/input_datetime_1/field"
};

describe("Input Component - Date and Time Type (Author)", () => {
  beforeEach(() => {
    cy.login();
  });

  it("renders datetime-local component correctly in edit mode", () => {
    cy.intercept(
      "POST",
      "**/section/input/websight-dialogs-service.save-properties.action"
    ).as("saveProperties");

    cy.visit(
      "/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/input::editor"
    );
  });

  it("has datetime-local input component overlay", () => {
    cy.visit(
      "/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/input::editor"
    );

    cy.getByTestId(paths.datetimeInput)
      .find(selectors.overlayName)
      .should("have.text", "blockInput");
  });

  it("has editable General tab in dialog for datetime-local input", () => {
    cy.visit(
      "/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/input::editor"
    );

    cy.getByTestId(paths.datetimeInput).click();
    cy.getByTestId(testIds.gearIcon).click();

    // Verify dialog opens
    cy.get('[data-testid^="ModalDialog_"]').should("be.visible");

    // Verify General tab is present
    cy.contains("General").should("be.visible");
  });

  it("shows 'Date and Time' option in Type dropdown", () => {
    cy.visit(
      "/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/input::editor"
    );

    cy.getByTestId(paths.datetimeInput).click();
    cy.getByTestId(testIds.gearIcon).click();

    cy.get('[data-testid^="ModalDialog_"]').should("be.visible");

    // Find Type field and verify "Date and Time" option exists
    cy.contains("Type").should("be.visible");
    cy.contains("Date and Time").should("exist");
  });

  it("shows format configuration fields when inputType is datetime-local", () => {
    cy.visit(
      "/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/input::editor"
    );

    cy.getByTestId(paths.datetimeInput).click();
    cy.getByTestId(testIds.gearIcon).click();

    cy.get('[data-testid^="ModalDialog_"]').should("be.visible");

    // Verify format fields are visible
    cy.contains("Output Format").should("be.visible");
    cy.contains("Custom Format Pattern").should("be.visible");
  });

  it("shows timezone configuration fields when inputType is datetime-local", () => {
    cy.visit(
      "/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/input::editor"
    );

    cy.getByTestId(paths.datetimeInput).click();
    cy.getByTestId(testIds.gearIcon).click();

    cy.get('[data-testid^="ModalDialog_"]').should("be.visible");

    // Verify timezone fields are visible
    cy.contains("Input Timezone").should("be.visible");
    cy.contains("Output Timezone").should("be.visible");
    cy.contains("Custom Timezone").should("be.visible");
  });

  it("shows format options in Output Format dropdown", () => {
    cy.visit(
      "/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/input::editor"
    );

    cy.getByTestId(paths.datetimeInput).click();
    cy.getByTestId(testIds.gearIcon).click();

    cy.get('[data-testid^="ModalDialog_"]').should("be.visible");

    // Verify format options exist
    cy.contains("ISO 8601").should("exist");
    cy.contains("US Date (MM/DD/YYYY)").should("exist");
    cy.contains("European Date (DD/MM/YYYY)").should("exist");
    cy.contains("Long Date (January 15, 2024)").should("exist");
    cy.contains("Custom").should("exist");
  });

  it("shows timezone options in Input Timezone dropdown", () => {
    cy.visit(
      "/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/input::editor"
    );

    cy.getByTestId(paths.datetimeInput).click();
    cy.getByTestId(testIds.gearIcon).click();

    cy.get('[data-testid^="ModalDialog_"]').should("be.visible");

    // Verify timezone options exist
    cy.contains("Browser Local").should("exist");
    cy.contains("UTC").should("exist");
    cy.contains("Custom").should("exist");
  });

  it("shows custom timezone options when Custom is selected", () => {
    cy.visit(
      "/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/input::editor"
    );

    cy.getByTestId(paths.datetimeInput).click();
    cy.getByTestId(testIds.gearIcon).click();

    cy.get('[data-testid^="ModalDialog_"]').should("be.visible");

    // Verify custom timezone options exist
    cy.contains("America/New_York (Eastern Time)").should("exist");
    cy.contains("America/Los_Angeles (Pacific Time)").should("exist");
    cy.contains("Europe/London (British Time)").should("exist");
  });

  it("saves format configuration correctly", () => {
    cy.intercept(
      "POST",
      "**/section/input/websight-dialogs-service.save-properties.action"
    ).as("saveProperties");

    cy.visit(
      "/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/input::editor"
    );

    cy.getByTestId(paths.datetimeInput).click();
    cy.getByTestId(testIds.gearIcon).click();

    cy.get('[data-testid^="ModalDialog_"]').should("be.visible");

    // Select a format option
    cy.contains("Output Format").parent().find("select").select("us-date");

    // Save dialog
    cy.contains("Save").click();

    // Wait for save to complete
    cy.wait("@saveProperties");

    // Verify dialog closes
    cy.get('[data-testid^="ModalDialog_"]').should("not.exist");
  });

  it("saves timezone configuration correctly", () => {
    cy.intercept(
      "POST",
      "**/section/input/websight-dialogs-service.save-properties.action"
    ).as("saveProperties");

    cy.visit(
      "/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/input::editor"
    );

    cy.getByTestId(paths.datetimeInput).click();
    cy.getByTestId(testIds.gearIcon).click();

    cy.get('[data-testid^="ModalDialog_"]').should("be.visible");

    // Select a timezone option
    cy.contains("Output Timezone").parent().find("select").select("utc");

    // Save dialog
    cy.contains("Save").click();

    // Wait for save to complete
    cy.wait("@saveProperties");

    // Verify dialog closes
    cy.get('[data-testid^="ModalDialog_"]').should("not.exist");
  });

  it("shows validation tab in dialog", () => {
    cy.visit(
      "/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/input::editor"
    );

    cy.getByTestId(paths.datetimeInput).click();
    cy.getByTestId(testIds.gearIcon).click();

    cy.get('[data-testid^="ModalDialog_"]').should("be.visible");

    // Verify Validation tab exists
    cy.contains("Validation").should("be.visible");
  });

  it("shows style tab in dialog", () => {
    cy.visit(
      "/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/input::editor"
    );

    cy.getByTestId(paths.datetimeInput).click();
    cy.getByTestId(testIds.gearIcon).click();

    cy.get('[data-testid^="ModalDialog_"]').should("be.visible");

    // Verify Style tab exists
    cy.contains("Style").should("be.visible");
  });
});
