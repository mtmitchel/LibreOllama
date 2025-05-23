// Test the chat API endpoint directly
// Run with: node test-chat-api.js

async function testChatAPI() {
  const API_URL = 'http://localhost:9004/api/ollama/chat';
  
  console.log('🧪 Testing LibreOllama Chat API...\n');
  
  const testPayload = {
    message: 'Hello! Can you tell me a short joke?',
    userId: 'test-user-123',
    model: 'mistral-nemo:latest', // Change this to match your installed model
    systemPrompt: 'You are a helpful and friendly AI assistant.',
    temperature: 0.7
  };
  
  console.log('📤 Request payload:', JSON.stringify(testPayload, null, 2));
  console.log('\nSending request to:', API_URL);
  
  try {
    const startTime = Date.now();
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });
    
    const responseTime = Date.now() - startTime;
    
    console.log(`\n📥 Response Status: ${response.status} ${response.statusText}`);
    console.log(`⏱️  Response Time: ${responseTime}ms`);
    
    const contentType = response.headers.get('content-type');
    console.log(`📄 Content Type: ${contentType}`);
    
    if (response.ok) {
      const responseText = await response.text();
      console.log('\n✅ Success! AI Response:');
      console.log('─'.repeat(50));
      console.log(responseText);
      console.log('─'.repeat(50));
    } else {
      const errorText = await response.text();
      console.error('\n❌ Error Response:');
      console.error(errorText);
      
      // Try to parse as JSON for better error display
      try {
        const errorJson = JSON.parse(errorText);
        console.error('\nError details:', errorJson);
      } catch {
        // Not JSON, already displayed as text
      }
    }
  } catch (error) {
    console.error('\n❌ Request failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Connection refused. Make sure:');
      console.log('   1. The Next.js dev server is running: npm run dev');
      console.log('   2. It\'s running on port 9004');
      console.log('   3. Ollama is also running: ollama serve');
    }
  }
  
  // Test with streaming (if needed in future)
  console.log('\n\n📝 Note: The API currently uses non-streaming responses.');
  console.log('   To test with different models, modify the "model" field in testPayload.');
  console.log('   Available models can be checked with: ollama list');
}

// Run the test
testChatAPI();
