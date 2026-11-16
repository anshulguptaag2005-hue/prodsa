import './Roadmap.css';

const topics = [
  { id: 1, name: 'Arrays', icon: '📊', questions: 30, easy: 15, medium: 10, hard: 5 },
  { id: 2, name: 'Strings', icon: '🔤', questions: 25, easy: 12, medium: 9, hard: 4 },
  { id: 3, name: 'Searching & Sorting', icon: '🔍', questions: 25, easy: 10, medium: 10, hard: 5 },
  { id: 4, name: 'Linked Lists', icon: '🔗', questions: 20, easy: 8, medium: 8, hard: 4 },
  { id: 5, name: 'Recursion & Backtracking', icon: '🌳', questions: 25, easy: 10, medium: 10, hard: 5 },
  { id: 6, name: 'Trees & BST', icon: '🌲', questions: 30, easy: 12, medium: 12, hard: 6 },
  { id: 7, name: 'Graphs', icon: '🕸️', questions: 25, easy: 10, medium: 10, hard: 5 },
  { id: 8, name: 'Dynamic Programming', icon: '🧠', questions: 30, easy: 10, medium: 12, hard: 8 },
];

function Roadmap({ onStart }) {
  return (
    <div className="roadmap-container">
      <div className="roadmap-header">
        <p className="roadmap-tag">YOUR LEARNING JOURNEY</p>
        <h1>DSA Adventure Map 🚀</h1>
        <p>Choose your next challenge and level up your skills.</p>
      </div>

      <div className="topics-grid">
        {topics.map((topic) => (
          <div className="topic-card" key={topic.id}>
            <div className="topic-top">
              <span className="topic-icon">{topic.icon}</span>
              <span className="topic-number">LEVEL {topic.id}</span>
            </div>

            <h2>{topic.name}</h2>
            <p>{topic.questions} Challenges</p>

            <div className="difficulty">
              <span>Easy: {topic.easy}</span>
              <span>Medium: {topic.medium}</span>
              <span>Hard: {topic.hard}</span>
            </div>

           <button
    className="start-button"
    onClick={() => onStart(topic.name)}
>
    Start Learning →
</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Roadmap;