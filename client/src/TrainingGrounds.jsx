import { useEffect, useState } from 'react';
import './TrainingGrounds.css';
const languages = [
    { code: 'cpp', label: 'C++' },
    { code: 'java', label: 'Java' },
    { code: 'python', label: 'Python' },
    { code: 'javascript', label: 'JavaScript' },
];

const difficulties = ['Beginner', 'Intermediate', 'Advanced'];

function TrainingGrounds() {
    const [language, setLanguage] = useState('cpp');
    const [topics, setTopics] = useState([]);
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [difficulty, setDifficulty] = useState('Beginner');

    const [session, setSession] = useState(null);
    const [question, setQuestion] = useState(null);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [feedback, setFeedback] = useState(null);
    const [notice, setNotice] = useState('');
    const [message, setMessage] = useState('Loading topics...');
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        setSelectedTopic(null);
        setMessage('Loading topics...');

        fetch(`/api/training/topics?language=${encodeURIComponent(language)}`)
            .then(async (response) => {
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Could not load topics.');
                return data;
            })
            .then((data) => {
                setTopics(data);
                setMessage(data.length ? '' : 'No topics are available for this language yet.');
            })
            .catch((error) => {
                setTopics([]);
                setMessage(error.message);
            });
    }, [language]);

    function getQuestionCount(topic, level) {
        return Number(topic.question_counts_by_difficulty?.[level] ?? 0);
    }

    async function loadQuestion(sessionId) {
        const response = await fetch(
            `/api/training/sessions/${sessionId}/question`,
            {
                method: 'POST',
                credentials: 'include',
            },
        );

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load question.');

        setSession((current) => ({
            ...current,
            heartsRemaining: data.heartsRemaining,
        }));

        if (data.sessionEnded) {
            setQuestion(null);
            setNotice(
                data.status === 'out_of_hearts'
                    ? 'Your run ended: you used all 3 hearts.'
                    : 'You completed the available questions for this topic and level.',
            );
            return;
        }

        setQuestion(data.question);
        setSelectedAnswer(null);
        setFeedback(null);
        setNotice('');
    }

    async function startPractice() {
        if (!selectedTopic) return;

        setBusy(true);
        setNotice('');

        try {
            const response = await fetch('/api/training/sessions', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topicId: selectedTopic.id,
                    difficulty,
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Could not start practice.');

            setSession(data.session);
            await loadQuestion(data.session.id);
        } catch (error) {
            setNotice(error.message);
        } finally {
            setBusy(false);
        }
    }

    async function submitAnswer() {
        if (selectedAnswer === null || !session || !question) return;

        setBusy(true);

        try {
            const response = await fetch(
                `/api/training/sessions/${session.id}/answer`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        questionId: question.id,
                        selectedAnswer,
                    }),
                },
            );

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Could not submit answer.');

            setSession((current) => ({
                ...current,
                heartsRemaining: data.heartsRemaining,
            }));
            setFeedback(data);

            if (data.sessionEnded) {
                setNotice('Your run ended: you used all 3 hearts.');
            }
        } catch (error) {
            setNotice(error.message);
        } finally {
            setBusy(false);
        }
    }

    function leavePractice() {
        setSession(null);
        setQuestion(null);
        setSelectedAnswer(null);
        setFeedback(null);
        setNotice('');
    }

    if (session) {
        const options =
            question?.content?.options ??
            question?.content?.choices ??
            [];
        const questionCode = question?.content?.code;
        return (
            <section className="training-grounds">
                <button type="button" onClick={leavePractice}>
                    ← Back to topics
                </button>

                <p className="hero-kicker">
                    {session.topic} · {session.difficulty}
                </p>
                <h1>Training Grounds</h1>
                <p>Hearts: {'❤️'.repeat(session.heartsRemaining)}{'🖤'.repeat(3 - session.heartsRemaining)}</p>

                {notice && <p role="status">{notice}</p>}

                {question && (
                    <>
                        <p>{question.type.replaceAll('_', ' ')}</p>
                        <h2>{question.prompt}</h2>

                        {questionCode && (
                            <pre style={{ overflowX: 'auto', padding: '16px', borderRadius: '8px' }}>
                                <code>{questionCode}</code>
                            </pre>
                        )}
                        {options.length > 0 ? (
                            <div>
                                {options.map((option, index) => {
                                    const value =
                                        typeof option === 'object'
                                            ? option.value ?? option.label ?? option.text
                                            : option;
                                    const label =
                                        typeof option === 'object'
                                            ? option.label ?? option.text ?? String(value)
                                            : option;

                                    return (
                                        <label key={`${index}-${String(value)}`} style={{ display: 'block', margin: '10px 0' }}>
                                            <input
                                                type="radio"
                                                name="training-answer"
                                                checked={selectedAnswer === value}
                                                disabled={Boolean(feedback)}
                                                onChange={() => setSelectedAnswer(value)}
                                            />
                                            {' '}{label}
                                        </label>
                                    );
                                })}
                            </div>
                        ) : (
                            <textarea
                                value={selectedAnswer ?? ''}
                                disabled={Boolean(feedback)}
                                onChange={(event) => setSelectedAnswer(event.target.value)}
                                placeholder="Type your answer"
                                rows={4}
                            />
                        )}

                        {!feedback && (
                            <p>
                                <button
                                    type="button"
                                    onClick={submitAnswer}
                                    disabled={busy || selectedAnswer === null}
                                >
                                    {busy ? 'Checking...' : 'Submit answer'}
                                </button>
                            </p>
                        )}

                        {feedback && (
                            <div>
                                <h3>{feedback.correct ? 'Correct! 🎉' : 'Not quite'}</h3>
                                <p>{feedback.correct ? `+${feedback.xpAwarded} XP` : 'No XP this time.'}</p>
                                <p>Answer: {JSON.stringify(feedback.correctAnswer)}</p>
                                <p>{feedback.explanation}</p>

                                {!feedback.sessionEnded && (
                                    <button
                                        type="button"
                                        onClick={() => loadQuestion(session.id)}
                                        disabled={busy}
                                    >
                                        Next question →
                                    </button>
                                )}
                            </div>
                        )}
                    </>
                )}
            </section>
        );
    }

    return (
        <section className="training-grounds">
            <p className="hero-kicker">PRACTICE ARENA</p>
            <h1>Training Grounds</h1>
            <p>Choose a language, topic, and difficulty to begin.</p>

            <h2>Choose language</h2>
            <div>
                {languages.map((item) => (
                    <button
                        key={item.code}
                        type="button"
                        onClick={() => setLanguage(item.code)}
                        aria-pressed={language === item.code}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            <h2>Choose difficulty</h2>
            <div>
                {difficulties.map((level) => (
                    <button
                        key={level}
                        type="button"
                        onClick={() => setDifficulty(level)}
                        aria-pressed={difficulty === level}
                    >
                        {level}
                    </button>
                ))}
            </div>

            <h2>Choose topic</h2>
            {message && <p>{message}</p>}

            <div>
                {topics.map((topic) => {
                    const count = getQuestionCount(topic, difficulty);

                    return (
                        <button
                            key={topic.id}
                            type="button"
                            disabled={count === 0}
                            onClick={() => setSelectedTopic(topic)}
                            aria-pressed={selectedTopic?.id === topic.id}
                        >
                            <strong>{topic.title}</strong>
                            <span> — {count} {difficulty} questions</span>
                        </button>
                    );
                })}
            </div>

            {selectedTopic && (
                <div>
                    <p>Selected: {selectedTopic.title} · {difficulty}</p>
                    <button
                        type="button"
                        onClick={startPractice}
                        disabled={busy}
                    >
                        {busy ? 'Starting...' : 'Start Practice'}
                    </button>
                </div>
            )}

            {notice && <p role="alert">{notice}</p>}
        </section>
    );
}

export default TrainingGrounds;