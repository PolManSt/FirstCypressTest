describe('Smoke Tests for Google', () => {
  beforeEach(() => {
    cy.visit('http:\\google.ro')
  })

  it('Test 1: Page Load Test', () => {
        cy.title().should('not.be.empty')
    cy.url().should('include', 'google.ro')
  })

  it('Test 2: Form Interaction Test', () => {
        cy.get('form').should('be.visible')
    cy.get('input.lsb').should('be.visible')
  })

  it('Test 3: Content Visibility Test', () => {
        cy.get('img').should('be.visible')
    cy.get('body').should('not.be.empty')
  })
})