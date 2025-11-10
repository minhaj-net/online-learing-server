const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 3000;
const cors = require("cors");
require("dotenv").config();

app.use(cors()); // <-- allow all origins
app.use(express.json());

const uri =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.iesbwy6.mongodb.net/?appName=Cluster0`;
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
    await client.connect();

    const db = client.db("onlineLearningDb");
    const popularCollection = db.collection("Popular");
    const allCourseCollection = db.collection("allCourses");
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

    app.get("/course/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const result = await allCourseCollection.findOne(query);

      console.log(id);
      res.send(result);
    });
    app.get("/courses", async (req, res) => {
      const email = req.query.email;
      let query = {};

      if (email) {
        query = { email: email }; // filter only by this user's email
      }

      const cursor = allCourseCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
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
