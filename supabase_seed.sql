insert into people (display_name) values
  ('Me'),
  ('Friend');

insert into sections (key, title, sort_order) values
  ('routine', 'Routine', 1),
  ('journal', 'Journal', 2);

with people_ids as (
  select id, display_name from people
),
section_ids as (
  select id, key from sections
)
insert into questions (person_id, section_id, prompt, type, options, sort_order)
select
  p.id,
  s.id,
  q.prompt,
  q.type,
  q.options,
  q.sort_order
from people_ids p
cross join section_ids s
join (
  values
    ('routine', 'Gym', 'checkbox', '{}'::jsonb, 1),
    ('routine', 'Diet good?', 'select', '{"choices": ["good", "ok", "bad"]}'::jsonb, 2),
    ('routine', 'Music practice', 'checkbox', '{}'::jsonb, 3),
    ('routine', 'Water liters', 'number', '{}'::jsonb, 4),
    ('routine', 'Mood', 'rating', '{"min":1,"max":6,"labels":["😞","🙁","😐","🙂","😊","😁"]}'::jsonb, 5),
    ('journal', 'Best thing today?', 'text_short', '{}'::jsonb, 1),
    ('journal', 'What to improve tomorrow?', 'text_short', '{}'::jsonb, 2),
    ('journal', 'Notes', 'text_long', '{}'::jsonb, 3)
) as q(section_key, prompt, type, options, sort_order)
  on q.section_key = s.key;
