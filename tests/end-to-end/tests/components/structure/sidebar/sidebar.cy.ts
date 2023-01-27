/*
 * Copyright (C) 2022 Typerefinery.io
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// assertions: https://docs.cypress.io/guides/references/assertions
describe('Components - Structure - Sidebar', function () {
  beforeEach(() => {
    cy.login();
  });

  it('render sidebar without authored attributes on a page that has children', function () {
    cy.visit('/content/typerefinery-showcase/pages/components/layout/sidebar.html');

    cy.get("#sidebar")
      .invoke('attr', 'data-tree')
      .then(tree => {
        tree = JSON.parse(tree);
        expect(tree).to.have.property('sidebar');
        expect(tree["sidebar"]).to.have.property('child1');
        expect(tree["sidebar"]).to.have.property('child2');
        expect(tree["sidebar"]).to.have.property('child3');
        expect(tree["sidebar"]).to.have.property('sidebarwithoutparent');
        expect(tree["sidebar"]).to.have.property('sidebarwithparent');
        expect(tree["sidebar"]).to.have.property('jcr:content');
    
    });
  });

  it('render sidebar without authored attributes on a page that hoes not have children', function () {
    cy.visit('/content/typerefinery-showcase/pages/components/layout/sidebar/sidebarwithoutparent.html');

    cy.get("#sidebar")
      .invoke('attr', 'data-tree')
      .then(tree => {
        tree = JSON.parse(tree);
        expect(tree).to.have.property('sidebarwithoutparent');
        expect(tree["sidebarwithoutparent"]).to.have.property('jcr:content');
        expect(tree["sidebarwithoutparent"]).to.not.have.property('child1');
        expect(tree["sidebarwithoutparent"]).to.not.have.property('child2');
        expect(tree["sidebarwithoutparent"]).to.not.have.property('child3');
        expect(tree["sidebarwithoutparent"]).to.not.have.property('sidebarwithoutparent');
        expect(tree["sidebarwithoutparent"]).to.not.have.property('sidebarwithparent');
    
    });
  });
  it('render sidebar without authored parentPagePath on a page that hoes not have children', function () {
    cy.visit('/content/typerefinery-showcase/pages/components/layout/sidebar/sidebarwithparent.html');

    cy.get("#sidebar")
      .invoke('attr', 'data-tree')
      .then(tree => {
        tree = JSON.parse(tree);
        expect(tree).to.have.property('sidebar');
        expect(tree["sidebar"]).to.have.property('child1');
        expect(tree["sidebar"]).to.have.property('child2');
        expect(tree["sidebar"]).to.have.property('child3');
        expect(tree["sidebar"]).to.have.property('sidebarwithoutparent');
        expect(tree["sidebar"]).to.have.property('sidebarwithparent');
        expect(tree["sidebar"]).to.have.property('jcr:content');
    
    });
  });
});

  
