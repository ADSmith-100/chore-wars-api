const knex = require("knex");
const app = require("../src/app");
const helpers = require("./test-helpers");

describe("Protected endpoints", function () {
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

  beforeEach("insert children", () =>
    helpers.seedChildrenTables(db, testUsers, testChildren, testChores)
  );

  const protectedEndpoints = [
    {
      name: "GET /api/children/:child_id",
      path: "/api/children/1",
      method: supertest(app).get,
    },
    {
      name: "GET /api/children/:child_id/chores",
      path: "/api/children/1/chores",
      method: supertest(app).get,
    },
    {
      name: "POST /api/chores",
      path: "/api/chores",
      method: supertest(app).post,
    },
    {
      name: "PATCH /api/chores/:chore_id",
      path: "/api/chores/",
      method: supertest(app).post,
    },
    {
      name: "POST /api/children",
      path: "/api/children",
      method: supertest(app).post,
    },
    {
      name: "POST /api/auth/refresh",
      path: "/api/auth/refresh",
      method: supertest(app).post,
    },
  ];

  protectedEndpoints.forEach((endpoint) => {
    describe(endpoint.name, () => {
      it(`responds 401 'Missing bearer token' when no bearer token`, () => {
        return endpoint
          .method(endpoint.path)
          .expect(401, { error: `Missing bearer token` });
      });

      it(`responds 401 'Unauthorized request' when invalid JWT secret`, () => {
        const validUser = testUsers[0];
        const invalidSecret = "bad-secret";
        return endpoint
          .method(endpoint.path)
          .set(
            "Authorization",
            helpers.makeAuthHeader(validUser, invalidSecret)
          )
          .expect(401, { error: `Unauthorized request` });
      });

      it(`responds 401 'Unauthorized request' when invalid sub in payload`, () => {
        const invalidUser = { email: "email-not-existy", id: 1 };
        return endpoint
          .method(endpoint.path)
          .set("Authorization", helpers.makeAuthHeader(invalidUser))
          .expect(401, { error: `Unauthorized request` });
      });
    });
  });
});
