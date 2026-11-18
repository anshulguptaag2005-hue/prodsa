--
-- PostgreSQL database dump
--

\restrict bXhWWeHv44pqFfjObU34FdWoRpHR6vasITry2NMuS3krccvKX2hW0BQj110PqTK

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

-- Started on 2026-11-16 18:50:07

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 228 (class 1259 OID 16487)
-- Name: challenge_test_cases; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.challenge_test_cases (
    id integer NOT NULL,
    challenge_id integer NOT NULL,
    input_data text NOT NULL,
    expected_output text NOT NULL,
    case_type character varying(10) NOT NULL,
    display_order integer DEFAULT 1 NOT NULL,
    CONSTRAINT challenge_test_cases_case_type_check CHECK (((case_type)::text = ANY ((ARRAY['sample'::character varying, 'hidden'::character varying])::text[])))
);



--
-- TOC entry 227 (class 1259 OID 16486)
-- Name: challenge_test_cases_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.challenge_test_cases_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 5134 (class 0 OID 0)
-- Dependencies: 227
-- Name: challenge_test_cases_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.challenge_test_cases_id_seq OWNED BY public.challenge_test_cases.id;


--
-- TOC entry 222 (class 1259 OID 16406)
-- Name: challenges; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.challenges (
    id bigint NOT NULL,
    title character varying(150) NOT NULL,
    topic character varying(100) NOT NULL,
    difficulty character varying(20) NOT NULL,
    xp_reward integer NOT NULL,
    problem_statement text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT challenges_difficulty_check CHECK (((difficulty)::text = ANY ((ARRAY['Easy'::character varying, 'Medium'::character varying, 'Hard'::character varying])::text[]))),
    CONSTRAINT challenges_xp_reward_check CHECK ((xp_reward > 0))
);



--
-- TOC entry 221 (class 1259 OID 16405)
-- Name: challenges_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.challenges ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.challenges_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 226 (class 1259 OID 16475)
-- Name: session; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);



--
-- TOC entry 224 (class 1259 OID 16424)
-- Name: submissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.submissions (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    challenge_id bigint NOT NULL,
    source_code text NOT NULL,
    result_status character varying(30) NOT NULL,
    tests_passed integer DEFAULT 0 NOT NULL,
    total_tests integer NOT NULL,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT submissions_result_status_check CHECK (((result_status)::text = ANY ((ARRAY['Accepted'::character varying, 'Wrong Answer'::character varying, 'Compile Error'::character varying, 'Runtime Error'::character varying, 'Time Limit Exceeded'::character varying])::text[]))),
    CONSTRAINT submissions_tests_passed_check CHECK ((tests_passed >= 0)),
    CONSTRAINT submissions_total_tests_check CHECK ((total_tests > 0))
);



--
-- TOC entry 223 (class 1259 OID 16423)
-- Name: submissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.submissions ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.submissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 236 (class 1259 OID 16606)
-- Name: training_attempts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.training_attempts (
    id bigint NOT NULL,
    session_id bigint NOT NULL,
    question_id bigint NOT NULL,
    selected_answer jsonb NOT NULL,
    is_correct boolean NOT NULL,
    xp_awarded integer DEFAULT 0 NOT NULL,
    answered_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT training_attempts_xp_awarded_check CHECK ((xp_awarded >= 0))
);



--
-- TOC entry 235 (class 1259 OID 16605)
-- Name: training_attempts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.training_attempts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 5135 (class 0 OID 0)
-- Dependencies: 235
-- Name: training_attempts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.training_attempts_id_seq OWNED BY public.training_attempts.id;


--
-- TOC entry 232 (class 1259 OID 16534)
-- Name: training_questions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.training_questions (
    id bigint NOT NULL,
    topic_id bigint NOT NULL,
    difficulty character varying(20) NOT NULL,
    question_type character varying(30) NOT NULL,
    prompt text NOT NULL,
    content jsonb DEFAULT '{}'::jsonb NOT NULL,
    correct_answer jsonb NOT NULL,
    explanation text NOT NULL,
    xp_reward integer DEFAULT 5 NOT NULL,
    display_order integer DEFAULT 1 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT training_questions_difficulty_check CHECK (((difficulty)::text = ANY ((ARRAY['Beginner'::character varying, 'Intermediate'::character varying, 'Advanced'::character varying])::text[]))),
    CONSTRAINT training_questions_question_type_check CHECK (((question_type)::text = ANY ((ARRAY['mcq'::character varying, 'code_output'::character varying, 'find_error'::character varying, 'missing_line'::character varying, 'logic'::character varying, 'code_order'::character varying])::text[]))),
    CONSTRAINT training_questions_xp_reward_check CHECK ((xp_reward >= 0))
);



