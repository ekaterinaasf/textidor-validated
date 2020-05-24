const util = require("util");
const path = require("path");
const fs = require("fs");
const tv4 = require("tv4"); //added

const SCHEMA = require("../data/file-schema.json"); //added
const DATA_PATH = path.join(__dirname, "..", "data", "files-data.json"); //added

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const handlers = {
  readAll: async (req, res) => {
    try {
      const dataString = await readFile(DATA_PATH, "utf-8"); //added
      const filesData = JSON.parse(dataString); //added

      const fileNames = filesData.files.map((entry) => ({
        id: entry.id,
        name: entry.name,
      }));

      res.json(fileNames);
    } catch (err) {
      console.log(err);

      if (err && err.code === "ENOENT") {
        res.status(404).end();
        return;
      }

      next(err);
    }
  },
  readOne: async (req, res) => {
    const fileId = req.params.id; //added
    const idToUpdate = Number(fileId); //added

    try {
      const filesDataString = await readFile(DATA_PATH, "utf-8");
      const filesData = JSON.parse(filesDataString);

      const entryWithId = filesData.files.find(
        (entry) => entry.id === idToUpdate
      );

      if (entryWithId) {
        res.json(entryWithId);
      } else {
        res.status(404).end();
      }
    } catch (err) {
      console.log(err);

      if (err && err.code === "ENOENT") {
        res.status(404).end();
        return;
      }

      next(err);
    }
  },
  create: async (req, res) => {
    const newFile = req.body;

    try {
      const filesDataString = await readFile(DATA_PATH, "utf-8");
      const filesData = JSON.parse(filesDataString);

      newFile.id = filesData.nextId; //added
      filesData.nextId++; //added

      const isValid = tv4.validate(newFile, SCHEMA); // added

      if (!isValid) {
        const error = tv4.error;
        console.error(error);

        res.status(400).json({
          error: {
            message: error.message,
            dataPath: error.dataPath,
          },
        });
        return;
      }

      filesData.files.push(newFile);

      const newFileDataString = JSON.stringify(filesData, null, "  ");

      await writeFile(DATA_PATH, newFileDataString); //added

      res.json(newFile);
    } catch (err) {
      console.log(err);

      if (err && err.code === "ENOENT") {
        res.status(404).end();
        return;
      }

      next(err);
    }
  },
  update: async (req, res) => {
    const idToUpdate = Number(req.params.id);

    const newFile = req.body; //added
    newFile.id = idToUpdate; //added
    const isValid = tv4.validate(newFile, SCHEMA); //added

    if (!isValid) {
      const error = tv4.error; //added
      console.error(error);

      res.status(400).json({
        error: {
          message: error.message,
          dataPath: error.dataPath,
        },
      });
      return;
    }

    try {
      const filesDataString = await readFile(DATA_PATH, "utf-8");
      const filesData = JSON.parse(filesDataString);

      const entryToUpdate = filesData.files.find(
        (file) => file.id === idToUpdate
      );

      if (entryToUpdate) {
        const indexOfFile = filesData.files.indexOf(entryToUpdate); //added
        filesData.files[indexOfFile] = newFile; //added

        const newFileDataString = JSON.stringify(filesData, null, "  "); //added

        await writeFile(DATA_PATH, newFileDataString); //added

        res.json(newFile);
      } else {
        res.json(`no entry with id ${idToUpdate}`);
      }
    } catch (err) {
      console.log(err);

      if (err && err.code === "ENOENT") {
        res.status(404).end();
        return;
      }

      next(err);
    }
  },
  delete: async (req, res) => {
    const idToDelete = Number(req.params.id); //added

    try {
      const filesDataString = await readFile(DATA_PATH, "utf-8");
      const filesData = JSON.parse(filesDataString);
      console.log(idToDelete);
      //(file) => file.id === 6 // it works
      const entryToDelete = filesData.files.find(
        (file) => file.id === idToDelete
      );

      console.log(entryToDelete);
      if (entryToDelete) {
        filesData.files = filesData.files.filter(
          (profile) => profile.id !== entryToDelete.id
        );

        const newFileDataString = JSON.stringify(filesData, null, "  ");

        await writeFile(DATA_PATH, newFileDataString);

        res.json(entryToDelete);
      } else {
        res.send(`no entry with id ${idToDelete}`);
      }
    } catch (err) {
      console.log(err);

      if (err && err.code === "ENOENT") {
        res.status(404).end();
        return;
      }

      next(err);
    }
  },
};

module.exports = handlers;
