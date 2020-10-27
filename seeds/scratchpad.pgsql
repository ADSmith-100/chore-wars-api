--SELECT setval('chorewars_chores_id_seq', COALESCE((SELECT MAX(id)+1 FROM chorewars_chores), 1), false);

--INSERT INTO chorewars_chores (user_id, child_id, title) VALUES (1,NULL,'Test');

SELECT * FROM "chorewars_chores" LIMIT 1000;

