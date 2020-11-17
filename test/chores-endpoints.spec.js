const { expect } = require("chai");
const knex = require("knex");
const app = require("../src/app");
const helpers = require("./test-helpers");

describe("Chores Endpoints", function () {
  let db;

  const {
    testChildren,
    testUsers,
    testChores,
  } = helpers.makeChildrenFixtures();

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

  describe(`GET /api/chores`, () => {
    context(`Given no chores`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app).get("/api/chores").expect(200, []);
      });
    });

    context("Given there are chores in the database", () => {
      beforeEach("insert children", () =>
        helpers.seedChildrenTables(db, testUsers, testChildren, testChores)
      );

      it("responds with 200 and all of the chores", () => {
        return supertest(app).get("/api/chores").expect(200, testChores);
      });
    });
  });

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
        status: false,
      };

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
          expect(res.body.status).to.eq(newChore.status);
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
              expect(row.status).to.eql(newChore.status);
            })
        );
    });

    const requiredFields = ["title", "child_id", "status"];

    requiredFields.forEach((field) => {
      const testChild = testChildren[0];
      const testUser = testUsers[0];
      const newChore = {
        title: "Test new chore",
        child_id: testChild.id,
        status: false,
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

  describe(`PUT /api/chores`, () => {
    beforeEach("insert children", () =>
      helpers.seedChildrenTables(db, testUsers, testChildren, testChores)
    );

    it(`nulls all chore children, responding with 201 and all chores`, function () {
      this.retries(3);
      const testChild = testChildren[0];
      const testUser = testUsers[0];
      const testChore = testChores;
      const updatedChores = helpers.makeNullChildChores(testChores);

      const expectedChores = updatedChores;

      return supertest(app)
        .put(`/api/chores`)
        .set("Authorization", helpers.makeAuthHeader(testUser))
        .send(updatedChores)
        .expect(201)
        .then(
          (res) => supertest(app).get(`/api/chores`).expect(expectedChores),
          console.log(expectedChores)
        );
    });
  });
  describe.only(`PATCH /api/chores`, () => {
    beforeEach("insert children", () =>
      helpers.seedChildrenTables(db, testUsers, testChildren, testChores)
    );

    it(`updates all chores, responding with 201 and all chores`, function () {
      this.retries(3);
      const testChild = testChildren[0];
      const testUser = testUsers[0];
      const testChore = testChores;
      const updatedAllChores = helpers.makeUpdatedChores(
        testChores,
        testChildren
      );

      const expectedChores = updatedAllChores;

      return supertest(app)
        .patch(`/api/chores`)
        .set("Authorization", helpers.makeAuthHeader(testUser))
        .send(updatedAllChores)
        .expect(201)
        .then(
          (res) => supertest(app).get(`/api/chores`).expect(expectedChores),
          console.log(expectedChores)
        );
    });
  });

  describe(`PATCH /api/chores/:chore_id`, () => {
    beforeEach("insert children", () =>
      helpers.seedChildrenTables(db, testUsers, testChildren, testChores)
    );

    it(`updates a chore, responding with 201 and the updated chore`, function () {
      this.retries(3);
      const idToUpdate = 2;
      const testChild = testChildren[0];
      const testUser = testUsers[0];
      const testChore = testChores[0];
      const updatedChore = {
        child_id: testChild.id + 1,

        status: true,
      };

      const expectedChore = {
        ...testChores[idToUpdate - 1],
        ...updatedChore,
      };

      return supertest(app)
        .patch(`/api/chores/${idToUpdate}`)
        .set("Authorization", helpers.makeAuthHeader(testUsers[0]))
        .send(updatedChore)
        .expect(201)
        .then((res) =>
          supertest(app).get(`/api/chores/${idToUpdate}`).expect(expectedChore)
        );
    });

    // // .expect((res) => {
    // //   // expect(res.body).to.have.property("id");
    // //   expect(res.body.title).to.eql(updatedChore.title);
    // //   expect(res.body.child_id).to.eql(updatedChore.child_id);
    // //   expect(res.body.user_id).to.eql(updatedChore.user_id);
    // //   expect(res.body.status).to.eq(updatedChore.status);
    // //   expect(res.headers.location).to.eql(`/api/chores/${res.body.id}`);
    // // })

    // // .expect((res) =>
    // //   db
    // //     .from("chorewars_chores")
    // //     .select("*")
    // //     .where({ id: res.body.id })
    // //     .first()
    // //     .then((row) => {
    // //       expect(row.title).to.eql(updatedChore.title);
    // //       expect(row.child_id).to.eql(updatedChore.child_id);
    // //       expect(row.user_id).to.eql(updatedChore.id);
    // //       expect(row.status).to.eql(updatedChore.status);
    // //     })
    // );
  });
});
