const BaseAgent = require('./BaseAgent');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

/**
 * Agent 2: Web Analyzer
 * Analyzes web page/app and creates 3 smoke tests
 */
class WebAnalyzerAgent extends BaseAgent {
  constructor(nextAgent = null) {
    super('Web Analyzer', nextAgent);
  }

  async execute(input) {
    const { url } = input;
    this.log(`Analyzing web page: ${url}`);

    try {
      // Analyze the web page
      const pageAnalysis = await this.analyzePage(url);

      // Generate smoke tests based on analysis
      const smokeTests = this.generateSmokeTests(pageAnalysis);

      this.log(`Generated ${smokeTests.length} smoke tests`);

      // Pass smoke tests to next agent
      return await this.passToNext({
        url,
        pageAnalysis,
        smokeTests
      });

    } catch (error) {
      this.log(`Error analyzing page: ${error.message}`);
      throw error;
    }
  }

  /**
   * Analyze the web page using Puppeteer
   * @param {string} url - URL to analyze
   * @returns {Promise<Object>} - Page analysis data
   */
  async analyzePage(url) {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (compatible; Cypress Testing Agent)');

      // Navigate to page with timeout
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Wait a bit for dynamic content
      await page.waitForTimeout(2000);

      // Get page content
      const content = await page.content();
      const $ = cheerio.load(content);

      // Extract page information
      const title = await page.title();
      const pageInfo = {
        title,
        url,
        forms: $('form').length,
        links: $('a').length,
        buttons: $('button').length,
        inputs: $('input').length,
        images: $('img').length,
        headings: $('h1, h2, h3, h4, h5, h6').length,
        hasNavigation: $('nav').length > 0,
        hasFooter: $('footer').length > 0,
        hasHeader: $('header').length > 0,
        pageType: this.determinePageType($),
        mainElements: this.extractMainElements($)
      };

      // Take screenshot for reference
      await page.screenshot({ path: 'page-screenshot.png', fullPage: true });

      return pageInfo;

    } catch (error) {
      throw new Error(`Failed to analyze page: ${error.message}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Determine the type of page (landing, form, content, etc.)
   * @param {CheerioStatic} $ - Cheerio instance
   * @returns {string} - Page type
   */
  determinePageType($) {
    const forms = $('form').length;
    const articles = $('article').length;
    const products = $('.product, [data-product]').length;

    if (forms > 0) return 'form-heavy';
    if (products > 0) return 'ecommerce';
    if (articles > 0) return 'content';
    if ($('nav').length > 0 && $('footer').length > 0) return 'standard-website';
    return 'landing-page';
  }

  /**
   * Extract main interactive elements
   * @param {CheerioStatic} $ - Cheerio instance
   * @returns {Array} - Main elements
   */
  extractMainElements($) {
    const elements = [];

    // Extract buttons
    $('button, input[type="submit"], .btn').each((i, el) => {
      const text = $(el).text().trim() || $(el).attr('value') || $(el).attr('aria-label');
      if (text) {
        elements.push({
          type: 'button',
          text: text.substring(0, 50),
          selector: this.generateSelector(el, $)
        });
      }
    });

    // Extract links (limit to first 10)
    $('a').slice(0, 10).each((i, el) => {
      const text = $(el).text().trim();
      const href = $(el).attr('href');
      if (text && href && !href.startsWith('#') && !href.startsWith('javascript:')) {
        elements.push({
          type: 'link',
          text: text.substring(0, 50),
          href,
          selector: this.generateSelector(el, $)
        });
      }
    });

    // Extract form inputs
    $('input[type="text"], input[type="email"], input[type="password"], textarea').each((i, el) => {
      const placeholder = $(el).attr('placeholder') || '';
      const name = $(el).attr('name') || $(el).attr('id') || `input-${i}`;
      elements.push({
        type: 'input',
        name,
        placeholder: placeholder.substring(0, 50),
        selector: this.generateSelector(el, $)
      });
    });

    return elements.slice(0, 20); // Limit to 20 elements
  }

  /**
   * Generate a CSS selector for an element
   * @param {Element} el - DOM element
   * @param {CheerioStatic} $ - Cheerio instance
   * @returns {string} - CSS selector
   */
  generateSelector(el, $) {
    const $el = $(el);
    const id = $el.attr('id');
    if (id) return `#${id}`;

    const classes = $el.attr('class');
    if (classes) {
      const classSelector = classes.split(' ').filter(c => c.trim())[0];
      return `${el.tagName.toLowerCase()}.${classSelector}`;
    }

    // Generate a more specific selector
    let selector = el.tagName.toLowerCase();
    if ($el.attr('name')) selector += `[name="${$el.attr('name')}"]`;
    if ($el.attr('type')) selector += `[type="${$el.attr('type')}"]`;

    return selector;
  }

  /**
   * Generate 3 smoke tests based on page analysis
   * @param {Object} pageAnalysis - Page analysis data
   * @returns {Array} - Smoke tests
   */
  generateSmokeTests(pageAnalysis) {
    const tests = [];

    // Test 1: Basic page load
    tests.push({
      name: 'Page Load Test',
      description: 'Verify that the page loads successfully',
      type: 'load',
      assertions: [
        'Page should load without errors',
        'Page title should be present',
        'Basic page structure should be present'
      ]
    });

    // Test 2: Based on page type
    if (pageAnalysis.pageType === 'form-heavy') {
      tests.push({
        name: 'Form Interaction Test',
        description: 'Test basic form interactions',
        type: 'form',
        elements: pageAnalysis.mainElements.filter(el => el.type === 'input' || el.type === 'button'),
        assertions: [
          'Form elements should be visible',
          'Form should accept input',
          'Submit button should be clickable'
        ]
      });
    } else if (pageAnalysis.pageType === 'ecommerce') {
      tests.push({
        name: 'Product Display Test',
        description: 'Test product display and navigation',
        type: 'ecommerce',
        elements: pageAnalysis.mainElements.filter(el => el.type === 'link'),
        assertions: [
          'Products should be displayed',
          'Product links should be clickable',
          'Navigation should work'
        ]
      });
    } else {
      tests.push({
        name: 'Navigation Test',
        description: 'Test basic navigation elements',
        type: 'navigation',
        elements: pageAnalysis.mainElements.filter(el => el.type === 'link' || el.type === 'button').slice(0, 5),
        assertions: [
          'Navigation elements should be visible',
          'Links should be clickable',
          'Page should respond to interactions'
        ]
      });
    }

    // Test 3: Content visibility test
    tests.push({
      name: 'Content Visibility Test',
      description: 'Verify that main content is visible',
      type: 'content',
      assertions: [
        'Main headings should be visible',
        'Images should load (if present)',
        'Content should be readable'
      ]
    });

    return tests;
  }
}

module.exports = WebAnalyzerAgent;