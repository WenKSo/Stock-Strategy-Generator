import React, { useState, useEffect, useRef } from 'react';
import AIStrategy from './AIStrategy.js';
import styles from '../styles/Chat.module.css';
import ReactTypingEffect from 'react-typing-effect';
import { generateReport } from './AIStrategy.js';
import axios from 'axios';

const Index = () => {
  const [userInput, setUserInput] = useState('');
  const [expectedReturn, setExpectedReturn] = useState('');
  const [riskTolerance, setRiskTolerance] = useState('high');
  const [isQuestionsAnswered, setIsQuestionsAnswered] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(''); // add this line

  // Ref for autoscroll
  const messagesEndRef = useRef(null);

  const handleUserInputChange = (event) => {
    setUserInput(event.target.value);
  };

  const handleExpectedReturnChange = (event) => {
    setExpectedReturn(event.target.value);
  };

  const handleRiskToleranceChange = (event) => {
    setRiskTolerance(event.target.value);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 向服务器发送数据
  const sendDataToAWS = async (data) => {
    console.log('向服务器发送数据');
    try {
      const response = await axios({
        method: 'post',
        url: 'http://18.222.180.135:5000/api',
        headers: { 'Content-Type': 'application/json' },
        data: data,
      });
      console.log(response.data); // 处理响应数据
      // if (response.data.co == '200'){

      // }
      // else {

      // }
    } catch (error) {
      console.error(error.response.data.error_details); // 输出错误详细信息
      console.error(error.response.data.message); // 输出错误消息
    }
  };

  const generateStrategyReport = async () => {
    setLoading(true);
    try {
      const reportContent = await generateReport(chatHistory);
      // send to server
      sendDataToAWS(reportContent);
      setReport(reportContent);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(scrollToBottom, [chatHistory]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!isQuestionsAnswered) {
      setIsQuestionsAnswered(true);
      setChatHistory([
        {
          role: 'assistant',
          content:
            "Hi, I'm your stock strategy assistant. How can I assist you today?",
        },
      ]);
      return;
    }

    const newMessage = { role: 'user', content: userInput };
    setChatHistory((prevChatHistory) => [...prevChatHistory, newMessage]);
    setUserInput('');
    setLoading(true);
    try {
      const AIResponse = await AIStrategy(
        chatHistory.concat(newMessage),
        expectedReturn,
        riskTolerance
      );
      const AIResponseMessage = { role: 'assistant', content: AIResponse };
      setChatHistory((prevChatHistory) => [
        ...prevChatHistory,
        AIResponseMessage,
      ]);
    } catch (error) {
      console.error('Error generating response:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!isQuestionsAnswered) {
    return (
      <div className={styles.conversationWrapper}>
        <h1>Set Your Preferences</h1>
        <form onSubmit={handleSubmit} className={styles.questionsWrapper}>
          <div className={styles.questionItem}>
            <label className={styles.questionLabel}>Expected Return:</label>
            <input
              type="text"
              id="expectedReturn"
              value={expectedReturn}
              onChange={handleExpectedReturnChange}
              required
              className={styles.questionField}
            />
          </div>
          <div className={styles.questionItem}>
            <label className={styles.questionLabel}>Risk Tolerance:</label>
            <select
              value={riskTolerance}
              onChange={handleRiskToleranceChange}
              className={styles.questionField}
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <button type="submit" className={styles.preferenceButton}>
            Set Preferences
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className={styles.conversationWrapper}>
      <h1>Ask AI to Generate Stock Strategy</h1>
      <div className={styles.messages}>
        {chatHistory.map((message, index) => (
          <div
            key={index}
            className={`${styles.message} ${
              message.role === 'assistant'
                ? styles.messageAI
                : styles.messageUser
            }`}
          >
            <strong>
              {message.role.charAt(0).toUpperCase() + message.role.slice(1)}:
            </strong>{' '}
            {message.role === 'assistant' ? (
              <ReactTypingEffect
                text={message.content}
                speed={10}
                eraseSpeed={0}
                staticText
              />
            ) : (
              message.content
            )}
          </div>
        ))}
        {loading && <p>Loading...</p>}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className={styles.inputWrapper}>
        <input
          type="text"
          id="productName"
          value={userInput}
          onChange={handleUserInputChange}
          required
          className={styles.inputField}
        />
        <button type="submit">Send</button>
      </form>
      <button
        onClick={generateStrategyReport}
        className={styles.generateButton}
      >
        Generate Strategy
      </button>
      <button
  onClick={() => sendDataToAWS({ code: "print('Hello World')fsdfsdfsfsdf" })}

  className={styles.generateButton}
>
  SEND TO BACKEND
</button>

      {report && <div className={styles.report}>{report}</div>}
    </div>
  );
};

export default Index;
