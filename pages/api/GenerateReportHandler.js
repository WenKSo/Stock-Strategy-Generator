import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_KEY,
});

const openai = new OpenAIApi(configuration);

export default async function handler(req, res) {
  const { chatHistory } = req.body;

  // Concatenate all the messages into a single string
  const chatContent = chatHistory
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join('\n');

  // Compose a prompt for summarization
  const prompt = `${chatContent}\n\nReply with only code, no need for extra explaination. use the chat history to create a python code for the strategy which import yahoo finance and 
    able to calculate the return based on the stocks and the time period given by the user. If the user didn't
    provide actual time period, use the default time period as 1 year. If the user didn't provide the stocks,
    use the default stocks as AAPL, GOOG, MSFT, AMZN, FB, TSLA, NVDA, PYPL, NFLX, and ADBE.`;

  try {
    const response = await openai.createCompletion({
      model: 'text-davinci-002',
      prompt: prompt,
      temperature: 0.2,
      max_tokens: 150,
    });

    if (response.data.choices && response.data.choices.length > 0) {
      res.status(200).json({ result: response.data.choices[0].text });
    } else {
      throw new Error('No response generated');
    }
  } catch (error) {
    console.error('Error generating response:', error);
    res.status(500).json({ error: error.message });
  }
}
