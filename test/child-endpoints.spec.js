const knex = require("knex");
const supertest = require("supertest");
const app = require("../src/app");
const helpers = require("./test-helpers");

describe("Children Endpoints", function () {
  let db;
  // let authToken;this was tjs way of doing the auth to post stuff.  Not sure if this is the issue or not

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

  // beforeEach("register and signin", () => {
  //   return supertest(app)
  //     .post("/api/users")
  //     .send(testUsers[0])
  //     .then((res) => {
  //       return supertest(app)
  //         .post("/api/auth/login")
  //         .send(testUsers[0])
  //         .then((res2) => {
  //           authToken = res2.body.authToken;
  //         });
  //     });
  // });

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
            .expect(404, { error: `child doesn't exist` });
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
            testChildren[childId - 2],
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
              .expect(404, { error: `child doesn't exist` });
          });
        });

        context("Given there are chores for child in the database", () => {
          beforeEach("insert children", () =>
            helpers.seedChildrenTables(db, testUsers, testChildren, testChores)
          );

          it("responds with 200 and the specified chores", () => {
            const childId = 2;
            const expectedChores = helpers.makeExpectedChildChores(
              testChildren,
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
    describe(`POST /api/children`, () => {
      beforeEach("insert children", () =>
        helpers.seedChildrenTables(db, testUsers, testChildren)
      );

      it(`creates a child, responding with 201 and the new child`, function () {
        this.retries(3);
        const testUser = testUsers[0];
        const newChild = {
          user_id: testUser.id,
          name: "test child",
        };
        return supertest(app)
          .post("/api/children")
          .set("Authorization", helpers.makeAuthHeader(testUsers[0]))
          .send(newChild)
          .expect(201)
          .expect((res) => {
            expect(res.body).to.have.property("id");
            expect(res.body.user_id).to.eql(testUser.id);
            expect(res.body.name).to.eql(newChild.name);
            expect(res.headers.location).to.eql(`/api/children/${res.body.id}`);
          })
          .expect((res) =>
            db
              .from("chorewars_children")
              .select("*")
              .where({ id: res.body.id })
              .first()
              .then((row) => {
                expect(row.user_id).to.eql(testUser.id);
                expect(row.name).to.eql(newChild.name);
              })
          );
      });
    });
  });
});
