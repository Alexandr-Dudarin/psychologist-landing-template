--
-- PostgreSQL database dump
--


-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

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

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: blocked_slots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blocked_slots (
    id bigint NOT NULL,
    blocked_date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    reason text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT blocked_slots_check CHECK ((start_time < end_time))
);


--
-- Name: blocked_slots_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.blocked_slots_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: blocked_slots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.blocked_slots_id_seq OWNED BY public.blocked_slots.id;


--
-- Name: booking_payment_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_payment_requests (
    id integer NOT NULL,
    request_id text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    processed_at timestamp without time zone
);


--
-- Name: booking_payment_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.booking_payment_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: booking_payment_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.booking_payment_requests_id_seq OWNED BY public.booking_payment_requests.id;


--
-- Name: booking_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_settings (
    id integer DEFAULT 1 NOT NULL,
    min_advance_hours integer DEFAULT 3 NOT NULL,
    buffer_minutes integer DEFAULT 30 NOT NULL,
    allow_same_day_booking boolean DEFAULT true NOT NULL,
    max_days_ahead integer DEFAULT 30 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    timezone text DEFAULT 'Europe/Moscow'::text NOT NULL,
    CONSTRAINT booking_settings_id_check CHECK ((id = 1))
);


--
-- Name: client_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_reviews (
    id bigint NOT NULL,
    client_id bigint NOT NULL,
    eligibility_session_id bigint,
    public_name text,
    rating integer,
    text text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    admin_note text,
    source text DEFAULT 'website'::text NOT NULL,
    consent_accepted boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    published_at timestamp with time zone,
    hidden_at timestamp with time zone,
    deleted_at timestamp with time zone,
    public_order integer,
    CONSTRAINT client_reviews_admin_note_length_check CHECK (((admin_note IS NULL) OR (length(TRIM(BOTH FROM admin_note)) <= 500))),
    CONSTRAINT client_reviews_public_name_length_check CHECK (((public_name IS NULL) OR (length(TRIM(BOTH FROM public_name)) <= 80))),
    CONSTRAINT client_reviews_rating_check CHECK (((rating IS NULL) OR ((rating >= 1) AND (rating <= 5)))),
    CONSTRAINT client_reviews_source_check CHECK ((source = ANY (ARRAY['website'::text, 'admin'::text]))),
    CONSTRAINT client_reviews_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'published'::text, 'hidden'::text, 'deleted'::text]))),
    CONSTRAINT client_reviews_text_length_check CHECK (((length(TRIM(BOTH FROM text)) >= 10) AND (length(TRIM(BOTH FROM text)) <= 2000)))
);


--
-- Name: client_reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.client_reviews_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: client_reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.client_reviews_id_seq OWNED BY public.client_reviews.id;


--
-- Name: client_service_packages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_service_packages (
    id bigint NOT NULL,
    client_id bigint NOT NULL,
    package_plan_id bigint NOT NULL,
    code character varying(12) NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT client_service_packages_status_check CHECK ((status = ANY (ARRAY['active'::text, 'cancelled'::text])))
);


--
-- Name: client_service_packages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.client_service_packages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: client_service_packages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.client_service_packages_id_seq OWNED BY public.client_service_packages.id;


--
-- Name: clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clients (
    id bigint NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    email text NOT NULL,
    source text DEFAULT 'website'::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    first_request_id bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    preferred_contact_method text,
    preferred_contact_value text,
    is_favorite boolean DEFAULT false NOT NULL,
    reviews_blocked_at timestamp with time zone,
    reviews_blocked_reason text,
    CONSTRAINT clients_preferred_contact_method_check CHECK (((preferred_contact_method IS NULL) OR (preferred_contact_method = ANY (ARRAY['whatsapp'::text, 'telegram'::text, 'email'::text, 'sms'::text, 'vk'::text]))))
);


--
-- Name: clients_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.clients_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: clients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.clients_id_seq OWNED BY public.clients.id;


