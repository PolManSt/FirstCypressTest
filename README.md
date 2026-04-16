# Agentic Testing System

An intelligent, multi-agent system for automated web application testing using Cypress. This system employs 5 specialized agents that work together to analyze, test, and report on web applications.

## 🤖 Agent Architecture

The system consists of 5 agents that work in sequence:

### 1. **URL Collector Agent**
- Prompts user for a web URL
- Validates URL format and accessibility
- Ensures the URL is reachable before proceeding

### 2. **Web Analyzer Agent**
- Analyzes the web page using Puppeteer
- Extracts page structure, forms, links, and interactive elements
- Generates 3 targeted smoke tests based on page type

### 3. **Cypress Test Creator Agent**
- Converts smoke tests into executable Cypress test cases
- Creates comprehensive test scenarios with proper selectors
- Generates test files ready for execution

### 4. **Test Runner Agent**
- Lints generated test code for syntax and best practices
- Executes Cypress tests in headless mode
- Captures test results and execution details

### 5. **Report Generator Agent**
- Analyzes test results and identifies failures
- Suggests root causes for failed tests
- Generates detailed reports with recommendations

## 🚀 Quick Start

### Prerequisites
- Node.js 14+
- npm or yarn

### Installation
```bash
npm install
```

### Run the System
```bash
npm start
```

Or use the CLI command:
```bash
npx agentic-test
```

## 📋 How It Works

1. **Start the system** - Run `npm start`
2. **Enter a URL** - Provide a web URL to test (e.g., `https://example.com`)
3. **Wait for analysis** - The system analyzes the page and generates tests
4. **Review results** - Check the generated reports in the `reports/` directory

## 📁 Project Structure

```
├── agents/                    # Agent implementations
│   ├── BaseAgent.js          # Base agent class
│   ├── UrlCollectorAgent.js  # Agent 1
│   ├── WebAnalyzerAgent.js   # Agent 2
│   ├── CypressTestCreatorAgent.js # Agent 3
│   ├── TestRunnerAgent.js    # Agent 4
│   └── ReportGeneratorAgent.js # Agent 5
├── cypress/                  # Cypress test files
│   ├── integration/          # Generated test specs
│   ├── fixtures/            # Test data
│   └── support/             # Cypress support files
├── reports/                  # Generated test reports
├── utils/                    # Utility functions
├── index.js                  # Main orchestrator
├── cypress.json             # Cypress configuration
└── package.json             # Dependencies and scripts
```

## 📊 Report Output

The system generates two types of reports:

### JSON Report (`test-report-[timestamp].json`)
- Complete test execution data
- Page analysis results
- Detailed test outcomes
- Failure analysis and suggestions

### Markdown Summary (`test-report-[timestamp].md`)
- Human-readable test summary
- Pass/fail statistics
- Key recommendations
- Actionable insights

## 🛠️ Development

### Adding New Agents
1. Extend the `BaseAgent` class
2. Implement the `execute(input)` method
3. Add the agent to the chain in `index.js`

### Customizing Tests
Modify the test generation logic in `CypressTestCreatorAgent.js` to:
- Add new test types
- Customize selectors
- Include additional assertions

### Extending Analysis
Enhance `WebAnalyzerAgent.js` to:
- Analyze additional page elements
- Detect specific frameworks or libraries
- Extract more detailed page metadata

## 🔧 Configuration

### Cypress Configuration
Edit `cypress.json` to customize:
- Browser settings
- Timeout values
- Screenshot behavior
- Viewport dimensions

### Agent Configuration
Modify agent constructors to:
- Adjust timeouts
- Configure analysis depth
- Set custom validation rules

## 📈 Supported Page Types

The system automatically detects and adapts to different page types:

- **Landing Pages** - Basic load and content tests
- **Form-heavy Pages** - Input validation and submission tests
- **E-commerce Sites** - Product display and navigation tests
- **Content Sites** - Article loading and media tests
- **Standard Websites** - Comprehensive navigation and structure tests

## 🐛 Troubleshooting

### Common Issues

**URL Not Accessible**
- Check network connectivity
- Verify URL is publicly accessible
- Ensure no authentication requirements

**Tests Failing**
- Review generated test selectors
- Check page structure changes
- Verify Cypress configuration

**Analysis Errors**
- Page may have anti-bot protection
- JavaScript-heavy sites may need longer load times
- Complex SPAs may require additional configuration

### Debug Mode
Set environment variable for verbose logging:
```bash
DEBUG=agentic:* npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## 📄 License

ISC License - see package.json for details

## 🔄 Future Enhancements

- **Agent Communication**: Enhanced inter-agent messaging
- **Test Expansion**: More sophisticated test generation
- **Framework Detection**: Automatic framework-specific tests
- **Performance Testing**: Load and performance analysis
- **Accessibility Testing**: WCAG compliance checks
- **Visual Regression**: Screenshot comparison testing

---

*Built with ❤️ using Cypress, Puppeteer, and Node.js*
