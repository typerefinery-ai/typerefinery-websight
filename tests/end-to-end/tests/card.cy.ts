/*
 * Copyright (C) 2022 Typerefinery.io
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
import { selectors, testIds } from '../support/const';
const paths = {
  cardsList:
    'ComponentOverlay_rootcontainer/maincontainer/pagesection/cardslist',
  cardItem: 'ComponentOverlay_rootcontainer/maincontainer/pagesection2/card'
};
describe('Typerefinery MainComponent', () => {
  beforeEach(() => {
    cy.login();
  });
  it('renders correctly in preview mode', () => {
    cy.visit(
      '/content/typerefinery-showcase/pages/components/content/card.html'
    );

    cy.get('.value').contains('1531.12K');
  });
  it('renders correctly in edit mode', () => {
    cy.intercept(
      'POST',
      '**/pagesection/card/websight-dialogs-service.save-properties.action'
    ).as('saveProperties');
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/components/content/card::editor'
    );
  });
  it('Has Card Item', () => {
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/components/content/card::editor'
    );
    cy.getByTestId(paths.cardItem)

      .find(selectors.overlayName)
      .should('contain.text', 'Card Item');
    cy.getByTestId(paths.cardItem).click();
    cy.getByTestId(testIds.editIcon).click();
    cy.getByTestId('Input_Title').clear().type('Test 1');
    cy.getByTestId('Input_SubTitle').clear().type('Card component');
    cy.getByTestId('Input_Description').clear().type('card description test');
    cy.getByTestId(testIds.dialogSubmitButton).click();
    cy.get('.css-7uss0q').click();
  });
});
