/**
 * PDF Export System - Test Script
 * 
 * Run this to verify the PDF export system works correctly.
 * Tests both local and utility functions.
 */

import { renderPDF, renderPDFFromHTML, getBrowser } from "../src/lib/pdf";

async function testBrowserLaunch() {
  console.log("\n🧪 Test 1: Browser Launch");
  console.log("=".repeat(50));
  
  try {
    const browser = await getBrowser();
    console.log("✅ Browser launched successfully");
    
    const version = await browser.version();
    console.log("📦 Browser version:", version);
    
    await browser.close();
    console.log("✅ Browser closed successfully");
    
    return true;
  } catch (error: any) {
    console.error("❌ Browser launch failed:", error.message);
    return false;
  }
}

async function testSimpleHTML() {
  console.log("\n🧪 Test 2: Simple HTML Rendering");
  console.log("=".repeat(50));
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
          }
          h1 {
            color: #333;
          }
        </style>
      </head>
      <body>
        <h1>Test PDF Export</h1>
        <p>This is a test document generated at ${new Date().toISOString()}</p>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
          <li>Item 3</li>
        </ul>
      </body>
    </html>
  `;
  
  try {
    const result = await renderPDFFromHTML(html, {
      format: "A4",
      printBackground: true,
    });
    
    console.log("✅ PDF generated successfully");
    console.log("📊 Metadata:", {
      size: `${(result.pdf.length / 1024).toFixed(2)} KB`,
      duration: `${result.metadata.duration}ms`,
      retries: result.metadata.retries,
      pageTitle: result.metadata.pageTitle,
    });
    
    // Save to file for inspection
    const fs = await import("fs");
    fs.writeFileSync("test-output.pdf", result.pdf);
    console.log("💾 Saved to: test-output.pdf");
    
    return true;
  } catch (error: any) {
    console.error("❌ HTML rendering failed:", error.message);
    return false;
  }
}

async function testComplexHTML() {
  console.log("\n🧪 Test 3: Complex HTML with Styling");
  console.log("=".repeat(50));
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
          }
          
          .container {
            max-width: 800px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          }
          
          h1 {
            font-size: 48px;
            margin-bottom: 20px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
          }
          
          .info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 30px;
          }
          
          .card {
            background: rgba(255, 255, 255, 0.2);
            padding: 20px;
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.3);
          }
          
          .card h3 {
            margin-bottom: 10px;
            font-size: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Complex Test Document</h1>
          <p>Testing advanced CSS features and layout</p>
          
          <div class="info">
            <div class="card">
              <h3>Test Info</h3>
              <p>Generated: ${new Date().toLocaleString()}</p>
            </div>
            
            <div class="card">
              <h3>Features</h3>
              <ul>
                <li>Gradients</li>
                <li>Backdrop blur</li>
                <li>Grid layout</li>
                <li>Shadows</li>
              </ul>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
  
  try {
    const result = await renderPDFFromHTML(html, {
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });
    
    console.log("✅ Complex PDF generated successfully");
    console.log("📊 Metadata:", {
      size: `${(result.pdf.length / 1024).toFixed(2)} KB`,
      duration: `${result.metadata.duration}ms`,
      retries: result.metadata.retries,
    });
    
    const fs = await import("fs");
    fs.writeFileSync("test-complex-output.pdf", result.pdf);
    console.log("💾 Saved to: test-complex-output.pdf");
    
    return true;
  } catch (error: any) {
    console.error("❌ Complex rendering failed:", error.message);
    return false;
  }
}

async function testRetryLogic() {
  console.log("\n🧪 Test 4: Retry Logic");
  console.log("=".repeat(50));
  
  try {
    // Test with a URL that might fail (to trigger retry)
    const result = await renderPDF({
      url: "http://localhost:9999/non-existent", // Intentional failure
      enableRetry: true,
      maxRetries: 2,
      timeout: 5000,
    });
    
    console.log("❓ Unexpected success (should have failed)");
    return false;
    
  } catch (error: any) {
    console.log("✅ Retry logic working (expected failure)");
    console.log("📝 Error message:", error.message);
    
    // Check if error message mentions retries
    if (error.message.includes("attempts")) {
      console.log("✅ Retry count in error message");
      return true;
    } else {
      console.log("⚠️ Retry count not in error message");
      return false;
    }
  }
}

async function testMemoryUsage() {
  console.log("\n🧪 Test 5: Memory Usage");
  console.log("=".repeat(50));
  
  const beforeMem = process.memoryUsage();
  console.log("📊 Before:", {
    heapUsed: `${(beforeMem.heapUsed / 1024 / 1024).toFixed(2)} MB`,
    heapTotal: `${(beforeMem.heapTotal / 1024 / 1024).toFixed(2)} MB`,
  });
  
  try {
    const html = "<html><body><h1>Memory Test</h1></body></html>";
    
    // Run multiple times
    for (let i = 0; i < 3; i++) {
      await renderPDFFromHTML(html);
      console.log(`  Iteration ${i + 1} complete`);
    }
    
    const afterMem = process.memoryUsage();
    console.log("📊 After:", {
      heapUsed: `${(afterMem.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(afterMem.heapTotal / 1024 / 1024).toFixed(2)} MB`,
    });
    
    const memoryIncrease = (afterMem.heapUsed - beforeMem.heapUsed) / 1024 / 1024;
    console.log(`📈 Memory increase: ${memoryIncrease.toFixed(2)} MB`);
    
    if (memoryIncrease > 500) {
      console.log("⚠️ High memory usage detected");
      return false;
    }
    
    console.log("✅ Memory usage acceptable");
    return true;
    
  } catch (error: any) {
    console.error("❌ Memory test failed:", error.message);
    return false;
  }
}

// =============================================================================
// Main Test Runner
// =============================================================================

async function runAllTests() {
  console.log("\n" + "=".repeat(50));
  console.log("🚀 PDF Export System - Test Suite");
  console.log("=".repeat(50));
  
  const results = {
    browserLaunch: false,
    simpleHTML: false,
    complexHTML: false,
    retryLogic: false,
    memoryUsage: false,
  };
  
  try {
    results.browserLaunch = await testBrowserLaunch();
    results.simpleHTML = await testSimpleHTML();
    results.complexHTML = await testComplexHTML();
    results.retryLogic = await testRetryLogic();
    results.memoryUsage = await testMemoryUsage();
    
  } catch (error: any) {
    console.error("\n❌ Test suite crashed:", error.message);
  }
  
  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 Test Summary");
  console.log("=".repeat(50));
  
  const entries = Object.entries(results);
  const passed = entries.filter(([_, result]) => result).length;
  const total = entries.length;
  
  entries.forEach(([name, result]) => {
    const icon = result ? "✅" : "❌";
    console.log(`${icon} ${name}`);
  });
  
  console.log("\n" + "=".repeat(50));
  console.log(`Result: ${passed}/${total} tests passed`);
  console.log("=".repeat(50));
  
  if (passed === total) {
    console.log("\n🎉 All tests passed! System is ready.");
    process.exit(0);
  } else {
    console.log("\n⚠️ Some tests failed. Please review.");
    process.exit(1);
  }
}

// Run tests
runAllTests().catch((error) => {
  console.error("\n💥 Fatal error:", error);
  process.exit(1);
});
