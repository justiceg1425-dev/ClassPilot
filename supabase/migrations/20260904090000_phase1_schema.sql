-- ClassPilot — Phase 1 schema
-- Supabase / Postgres. Forward-only migration.
-- Every table: RLS enabled, policies in this same file, explicit grants for PostgREST.

create extension if not exists btree_gist;

-- Postgres has no built-in range over `time`. Define one so the timetable
-- overlap exclusion constraint (FR-404) can be enforced in the database.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'timerange') then
    create type timerange as range (subtype = time);
  end if;
end $$;

-- The app_owns_class() helper used by most RLS policies is defined further
-- down, immediately after the `classes` and `schools` tables it queries. A
-- `language sql` function body is validated at CREATE time (check_function_bodies
-- is on by default), so it cannot be declared before those tables exist.

-- ---------------------------------------------------------------------------
-- profiles  (FR-101, FR-105)
-- ---------------------------------------------------------------------------
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text not null check (length(trim(display_name)) between 1 and 100),
  plan_tier     text not null default 'free'
                  check (plan_tier in ('free','essential','integral')),  -- FR-109, simulated
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table profiles enable row level security;
create policy profiles_self on profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- schools  (FR-201)
-- ---------------------------------------------------------------------------
create table schools (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references profiles(id) on delete cascade,
  name       text not null check (length(trim(name)) between 1 and 200),
  address    text,
  created_at timestamptz not null default now()
);
create index schools_owner_idx on schools(owner_id);

alter table schools enable row level security;
create policy schools_owner on schools
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- academic_years  (FR-202)
-- ---------------------------------------------------------------------------
create table academic_years (
  id         uuid primary key default gen_random_uuid(),
  school_id  uuid not null references schools(id) on delete cascade,
  name       text not null,
  starts_on  date not null,
  ends_on    date not null,
  created_at timestamptz not null default now(),
  constraint academic_year_dates check (ends_on > starts_on)
);
create index academic_years_school_idx on academic_years(school_id);

