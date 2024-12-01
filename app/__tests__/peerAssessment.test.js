const { Student, Evaluation } = require("../models");
const controllers = require("../controllers/controllers.js");

jest.mock("../config/db", () => ({
  execute: jest.fn().mockResolvedValue(),
}));
jest.mock("../models");

describe("peer assessment", () => {
  beforeEach(() => {
    Student.findById.mockReset();
    Evaluation.find.mockReset();
    Evaluation.save.mockReset();
  });

  test("select teammate for evaluation", async () => {
    const teammate = { id: 2 };
    const req = { session: { user: { id: 1 } }, params: { id: teammate.id } };
    const res = { render: jest.fn() };
    Evaluation.find.mockResolvedValue([]);
    Student.findById.mockResolvedValue([teammate]);

    await controllers.evaluateTeammate(req, res);

    expect(Evaluation.find).toHaveBeenCalledWith(
      req.session.user.id,
      teammate.id,
    );
    expect(Student.findById).toHaveBeenCalledWith(teammate.id);
    expect(res.render).toHaveBeenCalledWith("Evaluation.ejs", {
      teammate: teammate,
    });
  });

  test("return code 400 if teammate ID is not provided", async () => {
    const req = { session: { user: { id: 1 } }, params: {} };
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };

    await controllers.evaluateTeammate(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("retrieve peer evaluation if one has been already submitted", async () => {
    const teammate = { id: 2 };
    const req = { session: { user: { id: 1 } }, params: { id: teammate.id } };
    const res = { render: jest.fn() };
    const review = {
      Teammate: teammate,
      Cooperation: { score: 1, comments: "" },
      WorkEthic: { score: 1, comments: "" },
      PracticalContribution: null,
      ConceptualContribution: null,
    };
    Student.findById.mockResolvedValue([teammate]);
    Evaluation.find.mockResolvedValue([
      {
        category: "Cooperation",
        score: review.Cooperation.score,
        comment: review.Cooperation.comments,
      },
      {
        category: "WorkEthic",
        score: review.WorkEthic.score,
        comment: review.WorkEthic.comments,
      },
    ]);

    await controllers.evaluateTeammate(req, res);

    expect(res.render).toHaveBeenCalledWith("ViewEvaluation.ejs", { review });
  });

  describe("register in database", () => {
    const res = { render: jest.fn() };
    const teammate = { id: 2 };

    test("cooperation assessment", async () => {
      const req = {
        session: { user: { id: 1 } },
        body: {
          teammateID: teammate.id,
          score_cooperation: 1,
          comment_cooperation: "",
        },
      };

      await controllers.submitEvaluation(req, res);

      expect(Evaluation.save).toHaveBeenCalledWith(1, 2, "Cooperation", 1, "");
      expect(res.render).toHaveBeenCalledWith("Confirmation.ejs", {
        teammate: teammate.id,
      });
    });

    test("work ethic assessment", async () => {
      const req = {
        session: { user: { id: 1 } },
        body: {
          teammateID: teammate.id,
          score_ethics: 1,
          comment_ethics: "",
        },
      };

      await controllers.submitEvaluation(req, res);

      expect(Evaluation.save).toHaveBeenCalledWith(1, 2, "WorkEthic", 1, "");
      expect(res.render).toHaveBeenCalledWith("Confirmation.ejs", {
        teammate: teammate.id,
      });
    });

    test("practical contribution assessment", async () => {
      const req = {
        session: { user: { id: 1 } },
        body: {
          teammateID: teammate.id,
          score_pcontribution: 1,
          comment_pcontribution: "",
        },
      };

      await controllers.submitEvaluation(req, res);

      expect(Evaluation.save).toHaveBeenCalledWith(
        1,
        2,
        "PracticalContribution",
        1,
        "",
      );
      expect(res.render).toHaveBeenCalledWith("Confirmation.ejs", {
        teammate: teammate.id,
      });
    });

    test("conceptual cooperation assessment", async () => {
      const req = {
        session: { user: { id: 1 } },
        body: {
          teammateID: teammate.id,
          score_contribution: 1,
          comment_ccontribution: "",
        },
      };

      await controllers.submitEvaluation(req, res);

      expect(Evaluation.save).toHaveBeenCalledWith(
        1,
        2,
        "ConceptualContribution",
        1,
        "",
      );
      expect(res.render).toHaveBeenCalledWith("Confirmation.ejs", {
        teammate: teammate.id,
      });
    });
  });
});
