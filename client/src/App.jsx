import { useState } from 'react'
import './App.css'
import Dashboard from './Dashboard'

const questions = [
  {
    title: "What's your primary goal?",
    subtitle: "Tell us what brings you to ProDSA.",
    options: [
      "Campus Placements",
      "Internship Preparation",
      "Competitive Programming",
      "Learning DSA"
    ]
  },
  {
    title: "Which programming language do you prefer?",
    subtitle: "Choose your preferred coding language.",
    options: ["C++", "Java", "Python", "JavaScript"]
  },
  {
    title: "What's your current DSA level?",
    subtitle: "We'll adjust your learning path accordingly.",
    options: ["Beginner", "Intermediate", "Advanced"]
  },
  {
    title: "What's your main focus?",
    subtitle: "Which area would you like to improve?",
    options: [
      "Arrays & Strings",
      "Linked Lists",
      "Trees & Graphs",
      "Complete DSA"
    ]
  },
  {
    title: "How much time can you practice daily?",
    subtitle: "Choose a realistic daily practice goal.",
    options: ["30 Minutes", "1 Hour", "2 Hours", "3+ Hours"]
  }
]

function App() {
  const [started, setStarted] = useState(false)
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})

  const selectAnswer = (option) => {
    setAnswers({ ...answers, [step]: option })
  }

  const nextStep = () => {
    if (step < questions.length - 1) {
      setStep(step + 1)
    } else {
      setStarted(false)
    }
  }

  const previousStep = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  if (!started && Object.keys(answers).length === 5) {
   return <Dashboard answers={answers} />

  }

  if (!started) {
    return (
      <div className="welcome-screen">
        <header className="welcome-nav">
          <div className="welcome-brand">
            <span className="welcome-brand-icon">⚔️</span>
            <span className="welcome-brand-name">ProDSA</span>
            <span className="welcome-brand-mode">ADVENTURE MODE</span>
          </div>
          <div className="welcome-online">
            <span className="online-dot" />
            YOUR NEXT QUEST AWAITS
          </div>
        </header>

        <main className="welcome-hero">
          <div className="welcome-copy">
            <p className="welcome-kicker"><span>01</span> THE DSA ADVENTURE BEGINS</p>
            <h1>
              Train your mind.
              <br />
              <span>Level up your future.</span>
            </h1>
            <p className="welcome-description">
              Turn placement preparation into a journey. Solve coding quests,
              earn XP, and build skills one victory at a time.
            </p>

            <button className="welcome-cta" onClick={() => setStarted(true)}>
              Start your adventure <span>→</span>
            </button>

            <div className="welcome-features">
              <div><span>⚔️</span><strong>Real coding quests</strong></div>
              <div><span>⚡</span><strong>Earn XP as you grow</strong></div>
              <div><span>🧭</span><strong>Choose your own path</strong></div>
            </div>
          </div>

          <div className="welcome-scene" aria-hidden="true">
            <div className="scene-glow" />
            <div className="scene-orbit scene-orbit-outer" />
            <div className="scene-orbit scene-orbit-inner" />
            <div className="scene-node node-top">01</div>
            <div className="scene-node node-right">02</div>
            <div className="scene-node node-bottom">03</div>
            <div className="scene-planet">
              <span>⚡</span>
              <small>LEVEL UP</small>
            </div>
            <div className="scene-float-card float-card-top">
              <span>✦ QUEST READY</span>
              <strong>Arrays Arena</strong>
            </div>
            <div className="scene-float-card float-card-bottom">
              <span>YOUR FIRST REWARD</span>
              <strong>+20 XP <span>⚡</span></strong>
            </div>
            <div className="scene-spark spark-one">✦</div>
            <div className="scene-spark spark-two">✧</div>
            <div className="scene-spark spark-three">✦</div>
          </div>
        </main>

        <footer className="welcome-footer">
          <span>CHOOSE YOUR PATH</span>
          <i />
          <span>TAKE ON A QUEST</span>
          <i />
          <span>MAKE EVERY WIN COUNT</span>
        </footer>
      </div>
    )
  }

  const currentQuestion = questions[step]

  return (
    <div className="onboarding">
      <div className="onboarding-card">

        <h2>ProDSA</h2>

        <div className="progress-info">
          Step {step + 1} of {questions.length}
        </div>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${((step + 1) / questions.length) * 100}%`
            }}
          ></div>
        </div>

        <h1>{currentQuestion.title}</h1>
        <p>{currentQuestion.subtitle}</p>

        <div className="options">
          {currentQuestion.options.map((option) => (
            <button
              key={option}
              className={
                answers[step] === option ? "option selected" : "option"
              }
              onClick={() => selectAnswer(option)}
            >
              {option}
            </button>
          ))}
        </div>

        <div className="navigation">
          <button
            className="back-btn"
            onClick={previousStep}
            disabled={step === 0}
          >
            Back
          </button>

          <button
            className="next-btn"
            onClick={nextStep}
            disabled={!answers[step]}
          >
            {step === questions.length - 1 ? "Finish" : "Continue"}
          </button>
        </div>

      </div>
    </div>
  )
}

export default App
