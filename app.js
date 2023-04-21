const express = require("./node_modules/express");
const { open } = require("./node_modules/sqlite");
const sqlite3 = require("sqlite3");
const format = require("./node_modules/date-fns/format");
const path = require("path");
var isValid = require("date-fns/isValid");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "/todoApplication.db");
let db = null;

const initializer = async function () {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server started at port 3000");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};

initializer();

const checkAll = async function (req, res, next) {
  let {
    status = "",
    priority = "",
    search_q = "",
    category = "",
    due_date = "",
    date = "",
  } = req.query;
  let result;
  if (date === "") {
    result = true;
  } else {
    result = isValid(new Date(date));
  }
  let isPriorityProper =
    priority === "" ||
    priority === "HIGH" ||
    priority === "MEDIUM" ||
    priority === "LOW";
  let isStatus =
    status === "" ||
    status === "TO DO" ||
    status === "IN PROGRESS" ||
    status === "DONE";
  let isCategory =
    category === "" ||
    category === "WORK" ||
    category === "HOME" ||
    category === "LEARNING";

  if (isPriorityProper === false) {
    res.status(400);
    res.send("Invalid Todo Priority");
  } else if (isStatus === false) {
    res.status(400);
    res.send("Invalid Todo Status");
  } else if (isCategory === false) {
    res.status(400);
    res.send("Invalid Todo Category");
  } else if (result === false) {
    res.status(400);
    res.send("Invalid Due Date");
  } else {
    next();
  }
};

const checkAllBody = async function (req, res, next) {
  let {
    id = "",
    todo = "",
    status = "",
    priority = "",
    search_q = "",
    category = "",
    dueDate = "",
    date = "",
  } = req.body;
  let result;
  if (dueDate === "") {
    result = true;
  } else {
    result = isValid(new Date(dueDate));
  }
  let isPriorityProper =
    priority === "" ||
    priority === "HIGH" ||
    priority === "MEDIUM" ||
    priority === "LOW";
  let isStatus =
    status === "" ||
    status === "TO DO" ||
    status === "IN PROGRESS" ||
    status === "DONE";
  let isCategory =
    category === "" ||
    category === "WORK" ||
    category === "HOME" ||
    category === "LEARNING";

  if (isPriorityProper === false) {
    res.status(400);
    res.send("Invalid Todo Priority");
  } else if (isStatus === false) {
    res.status(400);
    res.send("Invalid Todo Status");
  } else if (isCategory === false) {
    res.status(400);
    res.send("Invalid Todo Category");
  } else if (result === false) {
    res.status(400);
    res.send("Invalid Due Date");
  } else {
    next();
  }
};

const snakeToCamel = function (object) {
  return {
    id: object.id,
    todo: object.todo,
    priority: object.priority,
    status: object.status,
    category: object.category,
    dueDate: object.due_date,
  };
};

//api 1
app.get("/todos/", checkAll, async (req, res) => {
  let { status = "", priority = "", search_q = "", category = "" } = req.query;
  let query = `SELECT * FROM todo WHERE status LIKE '%${status}%'
  AND priority LIKE '%${priority}%' AND todo LIKE '%${search_q}%'
  AND category LIKE '%${category}%';`;
  let todoList = await db.all(query);
  let newTodoList = [];
  for (let i of todoList) {
    let temp = snakeToCamel(i);
    newTodoList.push(temp);
  }
  res.send(newTodoList);
});

//api 2
app.get("/todos/:todoId/", checkAll, async (req, res) => {
  let { todoId } = req.params;
  let query = `SELECT * FROM todo WHERE id LIKE ${todoId};`;
  let temp = await db.get(query);
  let abc = snakeToCamel(temp);
  res.send(abc);
});

//api 3
app.get("/agenda/", checkAll, async (req, res) => {
  let { date } = req.query;
  const result = format(new Date(date), "yyyy/MM/dd");
  let query = `SELECT * FROM todo WHERE due_date = '${date}';`;
  let todoList = await db.all(query);
  let newTodoList = [];
  for (let i of todoList) {
    let temp = snakeToCamel(i);
    newTodoList.push(temp);
  }
  res.send(newTodoList);
});

//api 4
app.post("/todos/", checkAllBody, async (req, res) => {
  let { id, todo, priority, status, category, dueDate } = req.body;
  let query = `INSERT INTO todo ( id, todo, priority, status, category, due_date)
        VALUES( ${id}, '${todo}', '${priority}', '${status}', '${category}', '${format(
    new Date(dueDate),
    "yyyy/MM/dd"
  )}');`;
  await db.run(query);
  res.send("Todo Successfully Added");
});

//api 5
app.put("/todos/:todoId/", checkAllBody, async (req, res) => {
  let { todoId } = req.params;
  let { status, priority, todo, category, dueDate } = req.body;
  if (status !== undefined) {
    let query = `UPDATE todo
        SET status = '${status}'
        WHERE
            id = ${todoId};`;
    await db.run(query);
    res.send("Status Updated");
  } else if (priority !== undefined) {
    let query = `UPDATE todo
        SET priority = '${priority}'
        WHERE
            id = ${todoId};`;
    await db.run(query);
    res.send("Priority Updated");
  } else if (todo !== undefined) {
    let query = `UPDATE todo
        SET todo = '${todo}'
        WHERE
            id = ${todoId};`;
    await db.run(query);
    res.send("Todo Updated");
  } else if (category !== undefined) {
    let query = `UPDATE todo
        SET category = '${category}'
        WHERE
            id = ${todoId};`;
    await db.run(query);
    res.send("Category Updated");
  } else if (dueDate !== undefined) {
    const result = format(new Date(dueDate), "MM/dd/yyyy");
    let query = `UPDATE todo
        SET due_date = '${result}'
        WHERE
            id = ${todoId};`;
    await db.run(query);
    res.send("Due Date Updated");
  }
});

//api 6
app.delete("/todos/:todoId/", checkAll, async (req, res) => {
  let { todoId } = req.params;
  let query = `DELETE FROM todo
        WHERE id = ${todoId};`;
  await db.run(query);
  res.send("Todo Deleted");
});

module.exports = app;
