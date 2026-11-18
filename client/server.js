import express from 'express';
import 'dotenv/config';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { pool } from './db.js';
import bcrypt from 'bcryptjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}
app.use(express.json({ limit: '50kb' }));
app.use(express.static(path.join(__dirname, 'dist')));
const PgSessionStore = connectPgSimple(session);

if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET is missing from .env');
}

app.use(
  session({
    store: new PgSessionStore({
      pool,
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }),
);

app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password } = req.body ?? {};

  const cleanName = typeof name === 'string' ? name.trim() : '';
  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (!cleanName || !cleanEmail || typeof password !== 'string') {
    return res.status(400).json({ error: 'Name, email and password are required.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email`,
      [cleanName, cleanEmail, passwordHash],
    );

    req.session.userId = rows[0].id;
    res.status(201).json({ user: rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'That email is already registered.' });
    }

    console.error('Signup failed:', error.message);
    res.status(500).json({ error: 'Unable to create account.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body ?? {};

  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const cleanEmail = email.trim().toLowerCase();

    const { rows } = await pool.query(
      `SELECT id, name, email, password_hash
       FROM users
       WHERE email = $1`,
      [cleanEmail],
    );

    const user = rows[0];
    const passwordMatches =
      user && await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }

    await new Promise((resolve, reject) => {
      req.session.regenerate((error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    req.session.userId = user.id;

    await new Promise((resolve, reject) => {
      req.session.save((error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    res.json({
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error('Login failed:', error.message);
    res.status(500).json({ error: 'Unable to log in.' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ user: null });
  }

  try {
    const { rows } = await pool.query(
      'SELECT id, name, email FROM users WHERE id = $1',
      [req.session.userId],
    );

    if (!rows[0]) {
      return res.status(401).json({ user: null });
    }

    res.json({ user: rows[0] });
  } catch (error) {
    console.error('Session check failed:', error.message);
    res.status(500).json({ error: 'Unable to check login.' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({ error: 'Unable to log out.' });
    }

    res.clearCookie('connect.sid', {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
    });

    res.json({ message: 'Logged out.' });
  });
});

app.get('/api/progress', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Log in to view progress.' });
  }

  try {
    const { rows: dsaRows } = await pool.query(
      `SELECT challenge_id, xp_awarded
       FROM user_challenge_progress
       WHERE user_id = $1
       ORDER BY completed_at DESC`,
      [req.session.userId],
    );

    const { rows: trainingRows } = await pool.query(
      `SELECT
         COALESCE(SUM(a.xp_awarded), 0)::int AS training_xp,
         COUNT(*) FILTER (WHERE a.is_correct)::int AS correct_training_answers
       FROM training_attempts AS a
       JOIN training_sessions AS s ON s.id = a.session_id
       WHERE s.user_id = $1`,
      [req.session.userId],
    );

    const dsaXP = dsaRows.reduce(
      (total, row) => total + Number(row.xp_awarded),
      0,
    );
    const trainingXP = Number(trainingRows[0].training_xp);

        res.json({
      completedChallengeIds: dsaRows.map((row) => Number(row.challenge_id)),
      totalXP: dsaXP + trainingXP,
      trainingXP,
      dsaXP,
      correctTrainingAnswers: Number(trainingRows[0].correct_training_answers),
    });
  } catch (error) {
    console.error('Could not load progress:', error.message);
    res.status(500).json({ error: 'Unable to load progress.' });
  }
});



async function runCpp(sourceCode, stdin) {
  const response = await fetch(
    'https://ce.judge0.com/submissions?base64_encoded=false&wait=false',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_code: sourceCode,
        language_id: 54,
        stdin,
        cpu_time_limit: 2,
        wall_time_limit: 5,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Code runner error: ${response.status}`);
  }

  const { token } = await response.json();

  for (let i = 0; i < 30; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const resultResponse = await fetch(
      `https://ce.judge0.com/submissions/${token}?base64_encoded=false`,
    );
    const result = await resultResponse.json();

    if (result.status?.id > 2) return result;
  }

  throw new Error('Runner took too long. Try again.');
}

 app.get('/api/challenges', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        c.id,
        c.title,
        c.topic,
        c.difficulty,
        c.xp_reward,
        c.problem_statement,
        (
          SELECT json_build_object(
            'input', tc.input_data,
            'output', tc.expected_output
          )
          FROM challenge_test_cases AS tc
          WHERE tc.challenge_id = c.id
            AND tc.case_type = 'sample'
          ORDER BY tc.display_order, tc.id
          LIMIT 1
        ) AS sample_case
      FROM challenges AS c
      ORDER BY c.id
    `);

    res.json(rows);
  } catch (error) {
    console.error('Could not load challenges:', error.message);
    res.status(500).json({ error: 'Could not load challenges.' });
  }
});

app.post('/api/run', async (req, res) => {
  const { sourceCode, action, challengeId } = req.body ?? {};

  if (typeof sourceCode !== 'string' || !sourceCode.trim()) {
    return res.status(400).json({ error: 'Write your code first.' });
  }
     
  if (!['run', 'submit'].includes(action)) {
  return res.status(400).json({ error: 'Invalid action.' });
}

if (!Number.isInteger(Number(challengeId)) || Number(challengeId) < 1) {
  return res.status(400).json({ error: 'Valid challenge ID is required.' });
}

if (action === 'submit' && !req.session.userId) {
  return res.status(401).json({ error: 'Log in before submitting a solution.' });
}

  try {

    const challengeResult = await pool.query(
  'SELECT id, xp_reward FROM challenges WHERE id = $1',
  [Number(challengeId)],
);

const challenge = challengeResult.rows[0];

if (!challenge) {
  return res.status(404).json({ error: 'Challenge not found.' });
}

    const testCasesResult = await pool.query(
  `SELECT input_data, expected_output, case_type
   FROM challenge_test_cases
   WHERE challenge_id = $1
     AND ($2 = 'submit' OR case_type = 'sample')
   ORDER BY display_order, id`,
  [Number(challengeId), action],
);

const cases = testCasesResult.rows;

if (cases.length === 0) {
  return res.status(400).json({
    error: 'Is question ke test cases abhi add nahi hue.',
  });
}

const results = [];

    for (const test of cases) {
      const result = await runCpp(sourceCode, test.input_data);

      if (result.status?.id !== 3) {
        return res.json({
          passed: false,
          message:
            result.compile_output ||
            result.stderr ||
            result.status?.description ||
            'Code failed.',
        });
      }

     const actual = (result.stdout ?? '').trim();
const expected = test.expected_output.trim();
const testPassed = actual === expected;

results.push(
  test.case_type === 'sample'
    ? { passed: testPassed, expected, actual, caseType: 'sample' }
    : {
        passed: testPassed,
        expected: 'Hidden test',
        actual: testPassed ? 'Passed' : 'Failed',
        caseType: 'hidden',
      },
);

if (action !== 'submit' && !testPassed) break;
    }

    const passedCount = results.filter((result) => result.passed).length;
const passed = passedCount === cases.length;

let xpAwarded = 0;
let alreadyCompleted = false;

if (action === 'submit') {
  const dbClient = await pool.connect();

  try {
    await dbClient.query('BEGIN');

    await dbClient.query(
      `INSERT INTO submissions (
        user_id,
        challenge_id,
        source_code,
        result_status,
        tests_passed,
        total_tests
      )
      VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        req.session.userId,
        Number(challengeId),
        sourceCode,
        passed ? 'Accepted' : 'Wrong Answer',
        passedCount,
        cases.length,
      ],
    );

    if (passed) {
      const progressResult = await dbClient.query(
        `INSERT INTO user_challenge_progress (
          user_id,
          challenge_id,
          xp_awarded
        )
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, challenge_id) DO NOTHING
        RETURNING xp_awarded`,
        [
          req.session.userId,
          Number(challengeId),
          challenge.xp_reward,
        ],
      );

      if (progressResult.rows[0]) {
        xpAwarded = progressResult.rows[0].xp_awarded;
      } else {
        alreadyCompleted = true;
      }
    }

    await dbClient.query('COMMIT');
  } catch (error) {
    await dbClient.query('ROLLBACK');
    throw error;
  } finally {
    dbClient.release();
  }
}

res.json({
  passed,
  passedCount,
  total: cases.length,
  results,
  xpAwarded,
  alreadyCompleted,
});
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

const TRAINING_LANGUAGES = new Set([
  'cpp',
  'java',
  'python',
  'javascript',
]);

app.get('/api/training/topics', async (req, res) => {
  const language = String(req.query.language ?? '').trim().toLowerCase();

  if (!TRAINING_LANGUAGES.has(language)) {
    return res.status(400).json({
      error: 'Choose a supported language.',
    });
  }

  try {
    const { rows } = await pool.query(
      `SELECT
         t.id,
         t.language,
         t.slug,
         t.title,
         t.description,
         t.display_order,
         (
           SELECT COUNT(*)::int
           FROM training_questions AS q
           WHERE q.topic_id = t.id
             AND q.is_active = TRUE
         ) AS question_count,
         COALESCE(
           (
             SELECT jsonb_object_agg(difficulty, question_count)
             FROM (
               SELECT q.difficulty, COUNT(*)::int AS question_count
               FROM training_questions AS q
               WHERE q.topic_id = t.id
                 AND q.is_active = TRUE
               GROUP BY q.difficulty
             ) AS difficulty_counts
           ),
           '{}'::jsonb
         ) AS question_counts_by_difficulty
       FROM training_topics AS t
       WHERE t.language = $1
         AND t.is_active = TRUE
       ORDER BY t.display_order, t.id`,
      [language],
    );

    res.json(
      rows.map((row) => ({
        ...row,
        id: Number(row.id),
        question_count: Number(row.question_count),
      })),
    );
  } catch (error) {
    console.error('Could not load training topics:', error.message);
    res.status(500).json({ error: 'Could not load training topics.' });
  }
});



app.post('/api/training/sessions', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Log in to start training.' });
  }

  const { topicId, difficulty } = req.body ?? {};
  const parsedTopicId = Number(topicId);
  const allowedDifficulties = ['Beginner', 'Intermediate', 'Advanced'];

  if (!Number.isSafeInteger(parsedTopicId) || parsedTopicId < 1) {
    return res.status(400).json({ error: 'Choose a valid topic.' });
  }

  if (!allowedDifficulties.includes(difficulty)) {
    return res.status(400).json({ error: 'Choose a valid difficulty.' });
  }

  let dbClient;

  try {
    dbClient = await pool.connect();
    await dbClient.query('BEGIN');

    const topicResult = await dbClient.query(
      `SELECT
         t.id,
         t.language,
         t.title,
         COUNT(q.id)::int AS question_count
       FROM training_topics AS t
       LEFT JOIN training_questions AS q
         ON q.topic_id = t.id
        AND q.difficulty = $2
        AND q.is_active = TRUE
       WHERE t.id = $1
         AND t.is_active = TRUE
       GROUP BY t.id, t.language, t.title`,
      [parsedTopicId, difficulty],
    );

    const topic = topicResult.rows[0];

    if (!topic) {
      await dbClient.query('ROLLBACK');
      return res.status(404).json({ error: 'Training topic not found.' });
    }

    if (topic.question_count === 0) {
      await dbClient.query('ROLLBACK');
      return res.status(409).json({
        error: 'Abhi is topic aur difficulty ke questions available nahi hain.',
      });
    }

    await dbClient.query(
      'UPDATE users SET preferred_language = $1 WHERE id = $2',
      [topic.language, req.session.userId],
    );

    const sessionResult = await dbClient.query(
      `INSERT INTO training_sessions (
         user_id,
         topic_id,
         selected_difficulty,
         current_difficulty
       )
       VALUES ($1, $2, $3, $3)
       RETURNING id, hearts_remaining, status, started_at`,
      [req.session.userId, parsedTopicId, difficulty],
    );

    await dbClient.query('COMMIT');

    const trainingSession = sessionResult.rows[0];

    res.status(201).json({
      session: {
        id: Number(trainingSession.id),
        topicId: Number(topic.id),
        topic: topic.title,
        language: topic.language,
        difficulty,
        heartsRemaining: Number(trainingSession.hearts_remaining),
        status: trainingSession.status,
        startedAt: trainingSession.started_at,
      },
    });
  } catch (error) {
    if (dbClient) await dbClient.query('ROLLBACK');
    console.error('Could not start training session:', error.message);
    res.status(500).json({ error: 'Could not start training session.' });
  } finally {
    dbClient?.release();
  }
});


app.post('/api/training/sessions/:sessionId/question', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Log in to continue training.' });
  }

  const sessionId = Number(req.params.sessionId);

  if (!Number.isSafeInteger(sessionId) || sessionId < 1) {
    return res.status(400).json({ error: 'Invalid session ID.' });
  }

  let dbClient;

  try {
    dbClient = await pool.connect();
    await dbClient.query('BEGIN');

    const sessionResult = await dbClient.query(
      `SELECT id, topic_id, current_difficulty, hearts_remaining,
              status, current_question_id
       FROM training_sessions
       WHERE id = $1 AND user_id = $2
       FOR UPDATE`,
      [sessionId, req.session.userId],
    );

    const trainingSession = sessionResult.rows[0];

    if (!trainingSession) {
      await dbClient.query('ROLLBACK');
      return res.status(404).json({ error: 'Training session not found.' });
    }

    if (trainingSession.status !== 'active') {
      await dbClient.query('COMMIT');
      return res.json({
        sessionEnded: true,
        status: trainingSession.status,
        heartsRemaining: Number(trainingSession.hearts_remaining),
      });
    }

    let question = null;

   
    if (trainingSession.current_question_id) {
      const currentResult = await dbClient.query(
        `SELECT q.id, q.difficulty, q.question_type, q.prompt,
                q.content, q.xp_reward
         FROM training_questions AS q
         WHERE q.id = $1
           AND q.topic_id = $2
           AND q.is_active = TRUE
           AND NOT EXISTS (
             SELECT 1
             FROM training_attempts AS a
             WHERE a.session_id = $3 AND a.question_id = q.id
           )`,
        [
          trainingSession.current_question_id,
          trainingSession.topic_id,
          sessionId,
        ],
      );

      question = currentResult.rows[0] ?? null;
    }

    
    if (!question) {
      const nextResult = await dbClient.query(
        `SELECT q.id, q.difficulty, q.question_type, q.prompt,
                q.content, q.xp_reward
         FROM training_questions AS q
         WHERE q.topic_id = $1
           AND q.difficulty = $2
           AND q.is_active = TRUE
           AND NOT EXISTS (
             SELECT 1
             FROM training_attempts AS a
             WHERE a.session_id = $3 AND a.question_id = q.id
           )
         ORDER BY q.display_order, q.id
         LIMIT 1`,
        [
          trainingSession.topic_id,
          trainingSession.current_difficulty,
          sessionId,
        ],
      );

      question = nextResult.rows[0] ?? null;
    }

    if (!question) {
      await dbClient.query(
        `UPDATE training_sessions
         SET status = 'completed',
             current_question_id = NULL,
             ended_at = NOW()
         WHERE id = $1`,
        [sessionId],
      );

      await dbClient.query('COMMIT');

      return res.json({
        sessionEnded: true,
        status: 'completed',
        heartsRemaining: Number(trainingSession.hearts_remaining),
      });
    }

    await dbClient.query(
      `UPDATE training_sessions
       SET current_question_id = $1
       WHERE id = $2`,
      [question.id, sessionId],
    );

    await dbClient.query('COMMIT');

    res.json({
      sessionEnded: false,
      heartsRemaining: Number(trainingSession.hearts_remaining),
      question: {
        id: Number(question.id),
        difficulty: question.difficulty,
        type: question.question_type,
        prompt: question.prompt,
        content: question.content,
        xpReward: Number(question.xp_reward),
      },
    });
  } catch (error) {
    if (dbClient) await dbClient.query('ROLLBACK');
    console.error('Could not load training question:', error.message);
    res.status(500).json({ error: 'Could not load training question.' });
  } finally {
    dbClient?.release();
  }
});

