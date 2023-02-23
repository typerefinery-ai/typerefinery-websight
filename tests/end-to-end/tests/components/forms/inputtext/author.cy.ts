import { selectors, testIds } from '../../../../support/const';
const paths = {
textArea: 'ComponentOverlay_rootcontainer/maincontainer/pagesection/textarea'
};

describe('inputText Component', () => {
  beforeEach(() => {
    cy.login(); 
  });
  it('renders correctly in edit mode', () => {
    cy.intercept(
      'POST',
      '**/pagesection/textarea/websight-dialogs-service.save-properties.action'
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
      .should('have.text','blockTextarea'); 
    })
    it('Has Editable General TAb In dialog', () => {
      cy.visit(
        '/apps/websight/index.html/content/typerefinery-showcase/pages/components/forms/textarea::editor'
      );
      cy.getByTestId(paths.textArea).click();
      cy.getByTestId(testIds.editIcon).click();
      cy.reload()
    })
})