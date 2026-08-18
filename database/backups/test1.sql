--
-- PostgreSQL database dump
--

-- Dumped from database version 17.10 (Debian 17.10-1.pgdg13+1)
-- Dumped by pg_dump version 17.0

-- Started on 2026-08-18 18:16:50 UTC

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
-- TOC entry 2 (class 3079 OID 16398)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 3531 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 223 (class 1259 OID 16513)
-- Name: camera_status_logs; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.camera_status_logs (
    status_log_id uuid DEFAULT gen_random_uuid() NOT NULL,
    camera_id uuid NOT NULL,
    status character varying(20) NOT NULL,
    log_time timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT camera_status_logs_status_check CHECK (((status)::text = ANY ((ARRAY['ONLINE'::character varying, 'OFFLINE'::character varying, 'MAINTENANCE'::character varying])::text[])))
);


ALTER TABLE public.camera_status_logs OWNER TO admin;

--
-- TOC entry 219 (class 1259 OID 16446)
-- Name: cameras; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.cameras (
    camera_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    camera_name character varying(100) NOT NULL,
    location character varying(255),
    ip_address character varying(50),
    device_serial character varying(100),
    model_version character varying(50),
    status character varying(20) DEFAULT 'OFFLINE'::character varying NOT NULL,
    last_seen timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT cameras_status_check CHECK (((status)::text = ANY ((ARRAY['ONLINE'::character varying, 'OFFLINE'::character varying, 'MAINTENANCE'::character varying])::text[])))
);


ALTER TABLE public.cameras OWNER TO admin;

--
-- TOC entry 220 (class 1259 OID 16463)
-- Name: detection_events; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.detection_events (
    event_id uuid DEFAULT gen_random_uuid() NOT NULL,
    camera_id uuid NOT NULL,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone,
    detection_type character varying(20) NOT NULL,
    confidence numeric(5,2) NOT NULL,
    severity character varying(20),
    alert_sent boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT detection_events_confidence_check CHECK (((confidence >= (0)::numeric) AND (confidence <= (100)::numeric))),
    CONSTRAINT detection_events_detection_type_check CHECK (((detection_type)::text = ANY ((ARRAY['FIRE'::character varying, 'SMOKE'::character varying, 'FIRE_SMOKE'::character varying])::text[]))),
    CONSTRAINT detection_events_severity_check CHECK (((severity)::text = ANY ((ARRAY['LOW'::character varying, 'MEDIUM'::character varying, 'HIGH'::character varying, 'CRITICAL'::character varying])::text[])))
);


ALTER TABLE public.detection_events OWNER TO admin;

--
-- TOC entry 221 (class 1259 OID 16479)
-- Name: images; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.images (
    image_id uuid DEFAULT gen_random_uuid() NOT NULL,
    camera_id uuid NOT NULL,
    event_id uuid,
    image_type character varying(20) NOT NULL,
    image_path character varying(255) NOT NULL,
    capture_time timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT images_image_type_check CHECK (((image_type)::text = ANY ((ARRAY['SNAPSHOT'::character varying, 'EVENT'::character varying])::text[])))
);


ALTER TABLE public.images OWNER TO admin;

--
-- TOC entry 222 (class 1259 OID 16497)
-- Name: notification_logs; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.notification_logs (
    notification_id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    platform character varying(30) NOT NULL,
    status character varying(20) NOT NULL,
    sent_time timestamp with time zone DEFAULT now() NOT NULL,
    response text,
    CONSTRAINT notification_logs_platform_check CHECK (((platform)::text = 'DISCORD'::text)),
    CONSTRAINT notification_logs_status_check CHECK (((status)::text = ANY ((ARRAY['SUCCESS'::character varying, 'FAILED'::character varying, 'RETRY'::character varying])::text[])))
);


ALTER TABLE public.notification_logs OWNER TO admin;