app.post('/api/training/sessions/:sessionId/answer', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Log in to answer questions.' });
  }

  const sessionId = Number(req.params.sessionId);
  const { questionId, selectedAnswer } = req.body ?? {};
  const parsedQuestionId = Number(questionId);

  if (!Number.isSafeInteger(sessionId) || sessionId < 1) {
    return res.status(400).json({ error: 'Invalid session ID.' });
  }

  if (!Number.isSafeInteger(parsedQuestionId) || parsedQuestionId < 1) {
    return res.status(400).json({ error: 'Invalid question ID.' });
  }

  if (selectedAnswer === undefined || selectedAnswer === null) {
    return res.status(400).json({ error: 'Choose an answer first.' });
  }

  const answerJson = JSON.stringify(selectedAnswer);

  if (!answerJson || answerJson.length > 10000) {
    return res.status(400).json({ error: 'Answer is too large or invalid.' });
  }

  let dbClient;
  let transactionStarted = false;

  try {
    dbClient = await pool.connect();
    await dbClient.query('BEGIN');
    transactionStarted = true;

    const sessionResult = await dbClient.query(
      `SELECT id, topic_id, hearts_remaining, status, current_question_id
       FROM training_sessions
       WHERE id = $1 AND user_id = $2
       FOR UPDATE`,
      [sessionId, req.session.userId],
    );

    const trainingSession = sessionResult.rows[0];

    if (!trainingSession) {
      await dbClient.query('ROLLBACK');
      transactionStarted = false;
      return res.status(404).json({ error: 'Training session not found.' });
    }

    if (
      trainingSession.status !== 'active' ||
      Number(trainingSession.hearts_remaining) < 1
    ) {
      await dbClient.query('ROLLBACK');
      transactionStarted = false;
      return res.status(409).json({ error: 'This session has ended.' });
    }

    if (Number(trainingSession.current_question_id) !== parsedQuestionId) {
      await dbClient.query('ROLLBACK');
      transactionStarted = false;
      return res.status(409).json({
        error: 'This is not the current question for the session.',
      });
    }

    const questionResult = await dbClient.query(
      `SELECT
         correct_answer,
         correct_answer = $1::jsonb AS is_correct,
         explanation,
         xp_reward
       FROM training_questions
       WHERE id = $2
         AND topic_id = $3
         AND is_active = TRUE`,
      [answerJson, parsedQuestionId, trainingSession.topic_id],
    );

    const question = questionResult.rows[0];

    if (!question) {
      await dbClient.query('ROLLBACK');
      transactionStarted = false;
      return res.status(404).json({ error: 'Question not found.' });
    }

    const previousAttempt = await dbClient.query(
      `SELECT 1
       FROM training_attempts
       WHERE session_id = $1 AND question_id = $2`,
      [sessionId, parsedQuestionId],
    );

    if (previousAttempt.rowCount > 0) {
      await dbClient.query('ROLLBACK');
      transactionStarted = false;
      return res.status(409).json({ error: 'This question was already answered.' });
    }

    const isCorrect = question.is_correct;
    const xpAwarded = isCorrect ? Number(question.xp_reward) : 0;
    const heartsRemaining = isCorrect
      ? Number(trainingSession.hearts_remaining)
      : Number(trainingSession.hearts_remaining) - 1;
    const sessionEnded = heartsRemaining === 0;
    const sessionStatus = sessionEnded ? 'out_of_hearts' : 'active';

    await dbClient.query(
      `INSERT INTO training_attempts (
         session_id,
         question_id,
         selected_answer,
         is_correct,
         xp_awarded
       )
       VALUES ($1, $2, $3::jsonb, $4, $5)`,
      [sessionId, parsedQuestionId, answerJson, isCorrect, xpAwarded],
    );

    await dbClient.query(
  `UPDATE training_sessions
   SET hearts_remaining = $2,
       status = $3,
       ended_at = CASE WHEN $4 THEN NOW() ELSE ended_at END
   WHERE id = $1`,
  [sessionId, heartsRemaining, sessionStatus, sessionEnded],
);

    const scoreResult = await dbClient.query(
      `SELECT
         COUNT(*) FILTER (WHERE is_correct)::int AS correct_count,
         COALESCE(SUM(xp_awarded), 0)::int AS xp_earned
       FROM training_attempts
       WHERE session_id = $1`,
      [sessionId],
    );

    await dbClient.query('COMMIT');
    transactionStarted = false;

    res.json({
      correct: isCorrect,
      correctAnswer: question.correct_answer,
      explanation: question.explanation,
      xpAwarded,
      heartsRemaining,
      sessionEnded,
      score: scoreResult.rows[0].correct_count,
      sessionXP: scoreResult.rows[0].xp_earned,
    });
  } catch (error) {
    if (dbClient && transactionStarted) {
      await dbClient.query('ROLLBACK');
    }

    console.error('Could not submit training answer:', error.message);
    res.status(500).json({ error: 'Could not submit the answer.' });
  } finally {
    dbClient?.release();
  }
});



const port = process.env.PORT || 3001;

app.listen(port, '0.0.0.0', () => {
  console.log(`Backend running on port ${port}`);
});