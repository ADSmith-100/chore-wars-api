const knex = require("knex");
const app = require("../src/app");
const helpers = require("./test-helpers");

describe("Children Endpoints", function () {
  let db;

  const {
    testUsers,
    testChildren,
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

  describe(`GET /api/children`, () => {
    context(`Given no children`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app).get("/api/children").expect(200, []);
      });
    });

    context("Given there are children in the database", () => {
      beforeEach("insert children", () =>
        helpers.seedChildrenTables(db, testUsers, testChildren, testChores)
      );

      it("responds with 200 and all of the children", () => {
        const expectedChildren = testChildren.map((child) =>
          helpers.makeExpectedChild(testUsers, child, testChores)
        );
        return supertest(app)
          .get("/api/children")
          .expect(200, expectedChildren);
      });
    });

    // context(`Given an XSS attack article`, () => {
    //   const testUser = helpers.makeUsersArray()[1];
    //   const {
    //     maliciousArticle,
    //     expectedArticle,
    //   } = helpers.makeMaliciousArticle(testUser);

    //   beforeEach("insert malicious article", () => {
    //     return helpers.seedMaliciousArticle(db, testUser, maliciousArticle);
    //   });

    //   it("removes XSS attack content", () => {
    //     return supertest(app)
    //       .get(`/api/articles`)
    //       .expect(200)
    //       .expect((res) => {
    //         expect(res.body[0].title).to.eql(expectedArticle.title);
    //         expect(res.body[0].content).to.eql(expectedArticle.content);
    //       });
    // });
    //   });
    // });

    describe(`GET /api/children/:child_id`, () => {
      context(`Given no children`, () => {
        beforeEach(() => helpers.seedUsers(db, testUsers));

        it(`responds with 404`, () => {
          const childId = 123456;
          return supertest(app)
            .get(`/api/children/${childId}`)
            .set("Authorization", helpers.makeAuthHeader(testUsers[0]))
            .expect(404, { error: `Child doesn't exist` });
        });
      });

      context("Given there are children in the database", () => {
        beforeEach("insert children", () =>
          helpers.seedChildrenTables(db, testUsers, testChildren, testChores)
        );

        it("responds with 200 and the specified child", () => {
          const childId = 2;
          const expectedChild = helpers.makeExpectedChild(
            testUsers,
            testChildren[childId - 1],
            testChores
          );

          return supertest(app)
            .get(`/api/children/${childId}`)
            .set("Authorization", helpers.makeAuthHeader(testUsers[0]))
            .expect(200, expectedChild);
        });
      });

      // // context(`Given an XSS attack article`, () => {
      // //   const testUser = helpers.makeUsersArray()[1];
      // //   const {
      // //     maliciousArticle,
      // //     expectedArticle,
      // //   } = helpers.makeMaliciousArticle(testUser);

      // //   beforeEach("insert malicious article", () => {
      // //     return helpers.seedMaliciousArticle(db, testUser, maliciousArticle);
      // //   });

      // //   it("removes XSS attack content", () => {
      // //     return supertest(app)
      // //       .get(`/api/articles/${maliciousArticle.id}`)
      // //       .set("Authorization", helpers.makeAuthHeader(testUser))
      // //       .expect(200)
      // //       .expect((res) => {
      // //         expect(res.body.title).to.eql(expectedArticle.title);
      // //         expect(res.body.content).to.eql(expectedArticle.content);
      // //       });
      // //   });
      // });
      // });

      describe(`GET /api/children/:child_id/chores`, () => {
        context(`Given no children`, () => {
          beforeEach(() => helpers.seedUsers(db, testUsers));

          it(`responds with 404`, () => {
            const childId = 123456;
            return supertest(app)
              .get(`/api/children/${childId}/chores`)
              .set("Authorization", helpers.makeAuthHeader(testUsers[0]))
              .expect(404, { error: `Child doesn't exist` });
          });
        });

        context("Given there are chores for child in the database", () => {
          beforeEach("insert children", () =>
            helpers.seedChildrenTables(db, testUsers, testChildren, testChores)
          );

          it("responds with 200 and the specified chores", () => {
            const childId = 1;
            const expectedChores = helpers.makeExpectedChildChores(
              testUsers,
              childId,
              testChores
            );

            return supertest(app)
              .get(`/api/children/${childId}/chores`)
              .set("Authorization", helpers.makeAuthHeader(testUsers[0]))
              .expect(200, expectedChores);
          });
        });
      });
    });
  });
});
