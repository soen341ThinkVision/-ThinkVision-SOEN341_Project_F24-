const router = require("express").Router();
const multer = require("multer");
const controllers = require("../controllers/controllers.js");

// Sets up file storage and naming
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./");
  },
  filename: function (req, file, cb) {
    cb(null, "students.csv");
  },
});
const upload = multer({ storage: storage, limits: { fileSize: 10000000 } });

// Home page
router.get("/", controllers.homePage);

// Handles student and teacher registration
router
  .route("/sign-up")
  .get((req, res) => res.render("SignUp.ejs"))
  .put(controllers.register);

// Handles user login
router
  .route("/login")
  .get((req, res) => res.render("Login.ejs"))
  .post(controllers.signIn);

// Logouts user and redirects to homepage
router.get("/logout", (req, res) => req.session.destroy(res.redirect("/")));

// Handles uploading course roster
router
  .route("/upload/:uploaded")
  .get((req, res) => res.render("Upload.ejs", req.params))
  .post(upload.single("file"), controllers.uploadFile);

// Handles team assignment
router
  .route("/assign-teams")
  .get(controllers.teamAssignment)
  .put(controllers.assignOneStudent)
  .post(controllers.assignAllStudents);

// Shows a student's teammates
router.get("/teammates", controllers.showTeammates);

// Shows all teams
router.get("/teams", controllers.showAllTeams);

// Handles teammate evaluation
router
  .route("/evaluate/:id")
  .get(controllers.evaluateTeammate)
  .post(controllers.submitEvaluation);

module.exports = router;
