import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_KEY,
});

const openai = new OpenAIApi(configuration);

export default async function handler(req, res) {
  const { messages, preferences } = req.body;
  const { expectedReturn, riskTolerance } = preferences;

  const systemMessage = {
    role: 'system',
    content: `' Your name is "AIStockHelper" You are a highly specialized AI assistant with expertise in stock strategy. You can help users devise strategies based on historical market data, industry trends, and financial indicators. your job is to help the user create their own strategy which can be used to backtest in any stock. The user's expected return is ${expectedReturn} and risk tolerance is ${riskTolerance}.`,
  };

  messages.unshift(systemMessage);

  try {
    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: messages,
    });

    const aiMessage = response.data.choices[0].message.content;
    if (response.data.choices && response.data.choices.length > 0) {
      res.status(200).json({ result: aiMessage });
    } else {
      throw new Error('No response generated');
    }
  } catch (error) {
    console.error('Error generating response:', error);
    res.status(500).json({ error: error.message });
  }
}
