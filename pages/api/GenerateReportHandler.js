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
  const prompt = `Collect the discription of the strategy from user in chat chat History to create a Python code for the strategy which start by import yfinance as yf and able to calculate the total return based on the given stock and the time period. The strategy function name is always "userOwnStrategy". and this function will take 3 string variables: stockName, startDate, endDate. Make sure the return code is executable by adding 'result = userOwnStrategy(stockName, startDate, endDate) print(result)' at the end, no need for user to enter any input.Please reply me with only the python code, no need for any extra text or syntax at the beginning Here is the chat history:"${chatContent}"`;

  try {
    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: prompt,
      temperature: 0.1,
      max_tokens: 500,
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
