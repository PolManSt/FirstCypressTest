const BaseAgent = require('./BaseAgent');
const fs = require('fs').promises;
const path = require('path');

/**
 * Agent 3: Cypress Test Creator
 * Converts smoke tests to Cypress test cases
 */
class CypressTestCreatorAgent extends BaseAgent {
  constructor(nextAgent = null) {
    super('Cypress Test Creator', nextAgent);
  }

  async execute(input) {
    const { url, pageAnalysis, smokeTests } = input;
    this.log('Creating Cypress test cases from smoke tests');

    try {
      // Generate Cypress test file content
      const testFileContent = this.generateCypressTests(url, smokeTests, pageAnalysis);

      // Write test file
      const testFilePath = path.join(process.cwd(), 'cypress', 'integration', 'smoke-tests.spec.js');
      await fs.writeFile(testFilePath, testFileContent, 'utf8');

      this.log(`Created Cypress test file: ${testFilePath}`);

      // Pass test information to next agent
      return await this.passToNext({
        url,
        pageAnalysis,
        smokeTests,
        testFilePath,
        testFileContent
      });

    } catch (error) {
      this.log(`Error creating Cypress tests: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate Cypress test file content
   * @param {string} url - Target URL
   * @param {Array} smokeTests - Smoke tests to convert
   * @param {Object} pageAnalysis - Page analysis data
   * @returns {string} - Cypress test file content
   */
  generateCypressTests(url, smokeTests, pageAnalysis) {
    const testCases = smokeTests.map((test, index) =>
      this.generateTestCase(test, index + 1, url, pageAnalysis)
    ).join('\n\n');

    return `describe('Smoke Tests for ${pageAnalysis.title || url}', () => {
  beforeEach(() => {
    cy.visit('${url}')
  })

${testCases}
})`;
  }

  /**
   * Generate a single Cypress test case
   * @param {Object} test - Smoke test object
   * @param {number} index - Test index
   * @param {string} url - Target URL
   * @param {Object} pageAnalysis - Page analysis data
   * @returns {string} - Cypress test case
   */
  generateTestCase(test, index, url, pageAnalysis) {
    let testBody = '';

    switch (test.type) {
      case 'load':
        testBody = this.generateLoadTest(test, pageAnalysis);
        break;
      case 'form':
        testBody = this.generateFormTest(test, pageAnalysis);
        break;
      case 'navigation':
        testBody = this.generateNavigationTest(test, pageAnalysis);
        break;
      case 'ecommerce':
        testBody = this.generateEcommerceTest(test, pageAnalysis);
        break;
      case 'content':
        testBody = this.generateContentTest(test, pageAnalysis);
        break;
      default:
        testBody = this.generateDefaultTest(test);
    }

    return `  it('Test ${index}: ${test.name}', () => {
    ${testBody}
  })`;
  }

  /**
   * Generate load test
   * @param {Object} test - Test object
   * @param {Object} pageAnalysis - Page analysis
   * @returns {string} - Test body
   */
  generateLoadTest(test, pageAnalysis) {
    let assertions = '';

    if (pageAnalysis.title) {
      assertions += `    cy.title().should('not.be.empty')\n`;
    }

    if (pageAnalysis.hasHeader) {
      assertions += `    cy.get('header').should('be.visible')\n`;
    }

    if (pageAnalysis.hasNavigation) {
      assertions += `    cy.get('nav').should('be.visible')\n`;
    }

    if (pageAnalysis.hasFooter) {
      assertions += `    cy.get('footer').should('be.visible')\n`;
    }

    // Check for basic page load
    assertions += `    cy.url().should('include', '${new URL(pageAnalysis.url).hostname}')`;

    return assertions;
  }

  /**
   * Generate form test
   * @param {Object} test - Test object
   * @param {Object} pageAnalysis - Page analysis
   * @returns {string} - Test body
   */
  generateFormTest(test, pageAnalysis) {
    let testBody = '';

    // Check form visibility
    testBody += `    cy.get('form').should('be.visible')\n`;

    // Test form inputs
    const inputs = test.elements.filter(el => el.type === 'input');
    inputs.slice(0, 3).forEach((input, i) => {
      const selector = this.sanitizeSelector(input.selector);
      testBody += `    cy.get('${selector}').should('be.visible').type('test input ${i + 1}')\n`;
    });

    // Test submit button
    const buttons = test.elements.filter(el => el.type === 'button');
    if (buttons.length > 0) {
      const selector = this.sanitizeSelector(buttons[0].selector);
      testBody += `    cy.get('${selector}').should('be.visible')`;
    } else {
      testBody += `    cy.get('input[type="submit"], button[type="submit"]').first().should('be.visible')`;
    }

    return testBody;
  }

  /**
   * Generate navigation test
   * @param {Object} test - Test object
   * @param {Object} pageAnalysis - Page analysis
   * @returns {string} - Test body
   */
  generateNavigationTest(test, pageAnalysis) {
    let testBody = '';

    // Test navigation elements
    const navElements = test.elements.slice(0, 5);
    navElements.forEach(element => {
      const selector = this.sanitizeSelector(element.selector);
      if (element.type === 'link') {
        testBody += `    cy.get('${selector}').should('be.visible').should('have.attr', 'href')\n`;
      } else if (element.type === 'button') {
        testBody += `    cy.get('${selector}').should('be.visible')\n`;
      }
    });

    // Test clicking on first link (if available)
    const firstLink = navElements.find(el => el.type === 'link');
    if (firstLink) {
      const selector = this.sanitizeSelector(firstLink.selector);
      testBody += `    cy.get('${selector}').first().click()\n`;
      testBody += `    cy.go('back')`;
    }

    return testBody;
  }

  /**
   * Generate ecommerce test
   * @param {Object} test - Test object
   * @param {Object} pageAnalysis - Page analysis
   * @returns {string} - Test body
   */
  generateEcommerceTest(test, pageAnalysis) {
    let testBody = '';

    // Look for product elements
    testBody += `    cy.get('.product, [class*="product"], [data-product]').should('have.length.greaterThan', 0)\n`;

    // Test product links
    const links = test.elements.filter(el => el.type === 'link').slice(0, 3);
    links.forEach(link => {
      const selector = this.sanitizeSelector(link.selector);
      testBody += `    cy.get('${selector}').should('be.visible')\n`;
    });

    return testBody;
  }

  /**
   * Generate content test
   * @param {Object} test - Test object
   * @param {Object} pageAnalysis - Page analysis
   * @returns {string} - Test body
   */
  generateContentTest(test, pageAnalysis) {
    let testBody = '';

    // Test headings
    if (pageAnalysis.headings > 0) {
      testBody += `    cy.get('h1, h2, h3').should('be.visible')\n`;
    }

    // Test images
    if (pageAnalysis.images > 0) {
      testBody += `    cy.get('img').should('be.visible')\n`;
    }

    // Test general content
    testBody += `    cy.get('body').should('not.be.empty')`;

    return testBody;
  }

  /**
   * Generate default test
   * @param {Object} test - Test object
   * @returns {string} - Test body
   */
  generateDefaultTest(test) {
    return `    // ${test.description}
    cy.get('body').should('be.visible')`;
  }

  /**
   * Sanitize CSS selector for Cypress
   * @param {string} selector - Raw selector
   * @returns {string} - Sanitized selector
   */
  sanitizeSelector(selector) {
    if (!selector) return 'body';

    // Remove any problematic characters and ensure it's a valid selector
    return selector
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/\n/g, '')
      .trim();
  }
}

module.exports = CypressTestCreatorAgent;