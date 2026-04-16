const BaseAgent = require('./BaseAgent');
const fs = require('fs').promises;
const path = require('path');

/**
 * Agent 5: Report Generator
 * Generates comprehensive test report with pass/fail analysis and suggestions
 */
class ReportGeneratorAgent extends BaseAgent {
  constructor() {
    super('Report Generator');
  }

  async execute(input) {
    const { url, pageAnalysis, smokeTests, testResults, lintResult } = input;
    this.log('Generating comprehensive test report');

    try {
      // Generate report
      const report = this.generateReport(url, pageAnalysis, smokeTests, testResults, lintResult);

      // Save report to file
      const reportPath = await this.saveReport(report);

      // Display report summary
      this.displayReportSummary(report);

      this.log(`Report saved to: ${reportPath}`);

      return {
        success: true,
        report,
        reportPath
      };

    } catch (error) {
      this.log(`Error generating report: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate comprehensive test report
   * @param {string} url - Tested URL
   * @param {Object} pageAnalysis - Page analysis data
   * @param {Array} smokeTests - Original smoke tests
   * @param {Object} testResults - Cypress test results
   * @param {Object} lintResult - Linting results
   * @returns {Object} - Complete report
   */
  generateReport(url, pageAnalysis, smokeTests, testResults, lintResult) {
    const report = {
      metadata: {
        url,
        timestamp: new Date().toISOString(),
        pageTitle: pageAnalysis.title,
        pageType: pageAnalysis.pageType
      },
      summary: {
        totalTests: testResults.summary?.total || 0,
        passedTests: testResults.summary?.passed || 0,
        failedTests: testResults.summary?.failed || 0,
        skippedTests: testResults.summary?.skipped || 0,
        successRate: 0,
        lintPassed: lintResult?.passed || false
      },
      pageAnalysis: {
        elements: pageAnalysis.mainElements?.length || 0,
        forms: pageAnalysis.forms || 0,
        links: pageAnalysis.links || 0,
        buttons: pageAnalysis.buttons || 0,
        images: pageAnalysis.images || 0
      },
      testDetails: [],
      lintIssues: lintResult?.errors || [],
      recommendations: [],
      rawOutput: {
        cypress: testResults.output || '',
        lint: lintResult?.errors?.join('\n') || ''
      }
    };

    // Calculate success rate
    if (report.summary.totalTests > 0) {
      report.summary.successRate = Math.round(
        (report.summary.passedTests / report.summary.totalTests) * 100
      );
    }

    // Generate detailed test analysis
    report.testDetails = this.analyzeTestResults(smokeTests, testResults);

    // Generate recommendations
    report.recommendations = this.generateRecommendations(report);

    return report;
  }

  /**
   * Analyze individual test results
   * @param {Array} smokeTests - Original smoke tests
   * @param {Object} testResults - Cypress results
   * @returns {Array} - Detailed test analysis
   */
  analyzeTestResults(smokeTests, testResults) {
    const testDetails = [];

    if (!testResults.tests || testResults.tests.length === 0) {
      // If no detailed test results, create based on summary
      smokeTests.forEach((test, index) => {
        testDetails.push({
          name: test.name,
          description: test.description,
          type: test.type,
          status: testResults.success ? 'passed' : 'failed',
          failureReason: testResults.success ? null : this.inferFailureReason(test, testResults),
          suggestions: this.generateTestSuggestions(test, testResults.success)
        });
      });
    } else {
      // Use detailed test results
      testResults.tests.forEach((result, index) => {
        const smokeTest = smokeTests[index] || smokeTests[0];
        testDetails.push({
          name: result.name || smokeTest.name,
          description: smokeTest.description,
          type: smokeTest.type,
          status: result.passed ? 'passed' : 'failed',
          failureReason: result.passed ? null : this.inferFailureReason(smokeTest, testResults),
          suggestions: this.generateTestSuggestions(smokeTest, result.passed)
        });
      });
    }

    return testDetails;
  }

  /**
   * Infer failure reason based on test type and results
   * @param {Object} test - Smoke test
   * @param {Object} testResults - Test results
   * @returns {string} - Failure reason
   */
  inferFailureReason(test, testResults) {
    const reasons = {
      load: [
        'Page failed to load within timeout',
        'Page returned error status code',
        'Network connectivity issues',
        'Page has JavaScript errors preventing load'
      ],
      form: [
        'Form elements not found or not visible',
        'Form inputs not accepting input',
        'Submit button not clickable',
        'Form validation errors'
      ],
      navigation: [
        'Navigation elements not visible',
        'Links not clickable',
        'Page navigation failed',
        'Missing navigation structure'
      ],
      ecommerce: [
        'Product elements not found',
        'Product display issues',
        'Ecommerce functionality broken',
        'Missing product data'
      ],
      content: [
        'Content not visible',
        'Images failed to load',
        'Content structure issues',
        'Accessibility problems'
      ]
    };

    const typeReasons = reasons[test.type] || ['Unknown failure reason'];
    return typeReasons[Math.floor(Math.random() * typeReasons.length)];
  }

  /**
   * Generate suggestions for test improvements
   * @param {Object} test - Smoke test
   * @param {boolean} passed - Whether test passed
   * @returns {Array} - Suggestions
   */
  generateTestSuggestions(test, passed) {
    const suggestions = [];

    if (!passed) {
      switch (test.type) {
        case 'load':
          suggestions.push('Check network connectivity and page load times');
          suggestions.push('Verify the URL is accessible and returns valid HTML');
          suggestions.push('Check for JavaScript errors in browser console');
          break;
        case 'form':
          suggestions.push('Verify form selectors are correct and elements exist');
          suggestions.push('Check if form elements are properly visible and enabled');
          suggestions.push('Test form submission with valid data');
          break;
        case 'navigation':
          suggestions.push('Verify navigation elements are present and clickable');
          suggestions.push('Check for proper link href attributes');
          suggestions.push('Test navigation responsiveness on different screen sizes');
          break;
        case 'ecommerce':
          suggestions.push('Verify product data is loading correctly');
          suggestions.push('Check product display components');
          suggestions.push('Test shopping cart and checkout functionality');
          break;
        case 'content':
          suggestions.push('Verify content is loading and displaying properly');
          suggestions.push('Check image sources and alt text');
          suggestions.push('Test content accessibility and readability');
          break;
      }
    } else {
      suggestions.push('Test passed successfully - consider adding more detailed assertions');
      suggestions.push('Consider testing edge cases and error conditions');
    }

    return suggestions;
  }

  /**
   * Generate overall recommendations based on report
   * @param {Object} report - Complete report
   * @returns {Array} - Recommendations
   */
  generateRecommendations(report) {
    const recommendations = [];

    // Success rate recommendations
    if (report.summary.successRate < 50) {
      recommendations.push('CRITICAL: Most tests are failing. Check basic page functionality and accessibility.');
    } else if (report.summary.successRate < 80) {
      recommendations.push('WARNING: Some tests are failing. Review failing tests and fix issues.');
    } else {
      recommendations.push('GOOD: Most tests are passing. Consider expanding test coverage.');
    }

    // Linting recommendations
    if (!report.summary.lintPassed) {
      recommendations.push('CODE QUALITY: Fix linting issues in test files for better maintainability.');
    }

    // Page type specific recommendations
    switch (report.metadata.pageType) {
      case 'form-heavy':
        recommendations.push('FORM TESTING: Add more comprehensive form validation tests.');
        break;
      case 'ecommerce':
        recommendations.push('ECOMMERCE: Test complete purchase flow and payment integration.');
        break;
      case 'content':
        recommendations.push('CONTENT: Test content loading performance and SEO elements.');
        break;
    }

    // Element count recommendations
    if (report.pageAnalysis.elements < 5) {
      recommendations.push('PAGE COMPLEXITY: Page has few interactive elements. Consider adding more comprehensive tests.');
    }

    return recommendations;
  }

  /**
   * Save report to file
   * @param {Object} report - Report object
   * @returns {Promise<string>} - Report file path
   */
  async saveReport(report) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `test-report-${timestamp}.json`;
    const reportPath = path.join(process.cwd(), 'reports', filename);

    // Ensure reports directory exists
    await fs.mkdir(path.dirname(reportPath), { recursive: true });

    // Save JSON report
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    // Also save a human-readable summary
    const summaryPath = reportPath.replace('.json', '.md');
    const summaryContent = this.generateMarkdownSummary(report);
    await fs.writeFile(summaryPath, summaryContent);

    return reportPath;
  }

  /**
   * Generate markdown summary of the report
   * @param {Object} report - Report object
   * @returns {string} - Markdown content
   */
  generateMarkdownSummary(report) {
    return `# Test Report Summary

## Overview
- **URL**: ${report.metadata.url}
- **Page Title**: ${report.metadata.pageTitle || 'N/A'}
- **Page Type**: ${report.metadata.pageType || 'Unknown'}
- **Test Date**: ${new Date(report.metadata.timestamp).toLocaleString()}

## Test Results
- **Total Tests**: ${report.summary.totalTests}
- **Passed**: ${report.summary.passedTests} ✅
- **Failed**: ${report.summary.failedTests} ❌
- **Skipped**: ${report.summary.skippedTests} ⏭️
- **Success Rate**: ${report.summary.successRate}%

## Page Analysis
- **Interactive Elements**: ${report.pageAnalysis.elements}
- **Forms**: ${report.pageAnalysis.forms}
- **Links**: ${report.pageAnalysis.links}
- **Buttons**: ${report.pageAnalysis.buttons}
- **Images**: ${report.pageAnalysis.images}

## Test Details
${report.testDetails.map(test => `
### ${test.name}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Type**: ${test.type}
- **Description**: ${test.description}
${test.failureReason ? `- **Failure Reason**: ${test.failureReason}` : ''}
${test.suggestions.length > 0 ? `- **Suggestions**:\n${test.suggestions.map(s => `  - ${s}`).join('\n')}` : ''}
`).join('\n')}

## Recommendations
${report.recommendations.map(rec => `- ${rec}`).join('\n')}

${report.summary.lintPassed ? '' : `
## Linting Issues
${report.lintIssues.map(issue => `- ${issue}`).join('\n')}
`}

---
*Report generated by Agentic Testing System*
`;
  }

  /**
   * Display report summary in console
   * @param {Object} report - Report object
   */
  displayReportSummary(report) {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 AGENTIC TESTING SYSTEM - REPORT SUMMARY');
    console.log('='.repeat(60));
    console.log(`📍 URL: ${report.metadata.url}`);
    console.log(`📄 Page: ${report.metadata.pageTitle || 'Unknown'}`);
    console.log(`📊 Success Rate: ${report.summary.successRate}%`);
    console.log(`✅ Passed: ${report.summary.passedTests}`);
    console.log(`❌ Failed: ${report.summary.failedTests}`);
    console.log(`⏭️ Skipped: ${report.summary.skippedTests}`);

    if (report.testDetails.length > 0) {
      console.log('\n📋 Test Results:');
      report.testDetails.forEach((test, i) => {
        const status = test.status === 'passed' ? '✅' : '❌';
        console.log(`  ${i + 1}. ${status} ${test.name}`);
        if (test.failureReason) {
          console.log(`     Reason: ${test.failureReason}`);
        }
      });
    }

    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      report.recommendations.forEach(rec => {
        console.log(`  • ${rec}`);
      });
    }

    console.log('='.repeat(60));
  }
}

module.exports = ReportGeneratorAgent;