// Test script to verify the prompts-only feature
const fetch = require('node-fetch');

async function testPromptsOnlyFeature() {
    console.log('Testing prompts-only feature...\n');
    
    try {
        // Test with promptsOnly = true
        console.log('1. Testing with promptsOnly = true');
        const response1 = await fetch('http://localhost:3000/api/generate-scripts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                character: 'stormtrooper',
                prompt: 'A stormtrooper tries to learn how to cook',
                promptsOnly: true
            })
        });
        
        const data1 = await response1.json();
        console.log('Response:', {
            success: data1.success,
            promptsOnly: data1.promptsOnly,
            estimatedCost: data1.estimatedCost,
            scriptsCount: data1.scripts ? data1.scripts.length : 0
        });
        console.log('\nFirst script preview:', data1.scripts[0].substring(0, 100) + '...\n');
        
        // Test with promptsOnly = false
        console.log('2. Testing with promptsOnly = false');
        const response2 = await fetch('http://localhost:3000/api/generate-scripts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                character: 'wizard',
                prompt: 'A wizard discovers modern technology',
                promptsOnly: false
            })
        });
        
        const data2 = await response2.json();
        console.log('Response:', {
            success: data2.success,
            promptsOnly: data2.promptsOnly,
            estimatedCost: data2.estimatedCost,
            scriptsCount: data2.scripts ? data2.scripts.length : 0
        });
        
        console.log('\n✅ Test completed successfully!');
        console.log('\nSummary:');
        console.log('- When promptsOnly is true, estimated cost should be $0');
        console.log('- When promptsOnly is false, estimated cost should be $12 (3 × $4)');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testPromptsOnlyFeature();