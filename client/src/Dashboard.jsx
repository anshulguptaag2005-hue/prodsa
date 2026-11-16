import { useEffect, useState } from 'react';
import './Dashboard.css';
import Roadmap from './Roadmap';
import ArraysArena from './ArraysArena';
import AuthControls from './AuthControls';
import TrainingGrounds from './TrainingGrounds';

const ranks = [
  { title: 'Code Recruit', minXP: 0, icon: '🛡️', subtitle: 'Your journey begins' },
  { title: 'Array Scout', minXP: 100, icon: '🧭', subtitle: 'You are finding your path' },
  { title: 'Logic Ranger', minXP: 250, icon: '🏹', subtitle: 'Your problem-solving grows' },
  { title: 'Algorithm Knight', minXP: 500, icon: '⚔️', subtitle: 'A strong DSA warrior' },
  { title: 'DSA Champion', minXP: 800, icon: '👑', subtitle: 'A master of the adventure' },
];

function getRankInfo(xp) {
  const currentRank = [...ranks].reverse().find((rank) => xp >= rank.minXP) ?? ranks[0];
  const nextRank = ranks.find((rank) => rank.minXP > xp);
  const progress = nextRank
    ? Math.min(100, ((xp - currentRank.minXP) / (nextRank.minXP - currentRank.minXP)) * 100)
    : 100;

  return { currentRank, nextRank, progress };
}

