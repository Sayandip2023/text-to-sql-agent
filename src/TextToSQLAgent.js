import React, { useState } from 'react';
import { Database, Loader2, AlertCircle, CheckCircle2, Copy, Check } from 'lucide-react';

const TextToSQLAgent = () => {
  const [apiKey, setApiKey] = useState('');
  const [schema, setSchema] = useState(`CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT,
  salary INTEGER,
  hire_date DATE
);

CREATE TABLE departments (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  budget INTEGER
);`);
  const [question, setQuestion] = useState('');
  const [sqlQuery, setSqlQuery] = useState('');
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const examples = [
    "Show me all employees in the Engineering department",
    "What's the average salary by department?",
    "Find the top 5 highest paid employees",
    "List all departments with their total employee count"
  ];

  const generateSQL = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your Gemini API key');
      return;
    }
    
    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }

    setLoading(true);
    setError('');
    setSqlQuery('');
    setExplanation('');

    try {
      const prompt = `You are a SQL expert. Given the following database schema and a natural language question, generate a SQL query.

Database Schema:
${schema}

Question: ${question}

Please respond with ONLY a JSON object in this exact format (no markdown, no backticks, no preamble):
{
  "sql": "the SQL query here",
  "explanation": "brief explanation of what the query does"
}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 1000,
            }
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to generate SQL');
      }

      const data = await response.json();
      const generatedText = data.candidates[0].content.parts[0].text;
      
      // Clean the response and parse JSON
      const cleanedText = generatedText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      const result = JSON.parse(cleanedText);
      
      setSqlQuery(result.sql);
      setExplanation(result.explanation);
    } catch (err) {
      setError(err.message || 'Failed to generate SQL query');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlQuery);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const useExample = (example) => {
    setQuestion(example);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Database className="w-10 h-10 text-indigo-600" />
            <h1 className="text-4xl font-bold text-gray-800">Text-to-SQL Agent</h1>
          </div>
          <p className="text-gray-600">Powered by Gemini 2.5 Flash</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Gemini API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Gemini API key"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-2">
            Get your API key from{' '}
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline"
            >
              Google AI Studio
            </a>
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Database Schema
          </label>
          <textarea
            value={schema}
            onChange={(e) => setSchema(e.target.value)}
            rows={8}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Enter your database schema..."
          />
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Your Question
          </label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Ask a question about your data in natural language..."
          />
          
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Try an example:</p>
            <div className="flex flex-wrap gap-2">
              {examples.map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => useExample(example)}
                  className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm hover:bg-indigo-100 transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={generateSQL}
            disabled={loading}
            className="w-full mt-4 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating SQL...
              </>
            ) : (
              <>
                <Database className="w-5 h-5" />
                Generate SQL Query
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800">Error</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {sqlQuery && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-gray-800">Generated SQL Query</h3>
              </div>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
            
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-green-400 font-mono text-sm">{sqlQuery}</pre>
            </div>

            {explanation && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Explanation</h4>
                <p className="text-blue-800 text-sm">{explanation}</p>
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-3">How to Use</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 text-sm">
            <li>Get your free API key from Google AI Studio</li>
            <li>Enter your database schema (or use the default example)</li>
            <li>Ask a question in natural language about your data</li>
            <li>Click "Generate SQL Query" to get your SQL statement</li>
            <li>Copy and use the generated SQL in your database</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default TextToSQLAgent;
