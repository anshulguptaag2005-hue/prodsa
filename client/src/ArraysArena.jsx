import { useEffect, useState } from 'react';
import "./Arraysarena.css";
import ProblemDetails from './ProblemDetails';

function rankFromXP(xp) {
  if (xp >= 800) return 'DSA Champion';
  if (xp >= 500) return 'Algorithm Knight';
  if (xp >= 250) return 'Logic Ranger';
  if (xp >= 100) return 'Array Scout';
  return 'Code Recruit';
}

function ArraysArena({ topic = 'Arrays' }) {
  const [difficulty, setDifficulty] = useState('Easy');
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [dsaXP, setDsaXP] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetch('/api/challenges')
      .then((response) => {
        if (!response.ok) throw new Error('Could not load challenges.');
        return response.json();
      })
      .then((data) => {
        if (!active) return;

        const topicQuestions = data
          .filter((question) => question.topic?.toLowerCase() === topic.toLowerCase())
          .map((question) => ({
            ...question,
            id: Number(question.id),
            xp: Number(question.xp_reward),
            description: question.problem_statement,
          }));

        setQuestions(topicQuestions);
      })
      .catch((error) => console.error('Questions loading failed:', error.message))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [topic]);

  useEffect(() => {
    let active = true;

    fetch('/api/progress', { credentials: 'include' })
      .then(async (response) => {
        if (response.status === 401) return null;
        if (!response.ok) throw new Error('Could not load progress.');
        return response.json();
      })
      .then((data) => {
        if (active && data) {
          setCompleted((data.completedChallengeIds ?? []).map(Number));
          setTotalXP(Number(data.totalXP) || 0);
          setDsaXP(Number(data.dsaXP) || 0);
        }
      })
      .catch((error) => console.error('Progress loading failed:', error.message));

    return () => {
      active = false;
    };
  }, []);

  const filteredQuestions = questions.filter((question) => question.difficulty === difficulty);
  const completedForTopic = questions.filter((question) => completed.includes(question.id)).length;

  function completeChallenge(id, xpReward) {
    if (completed.includes(id)) return;
    setCompleted((current) => current.includes(id) ? current : [...current, id]);
    setTotalXP((current) => current + Number(xpReward));
  }

  return (
    <div className="arena-container">
      <div className="arena-header">
        <p className="arena-tag">YOUR NEXT BATTLE BEGINS HERE</p>
        <h1>⚔️ {topic.toUpperCase()} ARENA</h1>
        <p>Every problem solved makes you stronger.</p>
      </div>

      <div className="arena-stats">
        <div className="arena-stat">
          <h3>⚡ DSA XP</h3>
          <h2>{dsaXP}</h2>
        </div>
        <div className="arena-stat">
          <h3>🏆 COMPLETED IN THIS WORLD</h3>
          <h2>{completedForTopic}/{questions.length}</h2>
        </div>
        <div className="arena-stat">
          <h3>🎯 YOUR RANK</h3>
          <h2>{rankFromXP(totalXP)}</h2>
        </div>
      </div>

      <h2 className="challenge-heading">Choose Your Challenge</h2>

      <div className="difficulty-tabs">
        {['Easy', 'Medium', 'Hard'].map((level) => (
          <button
            key={level}
            className={difficulty === level ? 'selected' : ''}
            onClick={() => {
              setDifficulty(level);
              setSelectedQuestion(null);
            }}
          >
            {level}
          </button>
        ))}
      </div>

      {selectedQuestion ? (
        <ProblemDetails
          question={selectedQuestion}
          onBack={() => setSelectedQuestion(null)}
          onComplete={() => completeChallenge(selectedQuestion.id, selectedQuestion.xp)}
        />
      ) : loading ? (
        <p>Loading quests…</p>
      ) : filteredQuestions.length === 0 ? (
        <div className="empty-realm">
          <span>🧭</span>
          <h3>No quests in this section yet</h3>
          <p>Choose another difficulty or explore a different world.</p>
        </div>
      ) : (
        <div className="challenge-list">
          {filteredQuestions.map((question, index) => (
            <div className="challenge-card" key={question.id}>
              <div className="challenge-info">
                <span className="challenge-number">#{index + 1}</span>
                <div>
                  <h3>{question.title}</h3>
                  <p>⚡ {question.xp} XP Reward</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedQuestion(question)}
                className="challenge-button"
              >
                {completed.includes(question.id) ? 'Completed ✓' : 'Enter Battle →'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ArraysArena;
