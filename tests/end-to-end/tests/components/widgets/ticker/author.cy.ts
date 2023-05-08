import { selectors, testIds } from '../../../../support/const';
const paths = {
 ticker: 'ComponentOverlay_/content/typerefinery-showcase/pages/components/widgets/ticker/jcr:content/rootcontainer/container1/container1_1/container1_1_1/ticker1'
}

describe('Ticker Component', () => {
  beforeEach(() => {
    cy.login();
  });
  it('renders correctly in edit mode', () => {

    cy.intercept(
      'POST',
      '**/section/ticker/websight-dialogs-service.save-properties.action'
    ).as('saveProperties');

    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/components/widgets/ticker::editor'
    );
  });
  it('Has Ticker', () => {
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/components/widgets/ticker::editor'
    );
    cy.getByTestId(paths.ticker)

      .find(selectors.overlayName)
      .should('contain.text', 'Ticker');
  });

  it('Has Dialog Box with Editable Tabs', () => {
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/components/widgets/ticker::editor'
    );
    cy.getByTestId(paths.ticker).click();
    cy.getByTestId(testIds.gearIcon).click({force: true})
})

it('Has Templates', () => {
  cy.visit(
    '/apps/websight/index.html/content/typerefinery-showcase/pages/components/widgets/ticker::editor'
  );
  cy.getByTestId(paths.ticker).click();
  cy.getByTestId(testIds.gearIcon).click({force: true})
  cy.getByTestId('dialogTab_Template').click({force: true})
  cy.get('.Input_ChooseTickerTemplate__value-container').click({force: true})
  cy.get('#react-select-3-option-2').click()
  cy.getByTestId(testIds.dialogSubmitButton).click();
  cy.reload()

})






});