const BaseAgent = require('./BaseAgent');
const inquirer = require('inquirer');

/**
 * Agent 1: URL Collector
 * Asks user for web URL, validates it, and sends to next agent
 */
class UrlCollectorAgent extends BaseAgent {
  constructor(nextAgent = null) {
    super('URL Collector', nextAgent);
  }

  async execute(input = null) {
    this.log('Starting URL collection process');

    try {
      // Ask user for URL
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'url',
          message: 'Please enter a web URL to test:',
          validate: (input) => {
            if (!input.trim()) {
              return 'URL cannot be empty';
            }

            // Basic URL validation
            try {
              const url = new URL(input);
              if (!['http:', 'https:'].includes(url.protocol)) {
                return 'URL must use http or https protocol';
              }
              return true;
            } catch (error) {
              return 'Please enter a valid URL (e.g., https://example.com)';
            }
          }
        }
      ]);

      const url = answers.url.trim();
      this.log(`Collected URL: ${url}`);

      // Validate URL is accessible (basic check)
      const isValid = await this.validateUrl(url);
      if (!isValid) {
        throw new Error('URL is not accessible or returns an error');
      }

      this.log('URL validation successful');

      // Pass URL to next agent
      return await this.passToNext({ url });

    } catch (error) {
      this.log(`Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Basic URL validation by making a HEAD request
   * @param {string} url - URL to validate
   * @returns {Promise<boolean>} - Whether URL is accessible
   */
  async validateUrl(url) {
    try {
      const axios = require('axios');
      const response = await axios.head(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Cypress Testing Agent)'
        }
      });
      return response.status >= 200 && response.status < 400;
    } catch (error) {
      this.log(`URL validation failed: ${error.message}`);
      return false;
    }
  }
}

module.exports = UrlCollectorAgent;