--
-- Name: notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notes (
    id bigint NOT NULL,
    client_id bigint NOT NULL,
    session_id bigint,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: notes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notes_id_seq OWNED BY public.notes.id;


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id integer NOT NULL,
    request_id text NOT NULL,
    provider text DEFAULT 'mock'::text NOT NULL,
    provider_payment_id text,
    status text DEFAULT 'pending'::text NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency text DEFAULT 'RUB'::text NOT NULL,
    booking_payload jsonb,
    session_id integer,
    error_message text,
    paid_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    payment_kind text DEFAULT 'booking'::text NOT NULL,
    package_purchase_payload jsonb,
    client_package_id bigint,
    CONSTRAINT payments_payload_by_kind_check CHECK ((((payment_kind = 'booking'::text) AND (booking_payload IS NOT NULL)) OR ((payment_kind = 'service_package'::text) AND (package_purchase_payload IS NOT NULL)))),
    CONSTRAINT payments_payment_kind_check CHECK ((payment_kind = ANY (ARRAY['booking'::text, 'service_package'::text]))),
    CONSTRAINT payments_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'paid'::text, 'failed'::text, 'expired'::text, 'cancelled'::text])))
);


--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- Name: rate_limits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rate_limits (
    id bigint NOT NULL,
    action_key text NOT NULL,
    identifier_hash text NOT NULL,
    window_start timestamp with time zone NOT NULL,
    request_count integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT rate_limits_request_count_positive CHECK ((request_count > 0))
);


--
-- Name: rate_limits_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.rate_limits_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: rate_limits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.rate_limits_id_seq OWNED BY public.rate_limits.id;


--
-- Name: requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.requests (
    id bigint NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    email text NOT NULL,
    message text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'new'::text NOT NULL,
    source text DEFAULT 'website'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    client_id bigint,
    preferred_contact_method text,
    preferred_contact_value text,
    viewed_at timestamp with time zone,
    CONSTRAINT requests_preferred_contact_method_check CHECK (((preferred_contact_method IS NULL) OR (preferred_contact_method = ANY (ARRAY['whatsapp'::text, 'telegram'::text, 'email'::text, 'sms'::text, 'vk'::text]))))
);


--
-- Name: requests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.requests_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.requests_id_seq OWNED BY public.requests.id;


--
-- Name: review_reward_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.review_reward_codes (
    id bigint NOT NULL,
    review_id bigint NOT NULL,
    client_id bigint NOT NULL,
    code text NOT NULL,
    discount_percent integer DEFAULT 25 NOT NULL,
    applies_to text DEFAULT 'single_service'::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    used_at timestamp with time zone,
    expires_at timestamp with time zone,
    used_payment_id bigint,
    CONSTRAINT review_reward_codes_applies_to_check CHECK ((applies_to = 'single_service'::text)),
    CONSTRAINT review_reward_codes_code_length_check CHECK (((length(TRIM(BOTH FROM code)) >= 6) AND (length(TRIM(BOTH FROM code)) <= 64))),
    CONSTRAINT review_reward_codes_discount_percent_check CHECK (((discount_percent > 0) AND (discount_percent <= 100))),
    CONSTRAINT review_reward_codes_status_check CHECK ((status = ANY (ARRAY['active'::text, 'used'::text, 'cancelled'::text]))),
    CONSTRAINT review_reward_codes_used_state_check CHECK ((((status = 'used'::text) AND (used_at IS NOT NULL)) OR (status <> 'used'::text)))
);


--
-- Name: review_reward_codes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.review_reward_codes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: review_reward_codes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.review_reward_codes_id_seq OWNED BY public.review_reward_codes.id;


