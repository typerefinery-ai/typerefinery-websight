import { selectors, testIds } from '../../../../support/const';
const paths = {
  containerList:
    'ComponentOverlay_/content/typerefinery-showcase/pages/components/layout/containerlist/jcr:content/rootcontainer/main/containerlist'
};

describe('Container List Component', () => {
  beforeEach(() => {
    cy.login();
  });
  it('renders correctly in edit mode', () => {
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/components/layout/containerlist::editor'
    );
  });
  it('Has Container List', () => {
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/components/layout/containerlist::editor'
    );
    cy.getByTestId(paths.containerList)

      .find(selectors.overlayName)
      .should('contain.text', 'Container List');
  });

  it('Has Dialog Box with Editable Tabs', () => {
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/components/layout/containerlist::editor'
    );
    cy.getByTestId(paths.containerList).click({ force: true });
    cy.getByTestId(testIds.gearIcon).click({ force: true });
  });

  it('Has Templates', () => {
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/components/layout/containerlist::editor'
    );
    cy.getByTestId(paths.containerList).click({ force: true });
    cy.getByTestId(testIds.gearIcon).click({ force: true });
    cy.getByTestId('dialogTab_Path').contains('Path');

    cy.getByTestId('dialogTab_Alignment').contains('Alignment');
    cy.getByTestId(testIds.dialogSubmitButton).click();
    cy.reload();
  });
});
