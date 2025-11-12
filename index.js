const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 3000;
const cors = require("cors");
require("dotenv").config();

app.use(cors()); // <-- allow all origins
app.use(express.json());

const verifyForebaseToken = async (req, res, next) => {
  // console.log("In the verify middlewere:", req.headers.authorization);
  if (!req.headers.authorization) {
    return res.status(401).send({ message: "UnAuthorized acces" });
  }
  const token = req.headers.authorization.split(" ")[1];
  if (!token) {
    return res.status(401).send({ message: "UnAuthorized acces" });
  }
  // verify id token
  try {
    const tokenInfo = await admin.auth().verifyIdToken(token);
    req.token_email = tokenInfo.email;
    console.log(tokenInfo);
    next();
  } catch {
    return res.status(401).send({ message: "UnAuthorized acces" });
  }
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.iesbwy6.mongodb.net/?appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
app.get("/", (req, res) => {
  res.send("Hello World!");
});
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const db = client.db("onlineLearningDb");
    const popularCollection = db.collection("Popular");
    const allCourseCollection = db.collection("allCourses");
    const enrolledCollection = db.collection("enrolledCourses");
    app.get("/popular", async (req, res) => {
      const result = await popularCollection.find().toArray();
      res.send(result);
    });
    app.get("/all-courses", async (req, res) => {
      const result = await allCourseCollection.find().toArray();
      res.send(result);
    });

    app.post("/all-courses", async (req, res) => {
      const data = req.body;
      console.log(data);
      const result = await allCourseCollection.insertOne(data);
      res.send(result);
    });

    app.get("/course/:id", verifyForebaseToken, async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const result = await allCourseCollection.findOne(query);

      console.log(id);
      res.send(result);
    });
    app.get("/courses", verifyForebaseToken, async (req, res) => {
      const email = req.query.email;
      let query = {};

      if (email) {
        query = { email: email }; // filter only by this user's email
      }

      const cursor = allCourseCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    // DELETE /courses/:id
    app.delete("/courses/:id", async (req, res) => {
      const courseId = req.params.id;
      try {
        const result = await allCourseCollection.deleteOne({
          _id: new ObjectId(courseId),
        });
        if (result.deletedCount === 1) {
          res.status(200).json({ message: "Course deleted successfully" });
        } else {
          res.status(404).json({ message: "Course not found 404" });
        }
      } catch (error) {
        res.status(500).json({ message: "Internal server error" });
      }
    });

    //UPdated course
    // 🟣 Update Course (only if email matches)
    app.put("/courses/:id", async (req, res) => {
      const { id } = req.params;
      const data = req.body;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: data,
      };
      const result = allCourseCollection.updateOne(query, update);

      res.send(result);
    });

    //Enroll courses here
    app.post("/my-enroll", async (req, res) => {
      const data = req.body;
      console.log(data);
      const result = await enrolledCollection.insertOne(data);
      res.send(result);
    });
    app.get("/my-enroll", verifyForebaseToken,async (req, res) => {
      const email = req.query.email;
      let query = {};

      if (email) {
        query = { email: email };
      }

      const cursor = enrolledCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
