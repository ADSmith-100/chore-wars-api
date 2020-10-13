const knex = require("knex");
const app = require("../src/app");
const helpers = require("./test-helpers");

describe("Chores Endpoints", function () {
  let db;

  const { testChildren, testUsers } = helpers.makeChildrenFixtures();

  before("make knex instance", () => {
    db = knex({
      client: "pg",
      connection: process.env.TEST_DATABASE_URL,
    });
    app.set("db", db);
  });

  after("disconnect from db", () => db.destroy());

  before("cleanup", () => helpers.cleanTables(db));

  afterEach("cleanup", () => helpers.cleanTables(db));

  describe(`POST /api/chores`, () => {
    beforeEach("insert children", () =>
      helpers.seedChildrenTables(db, testUsers, testChildren)
    );

    it(`creates a chore, responding with 201 and the new chore`, function () {
      this.retries(3);
      const testChild = testChildren[0];
      const testUser = testUsers[0];
      const newChore = {
        user_id: testChild.user_id,
        child_id: testChild.id,
        title: "Test new chore",
        status: "FALSE",
      };
      console.log(newChore);
      return supertest(app)
        .post("/api/chores")
        .set("Authorization", helpers.makeAuthHeader(testUsers[0]))
        .send(newChore)
        .expect(201)
        .expect((res) => {
          expect(res.body).to.have.property("id");
          expect(res.body.title).to.eql(newChore.title);
          expect(res.body.child_id).to.eql(newChore.child_id);
          expect(res.body.user_id).to.eql(newChore.user_id);
          expect(res.headers.location).to.eql(`/api/chores/${res.body.id}`);
        })

        .expect((res) =>
          db
            .from("chorewars_chores")
            .select("*")
            .where({ id: res.body.id })
            .first()
            .then((row) => {
              expect(row.title).to.eql(newChore.title);
              expect(row.child_id).to.eql(newChore.child_id);
              expect(row.user_id).to.eql(testUser.id);
            })
        );
    });

    const requiredFields = ["title", "user_id", "child_id"];

    requiredFields.forEach((field) => {
      const testChild = testChildren[0];
      const testUser = testUsers[0];
      const newChore = {
        title: "Test new chore",
        child_id: testChild.id,
        user_id: testChild.user_id,
      };

      it(`responds with 400 and an error message when the '${field}' is missing`, () => {
        delete newChore[field];

        return supertest(app)
          .post("/api/chores")
          .set("Authorization", helpers.makeAuthHeader(testUser))
          .send(newChore)
          .expect(400, {
            error: `Missing '${field}' in request body`,
          });
      });
    });
  });
});