--
-- TOC entry 231 (class 1259 OID 16533)
-- Name: training_questions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.training_questions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 5136 (class 0 OID 0)
-- Dependencies: 231
-- Name: training_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.training_questions_id_seq OWNED BY public.training_questions.id;


--
-- TOC entry 234 (class 1259 OID 16569)
-- Name: training_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.training_sessions (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    topic_id bigint NOT NULL,
    selected_difficulty character varying(20) NOT NULL,
    current_difficulty character varying(20) NOT NULL,
    hearts_remaining smallint DEFAULT 3 NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    current_question_id bigint,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    ended_at timestamp with time zone,
    CONSTRAINT training_sessions_current_difficulty_check CHECK (((current_difficulty)::text = ANY ((ARRAY['Beginner'::character varying, 'Intermediate'::character varying, 'Advanced'::character varying])::text[]))),
    CONSTRAINT training_sessions_hearts_remaining_check CHECK (((hearts_remaining >= 0) AND (hearts_remaining <= 3))),
    CONSTRAINT training_sessions_selected_difficulty_check CHECK (((selected_difficulty)::text = ANY ((ARRAY['Beginner'::character varying, 'Intermediate'::character varying, 'Advanced'::character varying])::text[]))),
    CONSTRAINT training_sessions_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'completed'::character varying, 'out_of_hearts'::character varying, 'abandoned'::character varying])::text[])))
);



--
-- TOC entry 233 (class 1259 OID 16568)
-- Name: training_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.training_sessions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 5137 (class 0 OID 0)
-- Dependencies: 233
-- Name: training_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.training_sessions_id_seq OWNED BY public.training_sessions.id;


--
-- TOC entry 230 (class 1259 OID 16512)
-- Name: training_topics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.training_topics (
    id bigint NOT NULL,
    language character varying(20) NOT NULL,
    slug character varying(60) NOT NULL,
    title character varying(100) NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    display_order integer DEFAULT 1 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    CONSTRAINT training_topics_language_check CHECK (((language)::text = ANY ((ARRAY['cpp'::character varying, 'java'::character varying, 'python'::character varying, 'javascript'::character varying])::text[])))
);



--
-- TOC entry 229 (class 1259 OID 16511)
-- Name: training_topics_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.training_topics_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 5138 (class 0 OID 0)
-- Dependencies: 229
-- Name: training_topics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.training_topics_id_seq OWNED BY public.training_topics.id;


--
-- TOC entry 225 (class 1259 OID 16454)
-- Name: user_challenge_progress; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_challenge_progress (
    user_id bigint NOT NULL,
    challenge_id bigint NOT NULL,
    xp_awarded integer NOT NULL,
    completed_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT user_challenge_progress_xp_awarded_check CHECK ((xp_awarded > 0))
);



--
-- TOC entry 220 (class 1259 OID 16390)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    preferred_language character varying(20) DEFAULT 'cpp'::character varying NOT NULL,
    CONSTRAINT users_preferred_language_check CHECK (((preferred_language)::text = ANY ((ARRAY['cpp'::character varying, 'java'::character varying, 'python'::character varying, 'javascript'::character varying])::text[])))
);



--
-- TOC entry 219 (class 1259 OID 16389)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.users ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 4905 (class 2604 OID 16490)
-- Name: challenge_test_cases id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.challenge_test_cases ALTER COLUMN id SET DEFAULT nextval('public.challenge_test_cases_id_seq'::regclass);


--
-- TOC entry 4921 (class 2604 OID 16609)
-- Name: training_attempts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_attempts ALTER COLUMN id SET DEFAULT nextval('public.training_attempts_id_seq'::regclass);


--
-- TOC entry 4911 (class 2604 OID 16537)
-- Name: training_questions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_questions ALTER COLUMN id SET DEFAULT nextval('public.training_questions_id_seq'::regclass);


--
-- TOC entry 4917 (class 2604 OID 16572)
-- Name: training_sessions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_sessions ALTER COLUMN id SET DEFAULT nextval('public.training_sessions_id_seq'::regclass);


--
-- TOC entry 4907 (class 2604 OID 16515)
-- Name: training_topics id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_topics ALTER COLUMN id SET DEFAULT nextval('public.training_topics_id_seq'::regclass);


--
-- TOC entry 4955 (class 2606 OID 16502)
-- Name: challenge_test_cases challenge_test_cases_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.challenge_test_cases
    ADD CONSTRAINT challenge_test_cases_pkey PRIMARY KEY (id);


--
-- TOC entry 4946 (class 2606 OID 16422)
-- Name: challenges challenges_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.challenges
    ADD CONSTRAINT challenges_pkey PRIMARY KEY (id);


