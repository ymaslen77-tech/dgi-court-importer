-- Auto-derived from disposable Payload CMS CI schema (PostgreSQL 17).
-- Generated for dedicated blank Neon dgi_cms database; do not run against a populated CMS.
-- No private content or secrets included.
CREATE TYPE public.enum__editorial_entries_v_version_blocks_kind AS ENUM (
    'h1',
    'h2',
    'h3',
    'h4',
    'p',
    'link'
);


--
-- Name: enum__editorial_entries_v_version_kind; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum__editorial_entries_v_version_kind AS ENUM (
    'landing',
    'guide',
    'news',
    'normative',
    'situation'
);


--
-- Name: enum__editorial_entries_v_version_review_state; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum__editorial_entries_v_version_review_state AS ENUM (
    'needs-review',
    'approved'
);


--
-- Name: enum__editorial_entries_v_version_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum__editorial_entries_v_version_status AS ENUM (
    'draft',
    'published'
);


--
-- Name: enum_court_references_verification; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_court_references_verification AS ENUM (
    'metadata-only',
    'source-checked'
);


--
-- Name: enum_editorial_entries_blocks_kind; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_editorial_entries_blocks_kind AS ENUM (
    'h1',
    'h2',
    'h3',
    'h4',
    'p',
    'link'
);


--
-- Name: enum_editorial_entries_kind; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_editorial_entries_kind AS ENUM (
    'landing',
    'guide',
    'news',
    'normative',
    'situation'
);


--
-- Name: enum_editorial_entries_review_state; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_editorial_entries_review_state AS ENUM (
    'needs-review',
    'approved'
);


--
-- Name: enum_editorial_entries_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_editorial_entries_status AS ENUM (
    'draft',
    'published'
);


--
-- Name: enum_staff_users_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_staff_users_role AS ENUM (
    'admin',
    'editor',
    'reviewer',
    'publisher'
);


--
-- Name: enum_webflow_cms_review_legacy_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_webflow_cms_review_legacy_status AS ENUM (
    'legacy_public_unverified',
    'draft'
);


--
-- Name: enum_webflow_cms_review_reconciliation_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_webflow_cms_review_reconciliation_status AS ENUM (
    'pending',
    'reconciled'
);


--
-- Name: enum_webflow_cms_review_source_collection; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_webflow_cms_review_source_collection AS ENUM (
    'dgi-court-cases',
    'dgi-legal-documents',
    'dgi-legal-situations',
    'housing-law-news'
);


--
-- Name: enum_webflow_private_sources_source_collection; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_webflow_private_sources_source_collection AS ENUM (
    'dgi-court-cases',
    'dgi-legal-documents',
    'dgi-legal-situations',
    'housing-law-news'
);


