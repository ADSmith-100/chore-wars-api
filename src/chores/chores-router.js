const express = require("express");
const path = require("path");
const ChoresService = require("./chores-service");
const { requireAuth } = require("../middleware/jwt-auth");

const choresRouter = express.Router();
const jsonBodyParser = express.json();

choresRouter.route("/").post(requireAuth, jsonBodyParser, (req, res, next) => {
  const { user_id, child_id, title, status } = req.body;
  const newChore = { user_id, child_id, title, status };

  for (const [key, value] of Object.entries(newChore))
    if (value == null)
      return res.status(400).json({
        error: `Missing '${key}' in request body`,
      });

  newChore.user_id = req.user.id;

  ChoresService.insertChore(req.app.get("db"), newChore)
    .then((chore) => {
      res
        .status(201)
        .location(path.posix.join(req.originalUrl, `/${chore.id}`))
        .json(ChoresService.serializeChore(chore));
    })
    .catch(next);
});

module.exports = choresRouter;
