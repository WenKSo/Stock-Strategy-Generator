export async function AIStrategy(messages, expectedReturn, riskTolerance) {
  try {
    const response = await fetch('/api/AIStrategyHandler', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        preferences: { expectedReturn, riskTolerance },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error generating response');
    }

    const responseData = await response.json();
    return responseData.result;
  } catch (error) {
    console.error('Error generating response:', error);
    throw error;
  }
}

export async function generateReport(chatHistory) {
  try {
    const response = await fetch('/api/GenerateReportHandler', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chatHistory }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error generating response');
    }

    const responseData = await response.json();
    return responseData.result;
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
}

export default AIStrategy;
