import { selectors, testIds } from '../../../../../../../support/const';
const paths = {
  table: 'ComponentOverlay_rootcontainer/maincontainer/pagesection/table'
}

describe('Table Component', () => {
  beforeEach(() => {
    cy.login();
  });
  it('renders correctly in edit mode', () => {
    cy.intercept(
      'POST',
      '**/pagesection/table/websight-dialogs-service.save-properties.action'
    ).as('saveProperties');
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/components/widgets/table::editor'
    );
  });

  it('Has Table Component', () => {
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/components/widgets/table::editor'
    );
    cy.getByTestId(paths.table)
      .find(selectors.overlayName)
      .should('contain.text', 'Table');
    cy.getByTestId(paths.table).click();
    cy.getByTestId(testIds.editIcon).click();
    cy.getByTestId('dialogTab_WebSocketDataSource').click()
    cy.getByTestId('Action_Cancel').click();
    cy.reload()
    cy.getByTestId(paths.table)
      .find(selectors.overlayName)
      .should('contain.text', 'Table');

    cy.screenshot('Table Edited')

  });
});