function Dashboard({ answers = {} }) {
  const [activeSection, setActiveSection] = useState('Dashboard');
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [progress, setProgress] = useState({
    totalXP: 0,
    dsaXP: 0,
    trainingXP: 0,
    completedChallengeIds: [],
  });

  useEffect(() => {
    fetch('/api/progress', { credentials: 'include' })
      .then((response) => {
        if (!response.ok) throw new Error('Could not load progress.');
        return response.json();
      })
      .then((data) => {
        setProgress({
          totalXP: Number(data.totalXP) || 0,
          dsaXP: Number(data.dsaXP) || 0,
          trainingXP: Number(data.trainingXP) || 0,
          completedChallengeIds: data.completedChallengeIds ?? [],
        });
      })
      .catch((error) => console.error('Progress loading failed:', error.message));
  }, []);

  const totalXP = progress.totalXP;
  const completedCount = progress.completedChallengeIds.length;
  const { currentRank, nextRank, progress: rankProgress } = getRankInfo(totalXP);

  const welcomeMessage =
    answers[0] === 'Campus Placements'
      ? 'Your placement quest is waiting. Choose a world and begin.'
      : answers[0] === 'Internship Preparation'
        ? 'Build your skills one challenge at a time.'
        : 'Choose a quest and start strengthening your DSA skills.';

  function openRoadmap() {
    setSelectedTopic(null);
    setActiveSection('DSA Roadmap');
  }

  function openWorld(topic) {
    setActiveSection('DSA Roadmap');
    setSelectedTopic(topic);
  }

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="brand-mark">
          <span className="brand-icon">⚔️</span>
          <span>ProDSA</span>
        </div>

        <p className="sidebar-caption">PLAYER MENU</p>
        <nav>
          {[
            ['Dashboard', '⌂'],
            ['DSA Roadmap', '🗺️'],
            ['Training Grounds', '❤️'],
            ['Practice Problems', '⚔️'],
            ['My Progress', '🏆'],
            ['Profile', '👤'],
          ].map(([item, icon]) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setActiveSection(item);
                setSelectedTopic(null);
              }}
              className={activeSection === item ? 'nav-item active' : 'nav-item'}
            >
              <span>{icon}</span>
              {item}
            </button>
          ))}
        </nav>

        <div className="sidebar-journey">
          <span>YOUR CURRENT TITLE</span>
          <strong>{currentRank.title}</strong>
          <small>{totalXP} XP earned</small>
        </div>
      </aside>

      <main className="main-content">
        <div className="dashboard-topbar">
          <span className="topbar-status">● ADVENTURE MODE</span>
          <AuthControls />
        </div>

        {activeSection === 'Dashboard' && (
          <div className="game-home">
            <section className="quest-hero">
              <div className="hero-copy">
                <p className="hero-kicker">PLAYER HUB <span>•</span> SEASON 01</p>
                <p className="hero-welcome">WELCOME BACK, ADVENTURER</p>
                <h1>Your next quest<br /><span>starts here.</span></h1>
                <p className="hero-description">{welcomeMessage}</p>
                <button className="primary-game-button" onClick={openRoadmap}>
                  Explore Adventure Map <span>→</span>
                </button>
              </div>

              <div className="rank-emblem-card">
                <div className="rank-orbit">✦</div>
                <div className="rank-emblem">{currentRank.icon}</div>
                <p>CURRENT RANK</p>
                <h2>{currentRank.title}</h2>
                <span>{currentRank.subtitle}</span>
              </div>

              <div className="xp-progress-card">
                <div className="xp-progress-heading">
                  <div>
                    <span className="small-label">RANK PROGRESS</span>
                    <strong>{totalXP} XP</strong>
                  </div>
                  <span className="next-rank-label">
                    {nextRank ? 'NEXT: ' + nextRank.title : 'MAX RANK'}
                  </span>
                </div>
                <div className="xp-track">
                  <span style={{ width: rankProgress + '%' }} />
                </div>
                <p>
                  {nextRank
                    ? (nextRank.minXP - totalXP) + ' XP to reach ' + nextRank.title
                    : 'You reached the highest rank!'}
                </p>
              </div>
            </section>

            <section className="player-stats">
              <div className="player-stat-card">
                <span className="stat-icon">⚔️</span>
                <div><small>DSA XP</small><strong>{progress.dsaXP}</strong></div>
              </div>

              <div className="player-stat-card">
                <span className="stat-icon">❤️</span>
                <div><small>TRAINING GROUNDS XP</small><strong>{progress.trainingXP}</strong></div>
              </div>

              <div className="player-stat-card">
                <span className="stat-icon">⚡</span>
                <div><small>TOTAL XP</small><strong>{totalXP}</strong></div>
              </div>
            </section>

            <section className="adventure-preview">
              <div className="section-heading">
                <div>
                  <p className="hero-kicker">CHOOSE YOUR DESTINATION</p>
                  <h2>Adventure Map</h2>
                </div>
                <button className="text-game-button" onClick={openRoadmap}>View full map →</button>
              </div>

              <div className="world-grid">
                <button className="world-card world-open" onClick={() => openWorld('Arrays')}>
                  <span className="world-number">WORLD 01 • OPEN</span>
                  <span className="world-icon">🌌</span>
                  <strong>Array Archipelago</strong>
                  <small>Explore array challenges and sharpen your skills.</small>
                  <span className="world-cta">Enter world →</span>
                </button>

                <button className="world-card world-open" onClick={() => openWorld('Strings')}>
                  <span className="world-number">WORLD 02 • OPEN</span>
                  <span className="world-icon">🌲</span>
                  <strong>String Forest</strong>
                  <small>Choose this realm and explore its available quests.</small>
                  <span className="world-cta">Enter world →</span>
                </button>

                <button className="world-card world-open" onClick={() => openWorld('Graphs')}>
                  <span className="world-number">WORLD 03 • OPEN</span>
                  <span className="world-icon">🏔️</span>
                  <strong>Graph Summit</strong>
                  <small>Pick your own path through the DSA worlds.</small>
                  <span className="world-cta">Enter world →</span>
                </button>
              </div>
            </section>

            <section className="daily-goal-card">
              <span className="daily-goal-icon">✨</span>
              <div>
                <p className="hero-kicker">YOUR PRACTICE GOAL</p>
                <h2>{answers[4] || 'Choose a daily practice goal'}</h2>
                <p>Small practice sessions build strong problem-solving skills.</p>
              </div>
            </section>
          </div>
        )}

        {activeSection === 'DSA Roadmap' && !selectedTopic && (
          <Roadmap onStart={(topic) => setSelectedTopic(topic)} />
        )}

        {activeSection === 'DSA Roadmap' && selectedTopic && (
          <>
            <button className="map-back-button" onClick={openRoadmap}>← All worlds</button>
            <ArraysArena topic={selectedTopic} />
          </>
        )}
        {activeSection === 'Training Grounds' && <TrainingGrounds />}
        {activeSection !== 'Dashboard' && activeSection !== 'DSA Roadmap' && (
          <section className="coming-soon-panel">
            <span>🧭</span>
            <h1>{activeSection}</h1>
            <p>This part of your adventure is coming soon.</p>
          </section>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
