import { selectors, testIds } from '../../../../../../../support/const';
const paths = {
button: 'ComponentOverlay_rootcontainer/maincontainer/pagesection/button'
};

describe('Button Component', () => {
  beforeEach(() => {
    cy.login();
  });
  it('renders correctly in edit mode', () => {
    cy.intercept(
      'POST',
      '**/pagesection/button/websight-dialogs-service.save-properties.action'
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
      .should('contain.text','Button');    
    })
    it('Has Editable General TAb In dialog', () => {
      cy.visit(
        '/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/button::editor'
      );
      cy.getByTestId(paths.button).click();
      cy.getByTestId(testIds.editIcon).click();
      cy.getByTestId('Input_Label').type('LabelTest');
      cy.getByTestId(testIds.dialogSubmitButton).click();
      cy.reload()
    })
})
  