--
-- Name: schedule_overrides; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schedule_overrides (
    override_date date NOT NULL,
    is_working_day boolean DEFAULT false NOT NULL,
    start_time time without time zone,
    end_time time without time zone,
    note text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT schedule_overrides_check CHECK ((((is_working_day = false) AND (start_time IS NULL) AND (end_time IS NULL)) OR ((is_working_day = true) AND (start_time IS NOT NULL) AND (end_time IS NOT NULL) AND (start_time < end_time))))
);


--
-- Name: schedule_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schedule_rules (
    weekday integer NOT NULL,
    is_enabled boolean DEFAULT false NOT NULL,
    start_time time without time zone DEFAULT '10:00:00'::time without time zone NOT NULL,
    end_time time without time zone DEFAULT '19:00:00'::time without time zone NOT NULL,
    CONSTRAINT schedule_rules_weekday_check CHECK (((weekday >= 1) AND (weekday <= 7)))
);


--
-- Name: service_package_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_package_plans (
    id bigint NOT NULL,
    service_id bigint NOT NULL,
    title text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    sessions_count integer NOT NULL,
    price numeric(10,2) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT service_package_plans_price_check CHECK ((price >= (0)::numeric)),
    CONSTRAINT service_package_plans_sessions_count_check CHECK ((sessions_count > 0))
);


--
-- Name: service_package_plans_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.service_package_plans_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: service_package_plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.service_package_plans_id_seq OWNED BY public.service_package_plans.id;


--
-- Name: services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.services (
    id bigint NOT NULL,
    title text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    price numeric(10,2) DEFAULT 0 NOT NULL,
    duration_minutes integer DEFAULT 60 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: services_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.services_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: services_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.services_id_seq OWNED BY public.services.id;


--
-- Name: session_reminder_deliveries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session_reminder_deliveries (
    id bigint NOT NULL,
    session_id integer NOT NULL,
    reminder_type text NOT NULL,
    channel text NOT NULL,
    status text NOT NULL,
    error_message text,
    sent_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT session_reminder_deliveries_channel_check CHECK ((channel = ANY (ARRAY['telegram'::text, 'owner_email'::text, 'client_email'::text]))),
    CONSTRAINT session_reminder_deliveries_reminder_type_check CHECK ((reminder_type = ANY (ARRAY['specialist_1h'::text, 'specialist_24h'::text, 'client_1h'::text, 'client_24h'::text]))),
    CONSTRAINT session_reminder_deliveries_status_check CHECK ((status = ANY (ARRAY['sent'::text, 'failed'::text, 'skipped'::text])))
);


--
-- Name: session_reminder_deliveries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.session_reminder_deliveries_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: session_reminder_deliveries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.session_reminder_deliveries_id_seq OWNED BY public.session_reminder_deliveries.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id bigint NOT NULL,
    client_id bigint NOT NULL,
    service_id bigint NOT NULL,
    scheduled_at timestamp with time zone NOT NULL,
    duration_minutes integer NOT NULL,
    price numeric(10,2) DEFAULT 0 NOT NULL,
    status text DEFAULT 'scheduled'::text NOT NULL,
    notes text DEFAULT ''::text NOT NULL,
    source text DEFAULT 'manual'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    client_package_id bigint
);


--
-- Name: sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sessions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sessions_id_seq OWNED BY public.sessions.id;


--
-- Name: blocked_slots id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blocked_slots ALTER COLUMN id SET DEFAULT nextval('public.blocked_slots_id_seq'::regclass);


--
-- Name: booking_payment_requests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_payment_requests ALTER COLUMN id SET DEFAULT nextval('public.booking_payment_requests_id_seq'::regclass);


--
-- Name: client_reviews id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_reviews ALTER COLUMN id SET DEFAULT nextval('public.client_reviews_id_seq'::regclass);


--
-- Name: client_service_packages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_service_packages ALTER COLUMN id SET DEFAULT nextval('public.client_service_packages_id_seq'::regclass);


--
-- Name: clients id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients ALTER COLUMN id SET DEFAULT nextval('public.clients_id_seq'::regclass);


