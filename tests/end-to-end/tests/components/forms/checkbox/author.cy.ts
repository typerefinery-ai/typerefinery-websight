import { selectors, testIds } from '../../../../support/const';
const paths = {
  checkbox: 'ComponentOverlay_/content/typerefinery-showcase/pages/components/forms/checkbox/jcr:content/rootcontainer/container/form1/checkbox_1/field'
};

describe('Button Component', () => {
  beforeEach(() => {
    cy.login();
  });
  it('renders correctly in edit mode', () => {
    cy.intercept(
      'POST',
      '**/section/checkbox/websight-dialogs-service.save-properties.action'
    ).as('saveProperties');
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/checkbox::editor'
    );
  });
  it('Has checkbox ', () => {
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/checkbox::editor'
    );
    cy.getByTestId(paths.checkbox)
      .find(selectors.overlayName)
      .should('contain.text', 'Checkbox');
  });
  it('Has Editable Tabs In dialog', () => {
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/checkbox::editor'
    );
    cy.getByTestId(paths.checkbox).click();
    cy.getByTestId(testIds.gearIcon).click();
    cy.reload();
  });
});
