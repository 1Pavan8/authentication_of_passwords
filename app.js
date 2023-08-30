const exp = require("express");
const app = exp();
const { open } = require("sqlite");
const path = require("path");
const dbpath = path.join(__dirname, "userData.db");
const bcrypt = require("bcrypt");
const sqlite3 = require("sqlite3");
let db = null;
app.use(exp.json());

const init = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000);
    console.log("start");
  } catch (e) {
    console.log(`ERROR DB: ${e.message}`);
    process.exit(1);
  }
};

init();
app.post("/register/", async (req, resp) => {
  // console.log(req.body);
  const { username, name, password, gender, location } = req.body;
  let hashpw = await bcrypt.hash(password, 10);
  const dbuserq = `SELECT * FROM user WHERE username='${username}';`;
  const dbuser = await db.get(dbuserq);
  if (dbuser === undefined) {
    if (password.length < 5) {
      resp.status(400);
      resp.send("Password is too short");
    } else {
      const registerq = `INSERT INTO user (username,name,password,gender,location) 
            VALUES ('${username}','${name}','${hashpw}','${gender}','${location}');`;
      const dbuser = await db.run(registerq);
      const uid = dbuser.lastID;
      resp.status(200);
      resp.send(`User created successfully`);
    }
  } else {
    resp.status(400);
    resp.send("User already exists");
  }
});

app.post("/login/", async (req, resp) => {
  const { username, password } = req.body;
  const dbuserq = `SELECT * FROM user WHERE username='${username}';`;
  const dbuser = await db.get(dbuserq);
  if (dbuser === undefined) {
    resp.status(400);
    resp.send("Invalid user");
  } else {
    let pwmatch = await bcrypt.compare(password, dbuser.password);
    if (pwmatch) {
      resp.status(200);
      resp.send("Login success!");
    } else {
      resp.status(400);
      resp.send("Invalid password");
    }
  }
});

app.put("/change-password", async (req, resp) => {
  const { username, oldPassword, newPassword } = req.body;
  const dbuserq = `SELECT * FROM user WHERE username='${username}';`;
  const dbuser = await db.get(dbuserq);
  if (dbuser === undefined) {
    resp.status(400);
    resp.send("Invalid User");
  } else {
    let pwmatch = await bcrypt.compare(oldPassword, dbuser.password);
    if (pwmatch) {
      if (newPassword.length < 5) {
        resp.status(400);
        resp.send("Password is too short");
      } else {
        let newhash = await bcrypt.hash(newPassword, 10);
        const updq = `UPDATE user SET password='${newhash}'
        WHERE username='${username}'`;
        await db.run(updq);
        resp.status(200);
        resp.send("Password updated");
      }
    } else {
      resp.status(400);
      resp.send("Invalid current password");
    }
  }
});

module.exports = app;