--
-- TOC entry 218 (class 1259 OID 16435)
-- Name: users; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.users (
    user_id uuid DEFAULT gen_random_uuid() NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(20) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['ADMIN'::character varying, 'USER'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO admin;

--
-- TOC entry 3525 (class 0 OID 16513)
-- Dependencies: 223
-- Data for Name: camera_status_logs; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.camera_status_logs (status_log_id, camera_id, status, log_time) FROM stdin;
\.


--
-- TOC entry 3521 (class 0 OID 16446)
-- Dependencies: 219
-- Data for Name: cameras; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.cameras (camera_id, user_id, camera_name, location, ip_address, device_serial, model_version, status, last_seen, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3522 (class 0 OID 16463)
-- Dependencies: 220
-- Data for Name: detection_events; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.detection_events (event_id, camera_id, start_time, end_time, detection_type, confidence, severity, alert_sent, created_at) FROM stdin;
\.


--
-- TOC entry 3523 (class 0 OID 16479)
-- Dependencies: 221
-- Data for Name: images; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.images (image_id, camera_id, event_id, image_type, image_path, capture_time, created_at) FROM stdin;
\.


--
-- TOC entry 3524 (class 0 OID 16497)
-- Dependencies: 222
-- Data for Name: notification_logs; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.notification_logs (notification_id, event_id, platform, status, sent_time, response) FROM stdin;
\.


--
-- TOC entry 3520 (class 0 OID 16435)
-- Dependencies: 218
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.users (user_id, username, email, password_hash, role, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3368 (class 2606 OID 16520)
-- Name: camera_status_logs camera_status_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.camera_status_logs
    ADD CONSTRAINT camera_status_logs_pkey PRIMARY KEY (status_log_id);


--
-- TOC entry 3360 (class 2606 OID 16457)
-- Name: cameras cameras_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.cameras
    ADD CONSTRAINT cameras_pkey PRIMARY KEY (camera_id);


--
-- TOC entry 3362 (class 2606 OID 16473)
-- Name: detection_events detection_events_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.detection_events
    ADD CONSTRAINT detection_events_pkey PRIMARY KEY (event_id);


--
-- TOC entry 3364 (class 2606 OID 16486)
-- Name: images images_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.images
    ADD CONSTRAINT images_pkey PRIMARY KEY (image_id);


--
-- TOC entry 3366 (class 2606 OID 16507)
-- Name: notification_logs notification_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.notification_logs
    ADD CONSTRAINT notification_logs_pkey PRIMARY KEY (notification_id);


--
-- TOC entry 3356 (class 2606 OID 16445)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 3358 (class 2606 OID 16443)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 3369 (class 2606 OID 16458)
-- Name: cameras fk_camera_user; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.cameras
    ADD CONSTRAINT fk_camera_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3370 (class 2606 OID 16474)
-- Name: detection_events fk_event_camera; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.detection_events
    ADD CONSTRAINT fk_event_camera FOREIGN KEY (camera_id) REFERENCES public.cameras(camera_id) ON DELETE CASCADE;


--
-- TOC entry 3371 (class 2606 OID 16487)
-- Name: images fk_image_camera; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.images
    ADD CONSTRAINT fk_image_camera FOREIGN KEY (camera_id) REFERENCES public.cameras(camera_id) ON DELETE CASCADE;


--
-- TOC entry 3372 (class 2606 OID 16492)
-- Name: images fk_image_event; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.images
    ADD CONSTRAINT fk_image_event FOREIGN KEY (event_id) REFERENCES public.detection_events(event_id) ON DELETE SET NULL;


--
-- TOC entry 3373 (class 2606 OID 16508)
-- Name: notification_logs fk_notification_event; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.notification_logs
    ADD CONSTRAINT fk_notification_event FOREIGN KEY (event_id) REFERENCES public.detection_events(event_id) ON DELETE CASCADE;


--
-- TOC entry 3374 (class 2606 OID 16521)
-- Name: camera_status_logs fk_status_camera; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.camera_status_logs
    ADD CONSTRAINT fk_status_camera FOREIGN KEY (camera_id) REFERENCES public.cameras(camera_id) ON DELETE CASCADE;


-- Completed on 2026-08-18 18:16:50 UTC

--
-- PostgreSQL database dump complete
--

