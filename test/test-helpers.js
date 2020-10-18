const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

function makeUsersArray() {
  return [
    {
      id: 2,
      email: "test-user-1",
      password: "P@ssword1234",
      date_created: new Date("2029-01-22T16:28:32.615Z"),
    },
    {
      id: 3,
      email: "test-user-2",
      password: "password",
      date_created: new Date("2029-01-22T16:28:32.615Z"),
    },
    {
      id: 4,
      email: "test-user-3",
      password: "password",
      date_created: new Date("2029-01-22T16:28:32.615Z"),
    },
    {
      id: 5,
      email: "test-user-4",
      password: "password",
      date_created: new Date("2029-01-22T16:28:32.615Z"),
    },
  ];
}

function makeChoresArray(users, child) {
  return [
    {
      id: 1,
      user_id: users[0].id,
      child_id: child[0].id,
      title: "First test chore!",
      status: false,
    },
    {
      id: 2,
      user_id: users[1].id,
      child_id: child[1].id,
      title: "Second test chore!",
      status: false,
    },
    {
      id: 3,
      user_id: users[2].id,
      child_id: child[2].id,
      title: "Third test chore!",
      status: false,
    },
    {
      id: 4,
      user_id: users[3].id,
      child_id: child[3].id,
      title: "Fourth test chore!",
      status: false,
    },
  ];
}

function makeChildArray(users) {
  return [
    {
      id: 2,
      user_id: users[0].id,
      name: "First test child!",
    },
    {
      id: 3,
      user_id: users[1].id,
      name: "Second test child!",
    },
    {
      id: 4,
      user_id: users[2].id,
      name: "Third test child!",
    },
    {
      id: 5,
      user_id: users[3].id,
      name: "Fourth test child!",
    },
  ];
}

function makeExpectedChores(children, userId, chores) {
  // const expectedChores = chores.filter((chore) => chore.user_id === userId);

  return chores.map((chore) => {
    return {
      id: chore.id,
      user_id: chore.user_id,
      child_id: chore.child_id,
      title: chore.title,
      status: chore.status,
      // parent: {
      //   id: parent.id,
      //   email: parent.email,
      //   date_created: parent.date_created.toISOString(),
      // },
    };
  });
}

function makeExpectedChild(users, child, chores = []) {
  const parent = users.find((user) => user.id === child.user_id);

  const number_of_chores = chores.filter((chore) => chore.child_id === child.id)
    .length;

  return {
    id: child.id,
    user_id: child.user_id,
    name: child.name,
    number_of_chores,
    parent: {
      id: parent.id,
      email: parent.email,
      date_created: parent.date_created.toISOString(),
    },
  };
}

function makeExpectedChildChores(children, childId, chores) {
  const expectedChores = chores.filter((chore) => chore.child_id === childId);

  return expectedChores.map((chore) => {
    const choreChild = children.find((child) => child.id === chore.child_id);

    return {
      id: chore.id,
      user_id: chore.user_id,
      child_id: chore.child_id,
      title: chore.title,
      status: chore.status,

      child: {
        id: choreChild.id,
        user_id: choreChild.user_id,
        name: choreChild.name,
      },
    };
  });
}

// function makeMaliciousArticle(user) {
//   const maliciousArticle = {
//     id: 911,
//     style: "How-to",
//     date_created: new Date(),
//     title: 'Naughty naughty very naughty <script>alert("xss");</script>',
//     author_id: user.id,
//     content: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
//   };
//   const expectedArticle = {
//     ...makeExpectedArticle([user], maliciousArticle),
//     title:
//       'Naughty naughty very naughty &lt;script&gt;alert("xss");&lt;/script&gt;',
//     content: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`,
//   };
//   return {
//     maliciousArticle,
//     expectedArticle,
//   };
// }

function makeChildrenFixtures() {
  const testUsers = makeUsersArray();
  const testChildren = makeChildArray(testUsers);
  const testChores = makeChoresArray(testUsers, testChildren);
  return { testUsers, testChildren, testChores };
}

function cleanTables(db) {
  return db.transaction((trx) =>
    trx
      .raw(
        `TRUNCATE
        chorewars_children,
        chorewars_users,        
        chorewars_chores
      `
      )
      .then(() =>
        Promise.all([
          trx.raw(
            `ALTER SEQUENCE chorewars_children_id_seq minvalue 0 START WITH 1`
          ),
          trx.raw(
            `ALTER SEQUENCE chorewars_users_id_seq minvalue 0 START WITH 1`
          ),
          trx.raw(
            `ALTER SEQUENCE chorewars_chores_id_seq minvalue 0 START WITH 1`
          ),
          trx.raw(`SELECT setval('chorewars_children_id_seq', 0)`),
          trx.raw(`SELECT setval('chorewars_users_id_seq', 0)`),
          trx.raw(`SELECT setval('chorewars_chores_id_seq', 0)`),
        ])
      )
  );
}

function seedUsers(db, users) {
  const preppedUsers = users.map((user) => ({
    ...user,
    password: bcrypt.hashSync(user.password, 1),
  }));
  return db
    .into("chorewars_users")
    .insert(preppedUsers)
    .then(() =>
      // update the auto sequence to stay in sync
      db.raw(`SELECT setval('chorewars_users_id_seq', ?)`, [
        users[users.length - 1].id,
      ])
    );
}

function seedChildrenTables(db, users, children, chores = []) {
  // use a transaction to group the queries and auto rollback on any failure
  return db.transaction(async (trx) => {
    await seedUsers(trx, users);
    await trx.into("chorewars_children").insert(children);
    // update the auto sequence to match the forced id values
    await trx.raw(`SELECT setval('chorewars_children_id_seq', ?)`, [
      children[children.length - 1].id,
    ]);
    // only insert chores if there are some, also update the sequence counter
    if (chores.length) {
      await trx.into("chorewars_chores").insert(chores);
      await trx.raw(`SELECT setval('chorewars_chores_id_seq', ?)`, [
        chores[chores.length - 1].id,
      ]);
    }
  });
}

// function seedMaliciousArticle(db, user, article) {
//   return seedUsers(db, [user]).then(() =>
//     db.into("blogful_articles").insert([article])
//   );
// }

function makeAuthHeader(testUser, secret = process.env.JWT_SECRET) {
  const token = jwt.sign({ email: testUser.email }, secret, {
    subject: testUser.email,
    algorithm: "HS256",
  });
  return `Bearer ${token}`;
}

module.exports = {
  makeUsersArray,
  makeChildArray,
  makeExpectedChores,
  makeExpectedChild,
  makeExpectedChildChores,
  //   makeMaliciousArticle,
  makeChoresArray,

  makeChildrenFixtures,
  cleanTables,
  seedChildrenTables,
  //   seedMaliciousArticle,
  makeAuthHeader,
  seedUsers,
};
