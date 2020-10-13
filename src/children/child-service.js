const xss = require("xss");

const ChildService = {
  getAllChildren(db) {
    return db
      .from("chorewars_children AS chi")
      .select(
        "chi.id",
        "chi.user_id",
        "chi.name",

        db.raw(`count(DISTINCT chore) AS number_of_chores`),
        db.raw(
          `json_strip_nulls(
            json_build_object(
              'id', usr.id,
              'email', usr.email,              
              'date_created', usr.date_created              
            )
          ) AS "parent"`
        )
      )
      .leftJoin("chorewars_chores AS chore", "chi.id", "chore.child_id")
      .leftJoin("chorewars_users AS usr", "chi.user_id", "usr.id")
      .groupBy("chi.id", "usr.id");
  },

  getById(db, id) {
    return ChildService.getAllChildren(db).where("chi.id", id).first();
  },

  getChildChores(db, child_id) {
    return db
      .from("chorewars_chores AS chore")
      .select(
        "chore.id",
        "chore.child_id",
        "chore.title",
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
      .where("chore.child_id", child_id)
      .leftJoin("chorewars_users AS usr", "chore.user_id", "usr.id")
      .groupBy("chore.id", "usr.id");
  },

  serializeChild(child) {
    const { parent } = child;
    return {
      id: child.id,
      user_id: child.user_id,
      name: child.name,

      parent: {
        id: parent.id,
        email: parent.email,
        date_created: new Date(parent.date_created),
      },
    };
  },

  serializeChildChore(chore) {
    const { user } = chore;
    return {
      id: chore.id,
      child_id: chore.child_id,
      title: chore.title,
      status: chore.status,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  },
};

module.exports = ChildService;