--
-- Name: enum_webflow_private_sources_source_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_webflow_private_sources_source_status AS ENUM (
    'draft',
    'legacy_public_unverified'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _editorial_entries_v; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._editorial_entries_v (
    id integer NOT NULL,
    parent_id integer,
    version_kind public.enum__editorial_entries_v_version_kind,
    version_slug character varying,
    version_title character varying,
    version_description character varying,
    version_seo_title character varying,
    version_seo_description character varying,
    version_review_state public.enum__editorial_entries_v_version_review_state DEFAULT 'needs-review'::public.enum__editorial_entries_v_version_review_state,
    version_reviewed_by character varying,
    version_reviewed_at timestamp(3) with time zone,
    version_updated_at timestamp(3) with time zone,
    version_created_at timestamp(3) with time zone,
    version__status public.enum__editorial_entries_v_version_status DEFAULT 'draft'::public.enum__editorial_entries_v_version_status,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    latest boolean
);


--
-- Name: _editorial_entries_v_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public._editorial_entries_v_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: _editorial_entries_v_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public._editorial_entries_v_id_seq OWNED BY public._editorial_entries_v.id;


--
-- Name: _editorial_entries_v_version_blocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._editorial_entries_v_version_blocks (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id integer NOT NULL,
    kind public.enum__editorial_entries_v_version_blocks_kind,
    text character varying,
    href character varying,
    _uuid character varying
);


--
-- Name: _editorial_entries_v_version_blocks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public._editorial_entries_v_version_blocks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: _editorial_entries_v_version_blocks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public._editorial_entries_v_version_blocks_id_seq OWNED BY public._editorial_entries_v_version_blocks.id;


--
-- Name: _editorial_entries_v_version_source_urls; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._editorial_entries_v_version_source_urls (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id integer NOT NULL,
    url character varying,
    _uuid character varying
);


--
-- Name: _editorial_entries_v_version_source_urls_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public._editorial_entries_v_version_source_urls_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: _editorial_entries_v_version_source_urls_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public._editorial_entries_v_version_source_urls_id_seq OWNED BY public._editorial_entries_v_version_source_urls.id;


--
-- Name: court_references; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.court_references (
    id integer NOT NULL,
    case_number character varying NOT NULL,
    court_name character varying NOT NULL,
    uid character varying,
    category character varying,
    official_url character varying,
    verification public.enum_court_references_verification DEFAULT 'metadata-only'::public.enum_court_references_verification NOT NULL,
    checked_at timestamp(3) with time zone,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL
);


--
-- Name: court_references_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.court_references_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: court_references_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.court_references_id_seq OWNED BY public.court_references.id;


--
-- Name: editorial_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.editorial_entries (
    id integer NOT NULL,
    kind public.enum_editorial_entries_kind,
    slug character varying,
    title character varying,
    description character varying,
    seo_title character varying,
    seo_description character varying,
    review_state public.enum_editorial_entries_review_state DEFAULT 'needs-review'::public.enum_editorial_entries_review_state,
    reviewed_by character varying,
    reviewed_at timestamp(3) with time zone,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    _status public.enum_editorial_entries_status DEFAULT 'draft'::public.enum_editorial_entries_status
);


--
-- Name: editorial_entries_blocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.editorial_entries_blocks (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id character varying NOT NULL,
    kind public.enum_editorial_entries_blocks_kind,
    text character varying,
    href character varying
);


--
-- Name: editorial_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.editorial_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: editorial_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.editorial_entries_id_seq OWNED BY public.editorial_entries.id;


--
-- Name: editorial_entries_source_urls; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.editorial_entries_source_urls (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id character varying NOT NULL,
    url character varying
);


--
-- Name: media; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.media (
    id integer NOT NULL,
    alt character varying NOT NULL,
    original_source character varying NOT NULL,
    rights_note character varying NOT NULL,
    rights_verified boolean DEFAULT false,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    url character varying,
    thumbnail_u_r_l character varying,
    filename character varying,
    mime_type character varying,
    filesize numeric,
    width numeric,
    height numeric,
    focal_x numeric,
    focal_y numeric
);


--
-- Name: media_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.media_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.media_id_seq OWNED BY public.media.id;


--
-- Name: payload_kv; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payload_kv (
    id integer NOT NULL,
    key character varying NOT NULL,
    data jsonb NOT NULL
);


--
-- Name: payload_kv_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payload_kv_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payload_kv_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payload_kv_id_seq OWNED BY public.payload_kv.id;


--
-- Name: payload_locked_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payload_locked_documents (
    id integer NOT NULL,
    global_slug character varying,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL
);


--
-- Name: payload_locked_documents_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payload_locked_documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payload_locked_documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payload_locked_documents_id_seq OWNED BY public.payload_locked_documents.id;


--
-- Name: payload_locked_documents_rels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payload_locked_documents_rels (
    id integer NOT NULL,
    "order" integer,
    parent_id integer NOT NULL,
    path character varying NOT NULL,
    staff_users_id integer,
    editorial_entries_id integer,
    court_references_id integer,
    media_id integer,
    webflow_cms_review_id integer,
    webflow_private_sources_id integer
);


--
-- Name: payload_locked_documents_rels_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payload_locked_documents_rels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payload_locked_documents_rels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payload_locked_documents_rels_id_seq OWNED BY public.payload_locked_documents_rels.id;


--
-- Name: payload_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payload_migrations (
    id integer NOT NULL,
    name character varying,
    batch numeric,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL
);


--
-- Name: payload_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payload_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payload_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payload_migrations_id_seq OWNED BY public.payload_migrations.id;


--
-- Name: payload_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payload_preferences (
    id integer NOT NULL,
    key character varying,
    value jsonb,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL
);


--
-- Name: payload_preferences_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payload_preferences_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payload_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payload_preferences_id_seq OWNED BY public.payload_preferences.id;


--
-- Name: payload_preferences_rels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payload_preferences_rels (
    id integer NOT NULL,
    "order" integer,
    parent_id integer NOT NULL,
    path character varying NOT NULL,
    staff_users_id integer
);


--
-- Name: payload_preferences_rels_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payload_preferences_rels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payload_preferences_rels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payload_preferences_rels_id_seq OWNED BY public.payload_preferences_rels.id;


--
-- Name: staff_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.staff_users (
    id integer NOT NULL,
    role public.enum_staff_users_role DEFAULT 'editor'::public.enum_staff_users_role NOT NULL,
    display_name character varying NOT NULL,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    email character varying NOT NULL,
    reset_password_token character varying,
    reset_password_expiration timestamp(3) with time zone,
    salt character varying,
    hash character varying,
    reset_password_requested_at timestamp(3) with time zone,
    login_attempts numeric DEFAULT 0,
    lock_until timestamp(3) with time zone
);


--
-- Name: staff_users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.staff_users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: staff_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.staff_users_id_seq OWNED BY public.staff_users.id;


--
-- Name: staff_users_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.staff_users_sessions (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id character varying NOT NULL,
    created_at timestamp(3) with time zone,
    expires_at timestamp(3) with time zone NOT NULL
);


--
-- Name: webflow_cms_review; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.webflow_cms_review (
    id integer NOT NULL,
    source_key character varying NOT NULL,
    source_collection public.enum_webflow_cms_review_source_collection NOT NULL,
    source_item_id character varying NOT NULL,
    source_slug character varying NOT NULL,
    title character varying NOT NULL,
    legacy_status public.enum_webflow_cms_review_legacy_status NOT NULL,
    source_metadata jsonb NOT NULL,
    editorial_note character varying,
    reconciliation_status public.enum_webflow_cms_review_reconciliation_status DEFAULT 'pending'::public.enum_webflow_cms_review_reconciliation_status NOT NULL,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL
);


--
-- Name: webflow_cms_review_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.webflow_cms_review_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: webflow_cms_review_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.webflow_cms_review_id_seq OWNED BY public.webflow_cms_review.id;


--
-- Name: webflow_private_sources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.webflow_private_sources (
    id integer NOT NULL,
    source_key character varying NOT NULL,
    source_collection public.enum_webflow_private_sources_source_collection NOT NULL,
    source_item_id character varying NOT NULL,
    source_slug character varying NOT NULL,
    source_status public.enum_webflow_private_sources_source_status NOT NULL,
    source_updated_at timestamp(3) with time zone,
    source_digest character varying NOT NULL,
    source_fields jsonb NOT NULL,
    editorial_note character varying,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL
);


--
-- Name: webflow_private_sources_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.webflow_private_sources_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: webflow_private_sources_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.webflow_private_sources_id_seq OWNED BY public.webflow_private_sources.id;


--
-- Name: _editorial_entries_v id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._editorial_entries_v ALTER COLUMN id SET DEFAULT nextval('public._editorial_entries_v_id_seq'::regclass);


--
-- Name: _editorial_entries_v_version_blocks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._editorial_entries_v_version_blocks ALTER COLUMN id SET DEFAULT nextval('public._editorial_entries_v_version_blocks_id_seq'::regclass);


--
-- Name: _editorial_entries_v_version_source_urls id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._editorial_entries_v_version_source_urls ALTER COLUMN id SET DEFAULT nextval('public._editorial_entries_v_version_source_urls_id_seq'::regclass);


--
-- Name: court_references id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.court_references ALTER COLUMN id SET DEFAULT nextval('public.court_references_id_seq'::regclass);


--
-- Name: editorial_entries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.editorial_entries ALTER COLUMN id SET DEFAULT nextval('public.editorial_entries_id_seq'::regclass);


--
-- Name: media id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media ALTER COLUMN id SET DEFAULT nextval('public.media_id_seq'::regclass);


--
-- Name: payload_kv id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payload_kv ALTER COLUMN id SET DEFAULT nextval('public.payload_kv_id_seq'::regclass);


--
-- Name: payload_locked_documents id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payload_locked_documents ALTER COLUMN id SET DEFAULT nextval('public.payload_locked_documents_id_seq'::regclass);


--
-- Name: payload_locked_documents_rels id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payload_locked_documents_rels ALTER COLUMN id SET DEFAULT nextval('public.payload_locked_documents_rels_id_seq'::regclass);


--
-- Name: payload_migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payload_migrations ALTER COLUMN id SET DEFAULT nextval('public.payload_migrations_id_seq'::regclass);


--
-- Name: payload_preferences id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payload_preferences ALTER COLUMN id SET DEFAULT nextval('public.payload_preferences_id_seq'::regclass);


--
-- Name: payload_preferences_rels id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payload_preferences_rels ALTER COLUMN id SET DEFAULT nextval('public.payload_preferences_rels_id_seq'::regclass);


--
-- Name: staff_users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_users ALTER COLUMN id SET DEFAULT nextval('public.staff_users_id_seq'::regclass);


--
-- Name: webflow_cms_review id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webflow_cms_review ALTER COLUMN id SET DEFAULT nextval('public.webflow_cms_review_id_seq'::regclass);


--
-- Name: webflow_private_sources id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webflow_private_sources ALTER COLUMN id SET DEFAULT nextval('public.webflow_private_sources_id_seq'::regclass);


--
-- Name: _editorial_entries_v _editorial_entries_v_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._editorial_entries_v
    ADD CONSTRAINT _editorial_entries_v_pkey PRIMARY KEY (id);


--
-- Name: _editorial_entries_v_version_blocks _editorial_entries_v_version_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._editorial_entries_v_version_blocks
    ADD CONSTRAINT _editorial_entries_v_version_blocks_pkey PRIMARY KEY (id);


--
-- Name: _editorial_entries_v_version_source_urls _editorial_entries_v_version_source_urls_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._editorial_entries_v_version_source_urls
    ADD CONSTRAINT _editorial_entries_v_version_source_urls_pkey PRIMARY KEY (id);


--
-- Name: court_references court_references_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.court_references
    ADD CONSTRAINT court_references_pkey PRIMARY KEY (id);


--
-- Name: editorial_entries_blocks editorial_entries_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.editorial_entries_blocks
    ADD CONSTRAINT editorial_entries_blocks_pkey PRIMARY KEY (id);


--
-- Name: editorial_entries editorial_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.editorial_entries
    ADD CONSTRAINT editorial_entries_pkey PRIMARY KEY (id);


--
-- Name: editorial_entries_source_urls editorial_entries_source_urls_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.editorial_entries_source_urls
    ADD CONSTRAINT editorial_entries_source_urls_pkey PRIMARY KEY (id);


--
-- Name: media media_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_pkey PRIMARY KEY (id);


--
-- Name: payload_kv payload_kv_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payload_kv
    ADD CONSTRAINT payload_kv_pkey PRIMARY KEY (id);


--
-- Name: payload_locked_documents payload_locked_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payload_locked_documents
    ADD CONSTRAINT payload_locked_documents_pkey PRIMARY KEY (id);


--
-- Name: payload_locked_documents_rels payload_locked_documents_rels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payload_locked_documents_rels
    ADD CONSTRAINT payload_locked_documents_rels_pkey PRIMARY KEY (id);


--
-- Name: payload_migrations payload_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payload_migrations
    ADD CONSTRAINT payload_migrations_pkey PRIMARY KEY (id);


--
-- Name: payload_preferences payload_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payload_preferences
    ADD CONSTRAINT payload_preferences_pkey PRIMARY KEY (id);


--
-- Name: payload_preferences_rels payload_preferences_rels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payload_preferences_rels
    ADD CONSTRAINT payload_preferences_rels_pkey PRIMARY KEY (id);


--
-- Name: staff_users staff_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_users
    ADD CONSTRAINT staff_users_pkey PRIMARY KEY (id);


--
-- Name: staff_users_sessions staff_users_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_users_sessions
    ADD CONSTRAINT staff_users_sessions_pkey PRIMARY KEY (id);


--
-- Name: webflow_cms_review webflow_cms_review_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webflow_cms_review
    ADD CONSTRAINT webflow_cms_review_pkey PRIMARY KEY (id);


--
-- Name: webflow_private_sources webflow_private_sources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webflow_private_sources
    ADD CONSTRAINT webflow_private_sources_pkey PRIMARY KEY (id);


--
-- Name: _editorial_entries_v_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX _editorial_entries_v_created_at_idx ON public._editorial_entries_v USING btree (created_at);


--
-- Name: _editorial_entries_v_latest_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX _editorial_entries_v_latest_idx ON public._editorial_entries_v USING btree (latest);


--
-- Name: _editorial_entries_v_parent_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX _editorial_entries_v_parent_idx ON public._editorial_entries_v USING btree (parent_id);


--
-- Name: _editorial_entries_v_updated_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX _editorial_entries_v_updated_at_idx ON public._editorial_entries_v USING btree (updated_at);


--
-- Name: _editorial_entries_v_version_blocks_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX _editorial_entries_v_version_blocks_order_idx ON public._editorial_entries_v_version_blocks USING btree (_order);


--
-- Name: _editorial_entries_v_version_blocks_parent_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX _editorial_entries_v_version_blocks_parent_id_idx ON public._editorial_entries_v_version_blocks USING btree (_parent_id);


--
-- Name: _editorial_entries_v_version_source_urls_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX _editorial_entries_v_version_source_urls_order_idx ON public._editorial_entries_v_version_source_urls USING btree (_order);


--
-- Name: _editorial_entries_v_version_source_urls_parent_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX _editorial_entries_v_version_source_urls_parent_id_idx ON public._editorial_entries_v_version_source_urls USING btree (_parent_id);


--
-- Name: _editorial_entries_v_version_version__status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX _editorial_entries_v_version_version__status_idx ON public._editorial_entries_v USING btree (version__status);


--
-- Name: _editorial_entries_v_version_version_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX _editorial_entries_v_version_version_created_at_idx ON public._editorial_entries_v USING btree (version_created_at);


--
-- Name: _editorial_entries_v_version_version_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX _editorial_entries_v_version_version_slug_idx ON public._editorial_entries_v USING btree (version_slug);


--
-- Name: _editorial_entries_v_version_version_updated_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX _editorial_entries_v_version_version_updated_at_idx ON public._editorial_entries_v USING btree (version_updated_at);


--
-- Name: court_references_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX court_references_created_at_idx ON public.court_references USING btree (created_at);


--
-- Name: court_references_updated_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX court_references_updated_at_idx ON public.court_references USING btree (updated_at);


--
-- Name: editorial_entries__status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX editorial_entries__status_idx ON public.editorial_entries USING btree (_status);


--
-- Name: editorial_entries_blocks_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX editorial_entries_blocks_order_idx ON public.editorial_entries_blocks USING btree (_order);


--
-- Name: editorial_entries_blocks_parent_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX editorial_entries_blocks_parent_id_idx ON public.editorial_entries_blocks USING btree (_parent_id);


--
-- Name: editorial_entries_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX editorial_entries_created_at_idx ON public.editorial_entries USING btree (created_at);


--
-- Name: editorial_entries_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX editorial_entries_slug_idx ON public.editorial_entries USING btree (slug);


--
-- Name: editorial_entries_source_urls_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX editorial_entries_source_urls_order_idx ON public.editorial_entries_source_urls USING btree (_order);


--
-- Name: editorial_entries_source_urls_parent_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX editorial_entries_source_urls_parent_id_idx ON public.editorial_entries_source_urls USING btree (_parent_id);


--
-- Name: editorial_entries_updated_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX editorial_entries_updated_at_idx ON public.editorial_entries USING btree (updated_at);


--
-- Name: media_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX media_created_at_idx ON public.media USING btree (created_at);


--
-- Name: media_filename_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX media_filename_idx ON public.media USING btree (filename);


--
-- Name: media_updated_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX media_updated_at_idx ON public.media USING btree (updated_at);


--
-- Name: payload_kv_key_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX payload_kv_key_idx ON public.payload_kv USING btree (key);


--
-- Name: payload_locked_documents_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payload_locked_documents_created_at_idx ON public.payload_locked_documents USING btree (created_at);


--
-- Name: payload_locked_documents_global_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payload_locked_documents_global_slug_idx ON public.payload_locked_documents USING btree (global_slug);


--
-- Name: payload_locked_documents_rels_court_references_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payload_locked_documents_rels_court_references_id_idx ON public.payload_locked_documents_rels USING btree (court_references_id);


--
-- Name: payload_locked_documents_rels_editorial_entries_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payload_locked_documents_rels_editorial_entries_id_idx ON public.payload_locked_documents_rels USING btree (editorial_entries_id);


--
-- Name: payload_locked_documents_rels_media_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payload_locked_documents_rels_media_id_idx ON public.payload_locked_documents_rels USING btree (media_id);


--
-- Name: payload_locked_documents_rels_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payload_locked_documents_rels_order_idx ON public.payload_locked_documents_rels USING btree ("order");


--
-- Name: payload_locked_documents_rels_parent_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payload_locked_documents_rels_parent_idx ON public.payload_locked_documents_rels USING btree (parent_id);


--
-- Name: payload_locked_documents_rels_path_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payload_locked_documents_rels_path_idx ON public.payload_locked_documents_rels USING btree (path);


--
-- Name: payload_locked_documents_rels_staff_users_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payload_locked_documents_rels_staff_users_id_idx ON public.payload_locked_documents_rels USING btree (staff_users_id);


--
-- Name: payload_locked_documents_rels_webflow_cms_review_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payload_locked_documents_rels_webflow_cms_review_id_idx ON public.payload_locked_documents_rels USING btree (webflow_cms_review_id);


--
-- Name: payload_locked_documents_rels_webflow_private_sources_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payload_locked_documents_rels_webflow_private_sources_id_idx ON public.payload_locked_documents_rels USING btree (webflow_private_sources_id);


--
-- Name: payload_locked_documents_updated_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payload_locked_documents_updated_at_idx ON public.payload_locked_documents USING btree (updated_at);


--
-- Name: payload_migrations_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payload_migrations_created_at_idx ON public.payload_migrations USING btree (created_at);


--
-- Name: payload_migrations_updated_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payload_migrations_updated_at_idx ON public.payload_migrations USING btree (updated_at);


--
-- Name: payload_preferences_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payload_preferences_created_at_idx ON public.payload_preferences USING btree (created_at);


--
-- Name: payload_preferences_key_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payload_preferences_key_idx ON public.payload_preferences USING btree (key);


--
-- Name: payload_preferences_rels_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payload_preferences_rels_order_idx ON public.payload_preferences_rels USING btree ("order");


--
-- Name: payload_preferences_rels_parent_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payload_preferences_rels_parent_idx ON public.payload_preferences_rels USING btree (parent_id);


--
-- Name: payload_preferences_rels_path_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payload_preferences_rels_path_idx ON public.payload_preferences_rels USING btree (path);


--
-- Name: payload_preferences_rels_staff_users_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payload_preferences_rels_staff_users_id_idx ON public.payload_preferences_rels USING btree (staff_users_id);


--
-- Name: payload_preferences_updated_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payload_preferences_updated_at_idx ON public.payload_preferences USING btree (updated_at);


--
-- Name: staff_users_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX staff_users_created_at_idx ON public.staff_users USING btree (created_at);


--
-- Name: staff_users_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX staff_users_email_idx ON public.staff_users USING btree (email);


--
-- Name: staff_users_sessions_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX staff_users_sessions_order_idx ON public.staff_users_sessions USING btree (_order);


--
-- Name: staff_users_sessions_parent_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX staff_users_sessions_parent_id_idx ON public.staff_users_sessions USING btree (_parent_id);


--
-- Name: staff_users_updated_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX staff_users_updated_at_idx ON public.staff_users USING btree (updated_at);


--
-- Name: webflow_cms_review_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX webflow_cms_review_created_at_idx ON public.webflow_cms_review USING btree (created_at);


--
-- Name: webflow_cms_review_source_key_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX webflow_cms_review_source_key_idx ON public.webflow_cms_review USING btree (source_key);


--
-- Name: webflow_cms_review_updated_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX webflow_cms_review_updated_at_idx ON public.webflow_cms_review USING btree (updated_at);


--
-- Name: webflow_private_sources_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX webflow_private_sources_created_at_idx ON public.webflow_private_sources USING btree (created_at);


--
-- Name: webflow_private_sources_source_key_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX webflow_private_sources_source_key_idx ON public.webflow_private_sources USING btree (source_key);


--
-- Name: webflow_private_sources_updated_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX webflow_private_sources_updated_at_idx ON public.webflow_private_sources USING btree (updated_at);


--
-- Name: _editorial_entries_v _editorial_entries_v_parent_id_editorial_entries_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._editorial_entries_v
    ADD CONSTRAINT _editorial_entries_v_parent_id_editorial_entries_id_fk FOREIGN KEY (parent_id) REFERENCES public.editorial_entries(id) ON DELETE SET NULL;


--
-- Name: _editorial_entries_v_version_blocks _editorial_entries_v_version_blocks_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._editorial_entries_v_version_blocks
    ADD CONSTRAINT _editorial_entries_v_version_blocks_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public._editorial_entries_v(id) ON DELETE CASCADE;


--
-- Name: _editorial_entries_v_version_source_urls _editorial_entries_v_version_source_urls_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._editorial_entries_v_version_source_urls
    ADD CONSTRAINT _editorial_entries_v_version_source_urls_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public._editorial_entries_v(id) ON DELETE CASCADE;


--
-- Name: editorial_entries_blocks editorial_entries_blocks_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.editorial_entries_blocks
    ADD CONSTRAINT editorial_entries_blocks_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.editorial_entries(id) ON DELETE CASCADE;


--
-- Name: editorial_entries_source_urls editorial_entries_source_urls_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.editorial_entries_source_urls
    ADD CONSTRAINT editorial_entries_source_urls_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.editorial_entries(id) ON DELETE CASCADE;


--
-- Name: payload_locked_documents_rels payload_locked_documents_rels_court_references_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payload_locked_documents_rels
    ADD CONSTRAINT payload_locked_documents_rels_court_references_fk FOREIGN KEY (court_references_id) REFERENCES public.court_references(id) ON DELETE CASCADE;


--
-- Name: payload_locked_documents_rels payload_locked_documents_rels_editorial_entries_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payload_locked_documents_rels
    ADD CONSTRAINT payload_locked_documents_rels_editorial_entries_fk FOREIGN KEY (editorial_entries_id) REFERENCES public.editorial_entries(id) ON DELETE CASCADE;


--
-- Name: payload_locked_documents_rels payload_locked_documents_rels_media_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payload_locked_documents_rels
    ADD CONSTRAINT payload_locked_documents_rels_media_fk FOREIGN KEY (media_id) REFERENCES public.media(id) ON DELETE CASCADE;


--
-- Name: payload_locked_documents_rels payload_locked_documents_rels_parent_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payload_locked_documents_rels
    ADD CONSTRAINT payload_locked_documents_rels_parent_fk FOREIGN KEY (parent_id) REFERENCES public.payload_locked_documents(id) ON DELETE CASCADE;


--
-- Name: payload_locked_documents_rels payload_locked_documents_rels_staff_users_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payload_locked_documents_rels
    ADD CONSTRAINT payload_locked_documents_rels_staff_users_fk FOREIGN KEY (staff_users_id) REFERENCES public.staff_users(id) ON DELETE CASCADE;


--
-- Name: payload_locked_documents_rels payload_locked_documents_rels_webflow_cms_review_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payload_locked_documents_rels
    ADD CONSTRAINT payload_locked_documents_rels_webflow_cms_review_fk FOREIGN KEY (webflow_cms_review_id) REFERENCES public.webflow_cms_review(id) ON DELETE CASCADE;


--
-- Name: payload_locked_documents_rels payload_locked_documents_rels_webflow_private_sources_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payload_locked_documents_rels
    ADD CONSTRAINT payload_locked_documents_rels_webflow_private_sources_fk FOREIGN KEY (webflow_private_sources_id) REFERENCES public.webflow_private_sources(id) ON DELETE CASCADE;


--
-- Name: payload_preferences_rels payload_preferences_rels_parent_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payload_preferences_rels
    ADD CONSTRAINT payload_preferences_rels_parent_fk FOREIGN KEY (parent_id) REFERENCES public.payload_preferences(id) ON DELETE CASCADE;


--
-- Name: payload_preferences_rels payload_preferences_rels_staff_users_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payload_preferences_rels
    ADD CONSTRAINT payload_preferences_rels_staff_users_fk FOREIGN KEY (staff_users_id) REFERENCES public.staff_users(id) ON DELETE CASCADE;


--
-- Name: staff_users_sessions staff_users_sessions_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_users_sessions
    ADD CONSTRAINT staff_users_sessions_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.staff_users(id) ON DELETE CASCADE;





