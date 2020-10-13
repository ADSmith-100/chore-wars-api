const xss = require("xss");

const ChoresService = {
  getById(db, id) {
    return db
      .from("chorewars_chores AS chore")
      .select(
        "chore.id",
        "chore.user_id",
        "chore.title",
        "chore.status",
        db.raw(
          `json_strip_nulls(
            row_to_json(
              (SELECT tmp FROM (
                SELECT
                  usr.id,
                  usr.email,                  
                  usr.date_created,
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

  serializeChore(chore) {
    const { user } = chore;
    return {
      id: chore.id,
      user_id: chore.user_id,
      child_id: chore.child_id,
      title: chore.title,
      status: chore.status,
      user: {
        id: user.id,
        email: user.email,
        date_created: new Date(user.date_created),
      },
    };
  },
};

module.exports = ChoresService;
