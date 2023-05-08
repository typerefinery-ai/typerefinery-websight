describe('Dashboard Page', ()=>{
  beforeEach(() => {
    cy.login();
  });
  it('renders correctly in preview mode', ()=> {
    cy.visit(
      '/content/typerefinery-showcase/pages/pages/dashboard.html'
    );
  });
  it('Dashboard Screenshot',()=>{
    cy.visit(
      '/content/typerefinery-showcase/pages/pages/dashboard.html'
    );
    cy.viewport(1500,1200)
    cy.screenshot()
  })




})