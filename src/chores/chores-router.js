const express = require("express");
const path = require("path");
const ChoresService = require("./chores-service");
const { requireAuth } = require("../middleware/jwt-auth");

const choresRouter = express.Router();
const jsonBodyParser = express.json();

choresRouter
  .route("/")
  .get((req, res, next) => {
    const knexInstance = req.app.get("db");
    ChoresService.getAllChores(knexInstance)
      .then((chore) => {
        res.json(chore.map(ChoresService.serializeChore));
      })
      .catch(next);
  })

  .post(requireAuth, jsonBodyParser, (req, res, next) => {
    const { child_id, title, status } = req.body;
    const newChore = { child_id, title, status };

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
  })
  .put(requireAuth, jsonBodyParser, (req, res, next) => {
    const chores = req.body;

    const newChores = chores;

    // if (value == null)
    //   return res.status(400).json({
    //     error: `Missing request body`,
    //   });

    // newChores.user_id = req.user.id;
    // newChores.title = req.title;

    ChoresService.updateAllChores(req.app.get("db"), req.params, newChores)
      .then((chores) => {
        res.status(201).json(chores);
        console.log(newChores);
      })
      .catch(next);
  });

choresRouter
  .route("/:chore_id")
  .all((req, res, next) => {
    ChoresService.getById(req.app.get("db"), req.params.chore_id)
      .then((chore) => {
        if (!chore) {
          return res.status(404).json({
            error: { message: `Chore doesn't exist` },
          });
        }
        res.chore = chore; // save the note for the next middleware
        next(); // don't forget to call next so the next middleware happens!
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.json({
      id: res.chore.id,
      user_id: res.chore.child_id,
      child_id: res.chore.child_id,
      title: res.chore.title,
      status: res.chore.status,
    });
  })

  .patch(jsonBodyParser, (req, res, next) => {
    const { child_id, status } = req.body;
    const choreToUpdate = { child_id, status };
    // const numberOfValues = Object.values(choreToUpdate).filter(Boolean).length;
    // if (numberOfValues === 0) {
    //   return res.status(400).json({
    //     error: {
    //       message: `Request body must contain either 'child_id', or 'status'`,
    //     },
    //   });
    // }
    ChoresService.updateChore(
      req.app.get("db"),
      req.params.chore_id,
      choreToUpdate
    )
      .then((numRowsAffected) => {
        res.status(201).end();
      })
      .catch(next);
  });

module.exports = choresRouter;
