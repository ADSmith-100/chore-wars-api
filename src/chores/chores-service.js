const xss = require("xss");

const ChoresService = {
  getAllChores(knex) {
    return knex.select("*").from("chorewars_chores");
  },
  // .from("chorewars_chores AS chore")
  // .select
  //   // "chore.id",
  //   // "chore.user_id",
  //   // "chore.child_id",
  //   // "chore.title",
  //   // "chore.status"
  // );
  // db.raw(`count(DISTINCT chore) AS number_of_chores`),
  //   db.raw(
  //     `json_strip_nulls(
  //       json_build_object(
  //         'id', usr.id,
  //         'email', usr.email,
  //         'date_created', usr.date_created
  //       )
  //     ) AS "parent"`
  //   )
  // )
  // .leftJoin("chorewars_chores AS chore", "chore.id", "chore.child_id")
  // .leftJoin("chorewars_users AS usr", "chore.user_id", "usr.id")
  // .groupBy("chore.id", "usr.id");

  getById(db, id) {
    return db
      .from("chorewars_chores AS chore")
      .select(
        "chore.id",
        "chore.user_id",
        "chore.child_id",
        "chore.title",
        "chore.status",
        db.raw(
          `json_strip_nulls(
            row_to_json(
              (SELECT tmp FROM (
                SELECT
                  usr.id,
                  usr.email,                  
                  usr.date_created
              ) tmp)
            )
          ) AS "user"`
        )
      )
      .leftJoin("chorewars_users AS usr", "chore.user_id", "usr.id")
      .where("chore.id", id)
      .first();
  },

  insertChore(db, newChore) {
    return db
      .insert(newChore)
      .into("chorewars_chores")
      .returning("*")
      .then(([chore]) => chore)
      .then((chore) => ChoresService.getById(db, chore.id));
  },

  updateChore(knex, id, newChoreFields) {
    console.log(newChoreFields);
    console.log(id);
    return knex("chorewars_chores").where({ id }).update(newChoreFields);
  },

  updateAllChores(db) {
    return db
      .into("chorewars_chores")
      .update({ child_id: null, status: false })
      .returning("*");
  },

  updateMultipleChores(db, updates) {
    console.log("updates", updates);
    // [{id:9,child_id:5},{id:10,child_id:6}]
    return updates.map((u) => {
      return db
        .into("chorewars_chores")
        .update("child_id", u.child_id)
        .where("id", u.id)
        .returning("*")
        .then((rows) => rows[0]);
    });
  },

  //so this would work for unassign everything but not shuffle!

  /**
   * UPDATE chorewars_chores
   *  SET child_id=9
   *  WHERE id IN [5,10,500,16]
   *
   *  db.into('chorewars_chores').update([{}])
   */

  // updateAllChores(db, id, updatedChores) {
  //   console.log(updatedChores);
  //   console.log(id);

  //   return db
  //     .update(updatedChores)
  //     .into("chorewars_chores")
  //     .where("chorewars_chores")
  //     .returning("*");
  // },

  // updateAllChores(knex, chores, updatedChores) {
  //   console.log(updatedChores);
  //   return knex("chorewars_chores").update(updatedChores);
  // },

  serializeChore(chore) {
    const { user } = chore;
    return {
      id: chore.id,
      user_id: chore.user_id,
      child_id: chore.child_id,
      title: chore.title,
      status: chore.status,
      // user: {
      //   id: user.id,
      //   email: user.email,
      //   date_created: new Date(user.date_created),
      // },
    };
  },
};

module.exports = ChoresService;
