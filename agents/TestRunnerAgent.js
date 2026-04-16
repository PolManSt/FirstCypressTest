const BaseAgent = require('./BaseAgent');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const util = require('util');

const execAsync = util.promisify(exec);

/**
 * Agent 4: Test Runner
 * Lints test cases and runs Cypress tests
 */
class TestRunnerAgent extends BaseAgent {
  constructor(nextAgent = null) {
    super('Test Runner', nextAgent);
  }

  async execute(input) {
    const { testFilePath, testFileContent } = input;
    this.log('Running test linting and execution');

    try {
      // Lint the test file
      const lintResult = await this.lintTestFile(testFilePath);
      if (!lintResult.passed) {
        this.log(`Linting issues found: ${lintResult.errors.join(', ')}`);
        // Continue anyway, as linting issues might not prevent execution
      }

      // Run Cypress tests
      const testResults = await this.runCypressTests(testFilePath);

      this.log(`Test execution completed. Results: ${JSON.stringify(testResults.summary)}`);

      // Pass results to next agent
      return await this.passToNext({
        ...input,
        lintResult,
        testResults
      });

    } catch (error) {
      this.log(`Error running tests: ${error.message}`);
      throw error;
    }
  }

  /**
   * Lint the test file using ESLint (if available) or basic syntax check
   * @param {string} testFilePath - Path to test file
   * @returns {Promise<Object>} - Lint results
   */
  async lintTestFile(testFilePath) {
    try {
      // Try to run ESLint if available
      const eslintCmd = `npx eslint ${testFilePath} --format json`;
      const { stdout, stderr } = await execAsync(eslintCmd, { timeout: 10000 });

      if (stderr) {
        return {
          passed: false,
          errors: [stderr],
          tool: 'eslint'
        };
      }

      const results = JSON.parse(stdout || '[]');
      const errors = results.flatMap(result =>
        result.messages.map(msg => `${result.filePath}:${msg.line}:${msg.column} ${msg.message}`)
      );

      return {
        passed: errors.length === 0,
        errors,
        tool: 'eslint'
      };

    } catch (error) {
      // ESLint not available or failed, try basic Node.js syntax check
      try {
        const { stdout, stderr } = await execAsync(`node -c ${testFilePath}`, { timeout: 5000 });

        return {
          passed: true,
          errors: [],
          tool: 'node-syntax'
        };
      } catch (syntaxError) {
        return {
          passed: false,
          errors: [syntaxError.message],
          tool: 'node-syntax'
        };
      }
    }
  }

  /**
   * Run Cypress tests
   * @param {string} testFilePath - Path to test file
   * @returns {Promise<Object>} - Test results
   */
  async runCypressTests(testFilePath) {
    try {
      // First, check if Cypress is properly configured
      await this.ensureCypressConfig();

      // Run Cypress in headless mode
      const cypressCmd = `npx cypress run --spec "${testFilePath}" --headless --browser electron`;

      this.log('Starting Cypress test execution...');

      const { stdout, stderr } = await execAsync(cypressCmd, {
        timeout: 120000, // 2 minutes timeout
        cwd: process.cwd()
      });

      // Parse Cypress output
      const results = this.parseCypressOutput(stdout, stderr);

      return results;

    } catch (error) {
      this.log(`Cypress execution failed: ${error.message}`);

      // Return partial results
      return {
        success: false,
        summary: {
          total: 0,
          passed: 0,
          failed: 0,
          skipped: 0
        },
        tests: [],
        error: error.message,
        output: error.stdout || '',
        stderr: error.stderr || ''
      };
    }
  }

  /**
   * Ensure Cypress configuration exists
   * @returns {Promise<void>}
   */
  async ensureCypressConfig() {
    const configPath = path.join(process.cwd(), 'cypress.json');

    try {
      await fs.access(configPath);
    } catch (error) {
      // Create basic Cypress config
      const config = {
        "baseUrl": null,
        "viewportWidth": 1280,
        "viewportHeight": 720,
        "defaultCommandTimeout": 10000,
        "requestTimeout": 10000,
        "responseTimeout": 10000,
        "video": false,
        "screenshotOnRunFailure": true,
        "watchForFileChanges": false
      };

      await fs.writeFile(configPath, JSON.stringify(config, null, 2));
      this.log('Created basic Cypress configuration');
    }

    // Ensure plugins file exists
    const pluginsPath = path.join(process.cwd(), 'cypress', 'plugins', 'index.js');
    try {
      await fs.access(pluginsPath);
    } catch (error) {
      const pluginsDir = path.dirname(pluginsPath);
      await fs.mkdir(pluginsDir, { recursive: true });

      const pluginsContent = `module.exports = (on, config) => {
  // configure plugins here
}`;
      await fs.writeFile(pluginsPath, pluginsContent);
    }
  }

  /**
   * Parse Cypress output to extract test results
   * @param {string} stdout - Standard output
   * @param {string} stderr - Standard error
   * @returns {Object} - Parsed results
   */
  parseCypressOutput(stdout, stderr) {
    const results = {
      success: false,
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0
      },
      tests: [],
      output: stdout,
      stderr: stderr
    };

    try {
      // Look for test results in output
      const lines = stdout.split('\n');

      // Find summary line (usually contains "Tests: X passing, Y failing, Z skipped")
      const summaryLine = lines.find(line =>
        line.includes('passing') && line.includes('failing')
      );

      if (summaryLine) {
        const match = summaryLine.match(/(\d+)\s+passing.*?(\d+)\s+failing.*?(\d+)\s+skipped/);
        if (match) {
          results.summary.passed = parseInt(match[1]);
          results.summary.failed = parseInt(match[2]);
          results.summary.skipped = parseInt(match[3]);
          results.summary.total = results.summary.passed + results.summary.failed + results.summary.skipped;
        }
      }

      // Check if run was successful
      results.success = !stderr.includes('error') && !stdout.includes('✗');

      // Extract individual test results
      const testResults = [];
      let currentTest = null;

      for (const line of lines) {
        if (line.includes('✓') || line.includes('✗')) {
          if (currentTest) {
            testResults.push(currentTest);
          }

          currentTest = {
            name: line.replace(/^[✓✗]\s*/, '').trim(),
            passed: line.includes('✓'),
            failed: line.includes('✗')
          };
        }
      }

      if (currentTest) {
        testResults.push(currentTest);
      }

      results.tests = testResults;

    } catch (error) {
      this.log(`Error parsing Cypress output: ${error.message}`);
      results.parsingError = error.message;
    }

    return results;
  }
}

module.exports = TestRunnerAgent;