import { selectors, testIds } from '../../../../support/const';
const paths = {
  table: 'ComponentOverlay_/content/typerefinery-showcase/pages/components/widgets/table/jcr:content/rootcontainer/container/section/container1_2/table'
}

describe('Table Component', () => {
  beforeEach(() => {
    cy.login();
  });
  it('renders correctly in edit mode', () => {
    cy.intercept(
      'POST',
      '**/section/table/websight-dialogs-service.save-properties.action'
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

  });

  
  it('Has Dialog Box with Editable Tabs', () => {
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/components/widgets/table::editor'
    );
    cy.getByTestId(paths.table).click();
    cy.getByTestId(testIds.gearIcon).click({force: true});
    cy.getByTestId('dialogTab_Style').click();
    cy.getByTestId('dialogTab_Flow').click();
    cy.getByTestId('Action_Cancel').click();

  });
});