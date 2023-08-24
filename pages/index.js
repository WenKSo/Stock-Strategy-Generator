import React, { useState, useEffect, useRef } from 'react';
import AIStrategy from './AIStrategy.js';
import styles from '../styles/Chat.module.css';
import { generateReport } from './AIStrategy.js';
import axios from 'axios';

const Index = () => {
  const [userInput, setUserInput] = useState('');
  const [expectedReturn, setExpectedReturn] = useState('');
  const [riskTolerance, setRiskTolerance] = useState('high');
  const [isQuestionsAnswered, setIsQuestionsAnswered] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [stockName, setStockName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [showResultForm, setShowResultForm] = useState(false);
  const [result, setResult] = useState('');
  const [stage, setStage] = useState(1);  // Add this line

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
  
  const handleStockNameChange = (event) => {
    setStockName(event.target.value);
  };

  const handleStartTimeChange = (event) => {
    setStartTime(event.target.value);
  };

  const handleEndTimeChange = (event) => {
    setEndTime(event.target.value);
  };

  const handleStageBack = () => {
  setStage(prevStage => {
    if(prevStage === 1) setRetryCount(0);
    setReport('');
    return prevStage - 1;
  });
};


  const showReturnResult = async () => {
    const data = {
        code: report,  // replace this with your actual code
        stockName: stockName,
        startDate: startTime,
        endDate: endTime
    };
    console.log(data);
    // Wait for the server response and then store the result in the state
    const resultData = await sendDataToAWS(data);
    setResult(resultData);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  async function handleSubmit(event) {
    event.preventDefault();

    if (stage === 1) {
      setIsQuestionsAnswered(true);
      setChatHistory([
        {
          role: 'assistant',
          content:
            "Hi, I'm your stock strategy assistant. Please describe the logic of your strategy and click 'Generate Strategy' button below once you finish.",
        },
      ]);
      setStage(2);
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

  // 向服务器发送数据
  const sendDataToAWS = async (data) => {
    console.log('向服务器发送数据');
    try {
      const response = await axios({
        method: 'post',
        url: 'http://18.222.180.135:5000/api',
        headers: { 'Content-Type': 'application/json' },
            data: {
                code: data.code,
                stockName: data.stockName,
                startDate: data.startDate,
                endDate: data.endDate
            },
        });
      console.log(response.data); // 处理响应数据
      // Reset retry count if code runs successfully
    console.log('----------reset retry count----------');
    setRetryCount(0);
        if (response.data.message === 'Code executed successfully') {
            setReport(response.data.code); // assuming the code is returned in response.data.code
        }
        return response.data.result;
    } catch (error) {
      console.error(error.response.data.error_details); // 输出错误详细信息
      console.error(error.response.data.message); // 输出错误消息
      
      // Add the error message to the chat history
    const errorMessage = { role: 'system', content: error.response.data.error_details };
    console.log('----------error message----------');
    console.log(errorMessage);
    console.log('----------prev chat history----------');
    console.log(chatHistory);
    setChatHistory((prevChatHistory) => [...prevChatHistory, errorMessage]);
    // Increment retry count
    setRetryCount((prevRetryCount) => prevRetryCount + 1);
    }
  };
  
  useEffect(() => {
      console.log('----------retry count----------');
      console.log(retryCount);
      if (retryCount <= 0) {
          console.log('retryCount is 0');
      }
    else if (retryCount < 3) {
        generateStrategyReport();
      } else {
        console.log('Maximum retry count reached. Stopping retries.');
      }
      
}, [retryCount]);

  const generateStrategyReport = async () => {
    setLoading(true);
    try {
      const reportContent = await generateReport(chatHistory);
      sendDataToAWS({code:reportContent,stockName:'AAPL',startDate:'2020-01-01',endDate:'2020-12-31'})
      setReport(reportContent);
      setShowResultForm(true);
      setStage(3);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (stage === 1) {
    // render preferences form
    return (
      <div className={styles.stage1conversationWrapper}>
        <h1>Before Chat with AI, Set Your Preferences</h1>
        <form onSubmit={handleSubmit} className={styles.questionsWrapper}>
          <div className={styles.questionItem}>
            <label className={styles.questionLabel}>Expected Return:  </label>
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
            <label className={styles.questionLabel}>Risk Tolerance:  </label>
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
          <div className={styles.questionItem}>
          <button type="submit" className={styles.preferenceButton}>Set Preferences
          </button>
          </div>
        </form>
      </div>
    );
  }
  
  if (stage === 2) {
    // render conversation box
    return (
      <div className={styles.conversationWrapper}>
        <button onClick={handleStageBack} className={styles.backButton}>
          Back
        </button>
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
    {message.content}
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
      {report && <div className={styles.report}>{report}</div>}
      </div>
    );
  }
  
  if (stage === 3) {
    // render stock information form
    return (
      <div className={styles.stage3conversationWrapper}>
        <button onClick={handleStageBack} className={styles.backButton}>
          Back
        </button>
        <h1>Enter Stock Information</h1>
        <form onSubmit={handleSubmit} className={styles.questionsWrapper}>
          <div className={styles.questionItem}>
            <label className={styles.questionLabel}>Stock Name:</label>
            <input
              type="text"
              id="stockName"
              value={stockName}
              onChange={handleStockNameChange}
              required
              className={styles.questionField}
            />
          </div>
          <div className={styles.questionItem}>
            <label className={styles.questionLabel}>Start Time:</label>
            <input
              type="date"
              id="startTime"
              value={startTime}
              onChange={handleStartTimeChange}
              required
              className={styles.questionField}
            />
          </div>
          <div className={styles.questionItem}>
            <label className={styles.questionLabel}>End Time:</label>
            <input
              type="date"
              id="endTime"
              value={endTime}
              onChange={handleEndTimeChange}
              required
              className={styles.questionField}
            />
          </div>
          <div className={styles.questionItem}>
          <button type="button" onClick={showReturnResult} className={styles.preferenceButton}>
            Show Return Result
          </button>
          </div>
        </form>
        {result && <div className={styles.report}>{result}</div>}
      </div>
    );
  }
};

export default Index;
