import { useState } from 'react';
import './ProblemDetails.css';

function ProblemDetails({ question, onBack, onComplete }) {
  const [code, setCode] = useState('');
  const [result, setResult] = useState('');
  const [running, setRunning] = useState(false);

  async function runCode(action) {
    if (!code.trim()) {
      setResult('Pehle editor mein C++ code likho.');
      return;
    }

    setRunning(true);
    setResult(action === 'run' ? 'Sample test chal raha hai…' : 'Test cases check ho rahe hain…');

    try {
      const response = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceCode: code,
          action,
          challengeId: question.id,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Request nahi chali.');
      }

      if (data.message) {
        setResult(`Code error:\n${data.message}`);
      } else if (data.passed) {
        if (action === 'submit') onComplete();

        setResult(
          action === 'submit'
            ? `Accepted! ${data.passedCount}/${data.total} tests pass hue.`
            : `Sample pass hua! Output: ${data.results[0].actual}`,
        );
      } else {
        const failed = data.results.find((test) => !test.passed);

        setResult(
          `Wrong answer. Expected: ${failed?.expected}; tumhara output: ${failed?.actual || '(koi output nahi)'}`,
        );
      }
    } catch (error) {
      setResult(`Error: ${error.message}`);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="problem-container">
      <button className="problem-back" onClick={onBack}>
        ← Back to Arena
      </button>

      <div className="problem-header">
        <span>ARRAYS / CHALLENGE</span>
        <h1>{question.title}</h1>
        <div className="problem-reward">
          <span>{question.difficulty}</span>
          <span>⚡ {question.xp} XP</span>
        </div>
      </div>

      <div className="problem-content">
        <section className="problem-description">
          <h2>📜 Problem Statement</h2>
          <p>{question.description}</p>

         {question.sample_case && (
  <>
    <h3>Example</h3>
    <div className="example-box">
      <strong>Input:</strong>
      <pre style={{ whiteSpace: 'pre-wrap' }}>
        {question.sample_case.input}
      </pre>
      <strong>Output:</strong>
      <pre>{question.sample_case.output}</pre>
    </div>
  </>
)}

<div className="mission-box">
  <h3>🎯 Your Mission</h3>
  <p>
    Write a complete C++ program that follows the input format and prints
    the answer described in the problem statement.
  </p>
</div>
        </section>

        <section className="code-section">
          <div className="editor-header">
            <span>💻 CODE EDITOR</span>
            <span>C++</span>
          </div>

          <textarea
            className="code-editor"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="Write your complete C++ program here..."
          />

          <div className="editor-buttons">
            <button
              className="run-button"
              disabled={running}
              onClick={() => runCode('run')}
            >
              {running ? 'Running…' : '▶ Run Code'}
            </button>

            <button
              className="submit-button"
              disabled={running}
              onClick={() => runCode('submit')}
            >
              {running ? 'Checking…' : 'Submit Solution →'}
            </button>
          </div>

          {result && <pre className="run-result">{result}</pre>}
        </section>
      </div>
    </div>
  );
}

export default ProblemDetails;