describe('Smoke Tests for Google', () => {
  beforeEach(() => {
    cy.visit('https://www.google.com')
  })

  it('Test 1: Page Load Test', () => {
    cy.title().should('include', 'Google')
    cy.url().should('include', 'google.com')
  })

  it('Test 2: Form Interaction Test', () => {
    cy.get('form').should('be.visible')
    cy.get('textarea[name="q"]').should('be.visible')
  })

  it('Test 3: Content Visibility Test', () => {
    cy.get('img').should('be.visible')
    cy.get('body').should('not.be.empty')
  })
})