--
-- Name: notes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes ALTER COLUMN id SET DEFAULT nextval('public.notes_id_seq'::regclass);


--
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- Name: rate_limits id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rate_limits ALTER COLUMN id SET DEFAULT nextval('public.rate_limits_id_seq'::regclass);


--
-- Name: requests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requests ALTER COLUMN id SET DEFAULT nextval('public.requests_id_seq'::regclass);


--
-- Name: review_reward_codes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_reward_codes ALTER COLUMN id SET DEFAULT nextval('public.review_reward_codes_id_seq'::regclass);


--
-- Name: service_package_plans id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_package_plans ALTER COLUMN id SET DEFAULT nextval('public.service_package_plans_id_seq'::regclass);


--
-- Name: services id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services ALTER COLUMN id SET DEFAULT nextval('public.services_id_seq'::regclass);


--
-- Name: session_reminder_deliveries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_reminder_deliveries ALTER COLUMN id SET DEFAULT nextval('public.session_reminder_deliveries_id_seq'::regclass);


--
-- Name: sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions ALTER COLUMN id SET DEFAULT nextval('public.sessions_id_seq'::regclass);


--
-- Name: blocked_slots blocked_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blocked_slots
    ADD CONSTRAINT blocked_slots_pkey PRIMARY KEY (id);


--
-- Name: booking_payment_requests booking_payment_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_payment_requests
    ADD CONSTRAINT booking_payment_requests_pkey PRIMARY KEY (id);


--
-- Name: booking_payment_requests booking_payment_requests_request_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_payment_requests
    ADD CONSTRAINT booking_payment_requests_request_id_key UNIQUE (request_id);


--
-- Name: booking_settings booking_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_settings
    ADD CONSTRAINT booking_settings_pkey PRIMARY KEY (id);


--
-- Name: client_reviews client_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_reviews
    ADD CONSTRAINT client_reviews_pkey PRIMARY KEY (id);


--
-- Name: client_service_packages client_service_packages_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_service_packages
    ADD CONSTRAINT client_service_packages_code_key UNIQUE (code);


--
-- Name: client_service_packages client_service_packages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_service_packages
    ADD CONSTRAINT client_service_packages_pkey PRIMARY KEY (id);


