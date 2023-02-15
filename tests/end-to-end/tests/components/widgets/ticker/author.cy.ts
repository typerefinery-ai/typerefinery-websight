import { selectors, testIds } from '../../../../../../../support/const';
const paths = {
 ticker: 'ComponentOverlay_rootcontainer/maincontainer/pagesection1/ticker'
}

describe('Ticker Component', () => {
  beforeEach(() => {
    cy.login();
  });
  it('renders correctly in edit mode', () => {

    cy.intercept(
      'POST',
      '**/pagesection/ticker/websight-dialogs-service.save-properties.action'
    ).as('saveProperties');

    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/components/widgets/ticker::editor'
    );
  });
  it('Has Card Item', () => {
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/components/widgets/ticker::editor'
    );
    cy.getByTestId(paths.ticker)

      .find(selectors.overlayName)
      .should('contain.text', 'Ticker');
    cy.getByTestId(paths.ticker).click();
    cy.getByTestId(testIds.editIcon).click();
    cy.getByTestId('Input_Title').clear().type('Test 1');
    cy.getByTestId('Input_IndicatorValue').clear().type('12234');
    cy.getByTestId(testIds.dialogSubmitButton).click();
    cy.reload()
    cy.get('.css-7uss0q').click();
  });






});