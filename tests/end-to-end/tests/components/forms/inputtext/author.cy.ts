import { selectors, testIds } from '../../../../support/const';
const paths = {
  textArea:
    'ComponentOverlay_/content/typerefinery-showcase/pages/components/forms/textarea/jcr:content/rootcontainer/container/form1/textarea_1/field'
};

describe('inputText Component', () => {
  beforeEach(() => {
    cy.login();
  });
  it('renders correctly in edit mode', () => {
    cy.intercept(
      'POST',
      '**/section/textarea/websight-dialogs-service.save-properties.action'
    ).as('saveProperties');
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/textarea::editor'
    );
  });
  it('Has inputText ', () => {
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/textarea::editor'
    );
    cy.getByTestId(paths.textArea)
      .find(selectors.overlayName)
      .should('have.text', 'blockTextarea');
  });
  it('Has Editable General TAb In dialog', () => {
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/textarea::editor'
    );
    cy.getByTestId(paths.textArea).click();
    cy.getByTestId(testIds.gearIcon).click();
  });
});