--
-- Name: clients clients_first_request_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_first_request_id_key UNIQUE (first_request_id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: notes notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: payments payments_provider_payment_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_provider_payment_id_key UNIQUE (provider_payment_id);


--
-- Name: payments payments_request_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_request_id_key UNIQUE (request_id);


--
-- Name: rate_limits rate_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rate_limits
    ADD CONSTRAINT rate_limits_pkey PRIMARY KEY (id);


--
-- Name: rate_limits rate_limits_unique_window; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rate_limits
    ADD CONSTRAINT rate_limits_unique_window UNIQUE (action_key, identifier_hash, window_start);


--
-- Name: requests requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requests
    ADD CONSTRAINT requests_pkey PRIMARY KEY (id);


--
-- Name: review_reward_codes review_reward_codes_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_reward_codes
    ADD CONSTRAINT review_reward_codes_code_key UNIQUE (code);


--
-- Name: review_reward_codes review_reward_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_reward_codes
    ADD CONSTRAINT review_reward_codes_pkey PRIMARY KEY (id);


--
-- Name: review_reward_codes review_reward_codes_review_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_reward_codes
    ADD CONSTRAINT review_reward_codes_review_id_key UNIQUE (review_id);


--
-- Name: schedule_overrides schedule_overrides_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_overrides
    ADD CONSTRAINT schedule_overrides_pkey PRIMARY KEY (override_date);


--
-- Name: schedule_rules schedule_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_rules
    ADD CONSTRAINT schedule_rules_pkey PRIMARY KEY (weekday);


--
-- Name: service_package_plans service_package_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_package_plans
    ADD CONSTRAINT service_package_plans_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: session_reminder_deliveries session_reminder_deliveries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_reminder_deliveries
    ADD CONSTRAINT session_reminder_deliveries_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: idx_blocked_slots_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blocked_slots_created_at ON public.blocked_slots USING btree (created_at DESC);


--
-- Name: idx_blocked_slots_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blocked_slots_date ON public.blocked_slots USING btree (blocked_date);


--
-- Name: idx_blocked_slots_unique_range; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_blocked_slots_unique_range ON public.blocked_slots USING btree (blocked_date, start_time, end_time);


--
-- Name: idx_client_reviews_client_id_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_reviews_client_id_created_at ON public.client_reviews USING btree (client_id, created_at DESC);


--
-- Name: idx_client_reviews_eligibility_session_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_reviews_eligibility_session_id ON public.client_reviews USING btree (eligibility_session_id) WHERE (eligibility_session_id IS NOT NULL);


--
-- Name: idx_client_reviews_public; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_reviews_public ON public.client_reviews USING btree (published_at DESC, id DESC) WHERE (status = 'published'::text);


--
-- Name: idx_client_reviews_public_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_reviews_public_order ON public.client_reviews USING btree (public_order, published_at DESC, created_at DESC, id DESC) WHERE ((status = 'published'::text) AND (deleted_at IS NULL));


--
-- Name: idx_client_reviews_status_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_reviews_status_created_at ON public.client_reviews USING btree (status, created_at DESC);


--
-- Name: idx_client_service_packages_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_service_packages_client_id ON public.client_service_packages USING btree (client_id);


--
-- Name: idx_client_service_packages_package_plan_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_service_packages_package_plan_id ON public.client_service_packages USING btree (package_plan_id);


--
-- Name: idx_client_service_packages_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_service_packages_status ON public.client_service_packages USING btree (status);


--
-- Name: idx_clients_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_created_at ON public.clients USING btree (created_at DESC);


--
-- Name: idx_clients_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_email ON public.clients USING btree (email);


--
-- Name: idx_clients_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_name ON public.clients USING btree (name);


--
-- Name: idx_clients_reviews_blocked_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_reviews_blocked_at ON public.clients USING btree (reviews_blocked_at) WHERE (reviews_blocked_at IS NOT NULL);


--
-- Name: idx_notes_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notes_client_id ON public.notes USING btree (client_id);


--
-- Name: idx_notes_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notes_created_at ON public.notes USING btree (created_at DESC);


--
-- Name: idx_notes_session_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notes_session_id ON public.notes USING btree (session_id);


--
-- Name: idx_requests_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_requests_client_id ON public.requests USING btree (client_id);


--
-- Name: idx_requests_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_requests_created_at ON public.requests USING btree (created_at DESC);


--
-- Name: idx_requests_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_requests_status ON public.requests USING btree (status);


--
-- Name: idx_review_reward_codes_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_review_reward_codes_client_id ON public.review_reward_codes USING btree (client_id);


--
-- Name: idx_review_reward_codes_status_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_review_reward_codes_status_created_at ON public.review_reward_codes USING btree (status, created_at DESC);


--
-- Name: idx_schedule_overrides_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_schedule_overrides_date ON public.schedule_overrides USING btree (override_date);


--
-- Name: idx_service_package_plans_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_service_package_plans_is_active ON public.service_package_plans USING btree (is_active);


--
-- Name: idx_service_package_plans_service_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_service_package_plans_service_id ON public.service_package_plans USING btree (service_id);


--
-- Name: idx_services_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_services_created_at ON public.services USING btree (created_at DESC);


--
-- Name: idx_services_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_services_is_active ON public.services USING btree (is_active);


--
-- Name: idx_services_title; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_services_title ON public.services USING btree (title);


--
-- Name: idx_sessions_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_client_id ON public.sessions USING btree (client_id);


--
-- Name: idx_sessions_client_package_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_client_package_id ON public.sessions USING btree (client_package_id);


--
-- Name: idx_sessions_scheduled_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_scheduled_at ON public.sessions USING btree (scheduled_at DESC);


--
-- Name: idx_sessions_service_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_service_id ON public.sessions USING btree (service_id);


--
-- Name: idx_sessions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_status ON public.sessions USING btree (status);


--
-- Name: payments_client_package_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payments_client_package_id_idx ON public.payments USING btree (client_package_id);


--
-- Name: payments_payment_kind_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payments_payment_kind_idx ON public.payments USING btree (payment_kind);


--
-- Name: payments_provider_payment_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payments_provider_payment_id_idx ON public.payments USING btree (provider_payment_id);


--
-- Name: payments_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payments_status_idx ON public.payments USING btree (status);


--
-- Name: rate_limits_action_window_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX rate_limits_action_window_idx ON public.rate_limits USING btree (action_key, window_start);


--
-- Name: rate_limits_updated_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX rate_limits_updated_at_idx ON public.rate_limits USING btree (updated_at);


--
-- Name: requests_unviewed_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX requests_unviewed_created_at_idx ON public.requests USING btree (created_at DESC) WHERE (viewed_at IS NULL);


--
-- Name: requests_viewed_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX requests_viewed_at_idx ON public.requests USING btree (viewed_at);


--
-- Name: session_reminder_unique_delivery_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX session_reminder_unique_delivery_idx ON public.session_reminder_deliveries USING btree (session_id, reminder_type, channel);


--
-- Name: ux_review_reward_codes_one_non_cancelled_per_client; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_review_reward_codes_one_non_cancelled_per_client ON public.review_reward_codes USING btree (client_id) WHERE (status <> 'cancelled'::text);


--
-- Name: client_reviews client_reviews_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_reviews
    ADD CONSTRAINT client_reviews_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: client_reviews client_reviews_eligibility_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_reviews
    ADD CONSTRAINT client_reviews_eligibility_session_id_fkey FOREIGN KEY (eligibility_session_id) REFERENCES public.sessions(id) ON DELETE SET NULL;


--
-- Name: client_service_packages client_service_packages_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_service_packages
    ADD CONSTRAINT client_service_packages_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE RESTRICT;


--
-- Name: client_service_packages client_service_packages_package_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_service_packages
    ADD CONSTRAINT client_service_packages_package_plan_id_fkey FOREIGN KEY (package_plan_id) REFERENCES public.service_package_plans(id) ON DELETE RESTRICT;


--
-- Name: clients clients_first_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_first_request_id_fkey FOREIGN KEY (first_request_id) REFERENCES public.requests(id) ON DELETE SET NULL;


--
-- Name: notes notes_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: notes notes_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE SET NULL;


--
-- Name: payments payments_client_package_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_client_package_id_fkey FOREIGN KEY (client_package_id) REFERENCES public.client_service_packages(id) ON DELETE SET NULL;


--
-- Name: payments payments_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE SET NULL;


--
-- Name: requests requests_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requests
    ADD CONSTRAINT requests_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;


--
-- Name: review_reward_codes review_reward_codes_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_reward_codes
    ADD CONSTRAINT review_reward_codes_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: review_reward_codes review_reward_codes_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_reward_codes
    ADD CONSTRAINT review_reward_codes_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.client_reviews(id) ON DELETE CASCADE;


--
-- Name: service_package_plans service_package_plans_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_package_plans
    ADD CONSTRAINT service_package_plans_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE RESTRICT;


--
-- Name: session_reminder_deliveries session_reminder_deliveries_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_reminder_deliveries
    ADD CONSTRAINT session_reminder_deliveries_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE RESTRICT;


--
-- Name: sessions sessions_client_package_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_client_package_id_fkey FOREIGN KEY (client_package_id) REFERENCES public.client_service_packages(id) ON DELETE SET NULL;


--
-- Name: sessions sessions_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--


