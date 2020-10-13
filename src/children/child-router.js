const express = require("express");
const ChildService = require("./child-service");
const { requireAuth } = require("../middleware/jwt-auth");

const childRouter = express.Router();
const jsonBodyParser = express.json();

childRouter
  .route("/")
  .get((req, res, next) => {
    ChildService.getAllChildren(req.app.get("db"))
      .then((children) => {
        res.json(children.map(ChildService.serializeChild));
      })
      .catch(next);
  })
  .post(jsonBodyParser, (req, res, next) => {
    const { name, user_id } = req.body;
    const newChild = { name, user_id };

    for (const [key, value] of Object.entries(newChild))
      if (value == null)
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` },
        });

    ChildService.insertChild(req.app.get("db"), newChild)
      .then((child) => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${child.id}`))
          .json(serializeChild(child));
      })
      .catch(next);
  });

childRouter
  .route("/:child_id")
  .all(requireAuth)
  .all(checkChildExists)
  .get((req, res) => {
    res.json(ChildService.serializeChild(res.child));
  });

childRouter
  .route("/:child_id/chores/")
  .all(requireAuth)
  .all(checkChildExists)
  .get((req, res, next) => {
    ChildService.getChildChores(req.app.get("db"), req.params.child_id)
      .then((chores) => {
        res.json(chores.map(ChildService.serializeChildChore));
      })
      .catch(next);
  });

/* async/await syntax for promises */
async function checkChildExists(req, res, next) {
  try {
    const child = await ChildService.getById(
      req.app.get("db"),
      req.params.child_id
    );

    if (!child)
      return res.status(404).json({
        error: `child doesn't exist`,
      });

    res.child = child;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = childRouter;