--
-- TOC entry 4953 (class 2606 OID 16484)
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- TOC entry 4948 (class 2606 OID 16443)
-- Name: submissions submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_pkey PRIMARY KEY (id);


--
-- TOC entry 4967 (class 2606 OID 16623)
-- Name: training_attempts training_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_attempts
    ADD CONSTRAINT training_attempts_pkey PRIMARY KEY (id);


--
-- TOC entry 4969 (class 2606 OID 16625)
-- Name: training_attempts training_attempts_session_id_question_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_attempts
    ADD CONSTRAINT training_attempts_session_id_question_id_key UNIQUE (session_id, question_id);


--
-- TOC entry 4962 (class 2606 OID 16561)
-- Name: training_questions training_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_questions
    ADD CONSTRAINT training_questions_pkey PRIMARY KEY (id);


--
-- TOC entry 4964 (class 2606 OID 16589)
-- Name: training_sessions training_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_sessions
    ADD CONSTRAINT training_sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 4957 (class 2606 OID 16532)
-- Name: training_topics training_topics_language_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_topics
    ADD CONSTRAINT training_topics_language_slug_key UNIQUE (language, slug);


--
-- TOC entry 4959 (class 2606 OID 16530)
-- Name: training_topics training_topics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_topics
    ADD CONSTRAINT training_topics_pkey PRIMARY KEY (id);


--
-- TOC entry 4950 (class 2606 OID 16464)
-- Name: user_challenge_progress user_challenge_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_challenge_progress
    ADD CONSTRAINT user_challenge_progress_pkey PRIMARY KEY (user_id, challenge_id);


--
-- TOC entry 4942 (class 2606 OID 16404)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4944 (class 2606 OID 16402)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4951 (class 1259 OID 16485)
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- TOC entry 4970 (class 1259 OID 16637)
-- Name: training_attempts_session_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX training_attempts_session_idx ON public.training_attempts USING btree (session_id, answered_at);


--
-- TOC entry 4960 (class 1259 OID 16567)
-- Name: training_questions_path_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX training_questions_path_idx ON public.training_questions USING btree (topic_id, difficulty, display_order) WHERE (is_active = true);


--
-- TOC entry 4965 (class 1259 OID 16636)
-- Name: training_sessions_user_history_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX training_sessions_user_history_idx ON public.training_sessions USING btree (user_id, started_at DESC);


--
-- TOC entry 4975 (class 2606 OID 16503)
-- Name: challenge_test_cases challenge_test_cases_challenge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.challenge_test_cases
    ADD CONSTRAINT challenge_test_cases_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES public.challenges(id) ON DELETE CASCADE;


--
-- TOC entry 4971 (class 2606 OID 16449)
-- Name: submissions submissions_challenge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES public.challenges(id);


--
-- TOC entry 4972 (class 2606 OID 16444)
-- Name: submissions submissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4980 (class 2606 OID 16631)
-- Name: training_attempts training_attempts_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_attempts
    ADD CONSTRAINT training_attempts_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.training_questions(id) ON DELETE RESTRICT;


--
-- TOC entry 4981 (class 2606 OID 16626)
-- Name: training_attempts training_attempts_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_attempts
    ADD CONSTRAINT training_attempts_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.training_sessions(id) ON DELETE CASCADE;


--
-- TOC entry 4976 (class 2606 OID 16562)
-- Name: training_questions training_questions_topic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_questions
    ADD CONSTRAINT training_questions_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES public.training_topics(id) ON DELETE CASCADE;


--
-- TOC entry 4977 (class 2606 OID 16600)
-- Name: training_sessions training_sessions_current_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_sessions
    ADD CONSTRAINT training_sessions_current_question_id_fkey FOREIGN KEY (current_question_id) REFERENCES public.training_questions(id) ON DELETE SET NULL;


--
-- TOC entry 4978 (class 2606 OID 16595)
-- Name: training_sessions training_sessions_topic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_sessions
    ADD CONSTRAINT training_sessions_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES public.training_topics(id) ON DELETE RESTRICT;


--
-- TOC entry 4979 (class 2606 OID 16590)
-- Name: training_sessions training_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_sessions
    ADD CONSTRAINT training_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4973 (class 2606 OID 16470)
-- Name: user_challenge_progress user_challenge_progress_challenge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_challenge_progress
    ADD CONSTRAINT user_challenge_progress_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES public.challenges(id);


--
-- TOC entry 4974 (class 2606 OID 16465)
-- Name: user_challenge_progress user_challenge_progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_challenge_progress
    ADD CONSTRAINT user_challenge_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


-- Completed on 2026-11-16 18:50:07

--
-- PostgreSQL database dump complete
--

\unrestrict bXhWWeHv44pqFfjObU34FdWoRpHR6vasITry2NMuS3krccvKX2hW0BQj110PqTK

