create type language_code_iso_639_1 as enum ('en', 'de');

create type exercise_type as enum ('standard', 'multiselect', 'true_or_false', 'ordering', 'prompt');

create type group_member_role as enum ('owner', 'admin', 'member');

create table if not exists users
(
    id                         serial  not null
        constraint users_pkey
            primary key,
    first_name                 varchar not null,
    last_name                  varchar not null,
    hashed_password            varchar not null,
    username                   varchar not null,
    settings_updated_timestamp timestamp
);

create unique index if not exists users_username_uindex
    on users (username);

create table if not exists notes
(
    id                 serial                  not null
        constraint notes_pk
            primary key,
    title              varchar                 not null,
    updated_timestamp  timestamp default now() not null,
    creator_id         integer                 not null
        constraint notes_users_id_fk
            references users
            on update cascade on delete cascade,
    resolved_timestamp timestamp,
    description        varchar,
    start_timestamp    timestamp default now(),
    deadline_timestamp timestamp
);

create unique index if not exists notes_id_uindex
    on notes (id);

create table if not exists exercises
(
    id                            serial                                                        not null
        constraint exercises_pk
            primary key,
    version_timestamp             timestamp                                                     not null,
    title                         varchar                                                       not null,
    creator_id                    integer                                                       not null
        constraint exercises_users_id_fk
            references users
            on update cascade on delete cascade,
    marked_for_deletion_timestamp timestamp,
    language_code                 language_code_iso_639_1 default 'en'::language_code_iso_639_1 not null,
    exercise_type                 exercise_type           default 'standard'::exercise_type     not null
);

create unique index if not exists exercises_id_uindex
    on exercises (id);

create table if not exists experiences
(
    exercise_id            integer           not null
        constraint experiences_exercises_id_fk
            references exercises
            on update cascade on delete cascade,
    learner_id             integer           not null
        constraint experiences_users_id_fk
            references users
            on update cascade on delete cascade,
    correct_streak         integer default 0 not null,
    last_studied_timestamp timestamp,
    suspended_timestamp    timestamp,
    constraint experiences_pk
        primary key (exercise_id, learner_id)
);

create table if not exists labels
(
    id    serial      not null
        constraint label_pk
            primary key,
    title varchar(40) not null
);

create unique index if not exists label_title_uindex
    on labels (title);

create table if not exists exercise_labels
(
    exercise_id integer not null
        constraint exercise_labels_exercises_id_fk
            references exercises
            on update cascade on delete cascade,
    label_id    integer not null
        constraint exercise_labels_labels_id_fk
            references labels
            on update cascade on delete cascade,
    constraint exercise_labels_pk
        primary key (exercise_id, label_id)
);

create table if not exists exercise_filter
(
    id                         serial      not null
        constraint exercise_filter_pk
            primary key,
    title                      varchar(40) not null,
    creator_id                 integer     not null
        constraint exercise_filter_users_id_fk
            references users
            on update cascade on delete cascade,
    exercise_filter_definition jsonb       not null
);

create table if not exists note_labels
(
    note_id  integer not null
        constraint note_labels_notes_id_fk
            references notes
            on update cascade on delete cascade,
    label_id integer not null
        constraint note_labels_labels_id_fk
            references labels
            on update cascade on delete cascade,
    constraint note_labels_pk
        primary key (note_id, label_id)
);

create table if not exists groups
(
    id          serial      not null
        constraint groups_pk
            primary key,
    name        varchar(40) not null,
    description varchar(400)
);

create unique index if not exists groups_name_uindex
    on groups (name);

create table if not exists group_memberships
(
    member_id integer                                              not null
        constraint group_memberships_users_id_fk
            references users
            on update cascade on delete cascade,
    group_id  integer                                              not null
        constraint group_memberships_groups_id_fk_2
            references groups
            on update cascade on delete cascade,
    role      group_member_role default 'owner'::group_member_role not null,
    constraint group_memberships_pk
        primary key (member_id, group_id)
);

create table if not exists group_exercises
(
    group_id    integer not null
        constraint group_exercise_groups_id_fk
            references groups
            on update cascade on delete cascade,
    exercise_id integer not null
        constraint group_exercise_exercises_id_fk
            references exercises
            on update cascade on delete cascade,
    constraint group_exercise_pk
        primary key (group_id, exercise_id)
);
