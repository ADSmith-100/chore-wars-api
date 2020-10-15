BEGIN;

TRUNCATE
  chorewars_children,
  chorewars_chores,
  chorewars_users
  RESTART IDENTITY CASCADE;

  INSERT INTO chorewars_users (email, password, date_created)
VALUES
  ('demo@demo.com', '$2a$04$TsJMUCYwQjMIYgwzp4reUuQ0iBU67tKzk3G.Kr1Sa57Ui0TdeyZve', '2020-09-29T00:00:00');

  INSERT INTO chorewars_children (id, user_id, name)
VALUES
  (1, 1, 'Larry'),
  (2, 1, 'Curly'),
  (3, 1, 'Moe');

  INSERT INTO chorewars_chores (id, user_id, child_id, title, status)
VALUES
    (1, 1, 1, 'Sweep', FALSE),
    (2, 1, 1, 'Dishes', FALSE),
    (3, 1, 1, 'Mow Grass', FALSE),
    (4, 1, 2, 'Vacuum', FALSE),
    (5, 1, 2, 'Polish Silver', FALSE),
    (6, 1, 2, 'Take Out Trash', FALSE),
    (7, 1, 3, 'Paint Chicken Coop', FALSE),
    (8, 1, 3, 'Feed Chickens', FALSE),
    (9, 1, 3, 'Wash Car', FALSE);

  COMMIT;  