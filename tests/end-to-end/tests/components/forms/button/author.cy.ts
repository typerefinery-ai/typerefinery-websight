import { selectors, testIds } from '../../../../support/const';
const paths = {
  button:
    'ComponentOverlay_/content/typerefinery-showcase/pages/components/forms/button/jcr:content/rootcontainer/container/form1/container_1/button_1'
};

describe('Button Component', () => {
  beforeEach(() => {
    cy.login();
  });
  it('renders correctly in edit mode', () => {
    cy.intercept(
      'POST',
      '**/section/button/websight-dialogs-service.save-properties.action'
    ).as('saveProperties');
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/button::editor'
    );
  });
  it('Has Button ', () => {
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/button::editor'
    );
    cy.getByTestId(paths.button)
      .find(selectors.overlayName)
      .should('contain.text', 'Button');
  });
  it('Has Editable Tab In dialog', () => {
    cy.visit(
      '/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/button::editor'
    );
    cy.getByTestId(paths.button).click();
    cy.getByTestId(testIds.gearIcon).click();
    cy.getByTestId('Input_Label').type('LabelTest');
    cy.getByTestId(testIds.dialogSubmitButton).click();
    cy.reload();
  });
});