alter table academic_years enable row level security;
create policy academic_years_owner on academic_years
  for all using (
    exists (select 1 from schools s where s.id = school_id and s.owner_id = auth.uid())
  ) with check (
    exists (select 1 from schools s where s.id = school_id and s.owner_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- terms  (FR-203) — must not overlap within a year
-- ---------------------------------------------------------------------------
create table terms (
  id               uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references academic_years(id) on delete cascade,
  name             text not null,
  sequence         smallint not null,
  starts_on        date not null,
  ends_on          date not null,
  constraint term_dates check (ends_on >= starts_on),
  constraint term_no_overlap exclude using gist (
    academic_year_id with =,
    daterange(starts_on, ends_on, '[]') with &&
  ),
  unique (academic_year_id, sequence)
);

alter table terms enable row level security;
create policy terms_owner on terms
  for all using (
    exists (
      select 1 from academic_years ay
      join schools s on s.id = ay.school_id
      where ay.id = academic_year_id and s.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from academic_years ay
      join schools s on s.id = ay.school_id
      where ay.id = academic_year_id and s.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- non_teaching_periods  (FR-204) — holidays, closures
-- ---------------------------------------------------------------------------
create table non_teaching_periods (
  id               uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references academic_years(id) on delete cascade,
  label            text not null,
  starts_on        date not null,
  ends_on          date not null,
  constraint ntp_dates check (ends_on >= starts_on)
);

alter table non_teaching_periods enable row level security;
create policy ntp_owner on non_teaching_periods
  for all using (
    exists (
      select 1 from academic_years ay
      join schools s on s.id = ay.school_id
      where ay.id = academic_year_id and s.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from academic_years ay
      join schools s on s.id = ay.school_id
      where ay.id = academic_year_id and s.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- classes  (FR-205, FR-206, FR-209)
-- ---------------------------------------------------------------------------
create table classes (
  id               uuid primary key default gen_random_uuid(),
  school_id        uuid not null references schools(id) on delete cascade,
  academic_year_id uuid not null references academic_years(id) on delete cascade,
  name             text not null,
  teaching_days    smallint[] not null default '{1,2,3,4,5}',  -- ISO 1=Mon
  day_starts_at    time not null default '08:30',
  day_ends_at      time not null default '15:30',
  default_scale_id uuid,                                        -- set below, FR-803 / OQ-02
  archived         boolean not null default false,
  created_at       timestamptz not null default now(),
  constraint class_day_bounds check (day_ends_at > day_starts_at)
);
create index classes_school_idx on classes(school_id);

alter table classes enable row level security;
create policy classes_owner on classes
  for all using (
    exists (select 1 from schools s where s.id = school_id and s.owner_id = auth.uid())
  ) with check (
    exists (select 1 from schools s where s.id = school_id and s.owner_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- Helper: does the current user own this class (or collaborate on it)?
-- Defined here, after `classes` and `schools`: a `language sql` body is checked
-- against live catalogs at CREATE time. Phase 3 adds class_collaborators; the
-- function is written now so the policies that call it never need rewriting.
-- ---------------------------------------------------------------------------
create or replace function app_owns_class(p_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from classes c
    join schools s on s.id = c.school_id
    where c.id = p_class_id
      and s.owner_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- grade_groups  (FR-206, FR-304) — one per grade level in a multi-grade class
-- ---------------------------------------------------------------------------
create table grade_groups (
  id          uuid primary key default gen_random_uuid(),
  class_id    uuid not null references classes(id) on delete cascade,
  label       text not null,
  grade_level text not null,
  sequence    smallint not null default 0,
  unique (class_id, grade_level)
);

alter table grade_groups enable row level security;
create policy grade_groups_owner on grade_groups
  for all using (app_owns_class(class_id)) with check (app_owns_class(class_id));

-- ---------------------------------------------------------------------------
-- students  (FR-301, FR-303, FR-305)
-- ---------------------------------------------------------------------------
create table students (
  id             uuid primary key default gen_random_uuid(),
  class_id       uuid not null references classes(id) on delete cascade,
  grade_group_id uuid references grade_groups(id) on delete set null,
  first_name     text not null check (length(trim(first_name)) > 0),
  last_name      text not null check (length(trim(last_name)) > 0),
  date_of_birth  date,
  notes          text,
  support_flag   boolean not null default false,
  photo_path     text,
  active         boolean not null default true,
  created_at     timestamptz not null default now()
);
create index students_class_idx on students(class_id);

-- grade group must belong to the same class (see data-model.md)
create or replace function students_grade_group_matches_class()
returns trigger language plpgsql as $$
begin
  if new.grade_group_id is not null then
    if not exists (
      select 1 from grade_groups g
      where g.id = new.grade_group_id and g.class_id = new.class_id
    ) then
      raise exception 'grade_group_id % does not belong to class %',
        new.grade_group_id, new.class_id;
    end if;
  end if;
  return new;
end $$;

create trigger students_grade_group_check
  before insert or update on students
  for each row execute function students_grade_group_matches_class();

alter table students enable row level security;
create policy students_owner on students
  for all using (app_owns_class(class_id)) with check (app_owns_class(class_id));

-- ---------------------------------------------------------------------------
-- student_groups  (FR-309, FR-310)
-- ---------------------------------------------------------------------------
create table student_groups (
  id       uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  name     text not null,
  purpose  text
);

create table student_group_members (
  group_id   uuid not null references student_groups(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  primary key (group_id, student_id)
);

alter table student_groups enable row level security;
create policy student_groups_owner on student_groups
  for all using (app_owns_class(class_id)) with check (app_owns_class(class_id));

alter table student_group_members enable row level security;
create policy student_group_members_owner on student_group_members
  for all using (
    exists (select 1 from student_groups g
            where g.id = group_id and app_owns_class(g.class_id))
  ) with check (
    exists (select 1 from student_groups g
            where g.id = group_id and app_owns_class(g.class_id))
  );

-- ---------------------------------------------------------------------------
-- subjects  (FR-405) — soft delete only
-- ---------------------------------------------------------------------------
create table subjects (
  id          uuid primary key default gen_random_uuid(),
  class_id    uuid not null references classes(id) on delete cascade,
  name        text not null,
  short_label text not null check (length(short_label) between 1 and 6),
  colour      text not null default '#64748B',
  -- NFR-20: printable in greyscale. Distinct luminance is validated in app code.
  active      boolean not null default true,
  unique (class_id, name)
);

alter table subjects enable row level security;
create policy subjects_owner on subjects
  for all using (app_owns_class(class_id)) with check (app_owns_class(class_id));

-- ---------------------------------------------------------------------------
-- timetable_slots  (FR-403, FR-404, FR-407)
-- Validity windows carry mid-year changes. See data-model.md.
-- ---------------------------------------------------------------------------
create table timetable_slots (
  id               uuid primary key default gen_random_uuid(),
  class_id         uuid not null references classes(id) on delete cascade,
  subject_id       uuid not null references subjects(id) on delete restrict,
  grade_group_id   uuid references grade_groups(id) on delete cascade,  -- null = whole class
  day_of_week      smallint not null check (day_of_week between 1 and 7),
  start_time       time not null,
  duration_minutes smallint not null check (duration_minutes between 5 and 480),
  end_time         time generated always as
                     (start_time + make_interval(mins => duration_minutes)) stored,
  valid_from       date not null,
  valid_to         date,
  created_at       timestamptz not null default now(),
  constraint slot_validity check (valid_to is null or valid_to >= valid_from),

  -- FR-404: no overlap for the same class + same grade group + overlapping validity.
  -- A null grade_group_id is coalesced so whole-class slots collide with each other.
  constraint slots_no_overlap exclude using gist (
    class_id with =,
    coalesce(grade_group_id, '00000000-0000-0000-0000-000000000000'::uuid) with =,
    day_of_week with =,
    daterange(valid_from, valid_to, '[]') with &&,
    timerange(start_time, end_time, '[)') with &&
  )
);
create index timetable_slots_class_day_idx on timetable_slots(class_id, day_of_week);

alter table timetable_slots enable row level security;
create policy timetable_slots_owner on timetable_slots
  for all using (app_owns_class(class_id)) with check (app_owns_class(class_id));

-- ---------------------------------------------------------------------------
-- sessions  (FR-501, FR-502, FR-504, FR-506)
-- Materialised lazily. origin: timetable | adhoc | cancelled.
-- ---------------------------------------------------------------------------
create table sessions (
  id               uuid primary key default gen_random_uuid(),
  class_id         uuid not null references classes(id) on delete cascade,
  slot_id          uuid references timetable_slots(id) on delete set null,
  subject_id       uuid references subjects(id) on delete set null,
  grade_group_id   uuid references grade_groups(id) on delete cascade,
  on_date          date not null,
  start_time       time not null,
  duration_minutes smallint not null,
  origin           text not null default 'timetable'
                     check (origin in ('timetable','adhoc','cancelled')),
  objective        text,
  description      text,
  notes            text,
  status           text not null default 'planned'
                     check (status in ('planned','done','partial','not_done')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index sessions_class_date_idx on sessions(class_id, on_date);

-- One materialised row per slot per date. Ad-hoc sessions have a null slot_id
-- and are deliberately NOT constrained -- a teacher may add several to one day.
create unique index sessions_one_per_slot_per_date
  on sessions(class_id, on_date, slot_id)
  where slot_id is not null;

alter table sessions enable row level security;
create policy sessions_owner on sessions
  for all using (app_owns_class(class_id)) with check (app_owns_class(class_id));

-- ---------------------------------------------------------------------------
-- grading_scales  (FR-803, OQ-02) — per class, overridable per assessment
-- ---------------------------------------------------------------------------
create table grading_scales (
  id       uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  name     text not null,
  kind     text not null check (kind in ('numeric','scale','pass_fail','comment')),
  max_value numeric(6,2),                       -- numeric only
  levels   jsonb                                -- scale only: [{code,label,sequence}]
);

alter table grading_scales enable row level security;
create policy grading_scales_owner on grading_scales
  for all using (app_owns_class(class_id)) with check (app_owns_class(class_id));

alter table classes
  add constraint classes_default_scale_fk
  foreign key (default_scale_id) references grading_scales(id) on delete set null;

-- ---------------------------------------------------------------------------
-- assessments  (FR-801)
-- ---------------------------------------------------------------------------
create table assessments (
  id         uuid primary key default gen_random_uuid(),
  class_id   uuid not null references classes(id) on delete cascade,
  subject_id uuid references subjects(id) on delete set null,
  scale_id   uuid not null references grading_scales(id) on delete restrict,
  term_id    uuid references terms(id) on delete set null,
  title      text not null,
  on_date    date not null,
  created_at timestamptz not null default now()
);
create index assessments_class_idx on assessments(class_id);

alter table assessments enable row level security;
create policy assessments_owner on assessments
  for all using (app_owns_class(class_id)) with check (app_owns_class(class_id));

-- ---------------------------------------------------------------------------
-- grades  (FR-805, FR-807)
-- ---------------------------------------------------------------------------
create table grades (
  id            uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references assessments(id) on delete cascade,
  student_id    uuid not null references students(id) on delete cascade,
  numeric_value numeric(6,2),
  level_code    text,
  comment       text,
  exempt        boolean not null default false,   -- excluded from averages
  absent        boolean not null default false,
  updated_at    timestamptz not null default now(),
  unique (assessment_id, student_id),
  constraint grade_has_value check (
    exempt or absent or numeric_value is not null
      or level_code is not null or comment is not null
  )
);

-- a grade's student must belong to the assessment's class
create or replace function grades_student_matches_class()
returns trigger language plpgsql as $$
begin
  if not exists (
    select 1 from assessments a
    join students st on st.id = new.student_id
    where a.id = new.assessment_id and st.class_id = a.class_id
  ) then
    raise exception 'student % is not in the class for assessment %',
      new.student_id, new.assessment_id;
  end if;
  return new;
end $$;

create trigger grades_student_check
  before insert or update on grades
  for each row execute function grades_student_matches_class();

alter table grades enable row level security;
create policy grades_owner on grades
  for all using (
    exists (select 1 from assessments a
            where a.id = assessment_id and app_owns_class(a.class_id))
  ) with check (
    exists (select 1 from assessments a
            where a.id = assessment_id and app_owns_class(a.class_id))
  );

-- ---------------------------------------------------------------------------
-- Explicit PostgREST grants.
-- Required for projects created after 2026-05-30; existing free projects are
-- affected from 2026-10-30. See architecture.md §2.
-- ---------------------------------------------------------------------------
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
