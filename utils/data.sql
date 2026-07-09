-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.users (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  name text NOT NULL,
  password text NOT NULL,
  role text NOT NULL DEFAULT 'employee'::text,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.menus (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  category_id bigint NOT NULL,
  name text NOT NULL UNIQUE,
  description text,
  price numeric NOT NULL,
  image_url text NOT NULL,
  CONSTRAINT menus_pkey PRIMARY KEY (id),
  CONSTRAINT menus_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
CREATE TABLE public.transactions (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id bigint NOT NULL,
  subtotal numeric NOT NULL,
  tax_amount numeric NOT NULL,
  total_amount numeric NOT NULL,
  payment_method text NOT NULL,
  status text NOT NULL,
  transactions_date timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.transaction_details (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  menu_id bigint,
  transaction_id bigint,
  quantity integer NOT NULL,
  price numeric NOT NULL,
  subtotal numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT transaction_details_pkey PRIMARY KEY (id),
  CONSTRAINT transaction_details_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id),
  CONSTRAINT transaction_details_menu_id_fkey FOREIGN KEY (menu_id) REFERENCES public.menus(id)
);
CREATE TABLE public.categories (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.ingredients (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL UNIQUE,
  stock_quantity numeric NOT NULL DEFAULT '0'::numeric,
  unit text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  image_url text NOT NULL,
  CONSTRAINT ingredients_pkey PRIMARY KEY (id)
);
CREATE TABLE public.menu_ingredients (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  menu_id bigint NOT NULL,
  ingredient_id bigint NOT NULL,
  quantity_needed numeric NOT NULL DEFAULT '0'::numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT menu_ingredients_pkey PRIMARY KEY (id),
  CONSTRAINT menu_ingredients_menu_id_fkey FOREIGN KEY (menu_id) REFERENCES public.menus(id),
  CONSTRAINT menu_ingredients_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id)
);
CREATE TABLE public.session_tokens (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  used_id bigint,
  token text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT session_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT session_tokens_used_id_fkey FOREIGN KEY (used_id) REFERENCES public.users(id)
);
CREATE TABLE public.attendances (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id bigint NOT NULL,
  attendance_date date NOT NULL,
  check_in_time time without time zone,
  check_out_time time without time zone,
  status text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT attendances_pkey PRIMARY KEY (id),
  CONSTRAINT attendances_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);