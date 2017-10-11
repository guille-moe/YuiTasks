// Dependencies
const Pr2Trello = require("../Pr2Trello/pr_2_trello")();
const request   = require("request");
const expect    = require("chai").expect;
const sinon     = require("sinon");

// Mock
let callback = () => {};
let context = {
  data: {
    user:         "guille-moe",
    trello_key:   "0wwqdkjslh87we89230qwjkhsday8q21",
    trello_token: "1c3db5eb5a9f9dc4a7726b19be97fa0bd2b8aec70a0e2a4b52514bec8f6a8ad2",
    trello_board: "4eea795ec2c5008e270d1e2e",
    trello_list:  "59cd0116971611a3db0f7491"
  },
  body: {
    action: "closed",
    pull_request: {
      merged: true,
      html_url: "https://github.com/guille-moe/YuiTasks/pull/1",
      user: {
        login: "guille-moe"
      }
    }
  }
};
let trelloCards = {
  cards: [
    {id: "a", idList: "pending"},
    {id: "b", idList: "pending"},
    {id: "c", idList: context.data.trello_list},
    {id: "d", idList: context.data.trello_list},
    {id: "e", idList: "pending"}
  ]
};
let described = null;


describe("Pr2Trello", function() {
  beforeEach(function() {
    described = new Pr2Trello(context, callback);
  });

  describe("constructor", function() {
    it("build data structure", function() {
      expect(described.data).to.   eql(context.body);
      expect(described.secret).to. eql(context.data);
      expect(described.respond).to.eql(callback);
      expect(described.cardIds).to.eql([]);
    });
  });

  describe("run", function() {
    it("call getCards when need to move cards", function() {
      sinon.stub(described, "needToClose").returns(true);
      sinon.stub(described, "getCards");
      described.run();

      expect(described.needToClose.called).to.be.true;
      expect(described.getCards.called).to.be.true;
      described.needToClose.restore();
      described.getCards.restore();
    });

    it("respond when no need to move cards", function() {
      described = new Pr2Trello(context, sinon.spy());
      sinon.stub(described, "needToClose").returns(false);
      sinon.stub(described, "getCards");
      described.run();

      expect(described.needToClose.called).to.be.true;
      expect(described.getCards.called).to.be.false;
      expect(described.respond.called).to.be.true;
      described.needToClose.restore();
      described.getCards.restore();
    });
  });

  describe("getCards", function() {
    it("do an http get with params and callback", function(){
      sinon.stub(request, "get").callsFake((opt, cb) => cb(false, {}, {}));
      sinon.spy(described, "getCardsOptions");
      sinon.stub(described, "procCards");

      described.getCards();
      expect(request.get.args[0][0]).to.eql(described.getCardsOptions());
      expect(described.getCardsOptions.called).to.be.true;
      expect(described.procCards.called).to.be.true;

      request.get.restore();
      described.getCardsOptions.restore();
      described.procCards.restore();
    });
  });

  describe("procCards", function() {
    it("throw when an http error occur", function() {
      expect(described.procCards, "lalilulelo").to.throw();
    });

    it("respond null when no cards found", function() {
      sinon.spy(described, "ack");

      described.procCards(false, {}, JSON.stringify({cards: []}));
      expect(described.ack.args[0]).to.eql([null]);
      described.ack.restore();
    });

    it("trigger move cards", function() {
      sinon.spy(described, "cardsToMove");
      sinon.stub(described, "moveCard");

      described.procCards(false, {}, JSON.stringify(trelloCards));
      
      expect(described.cardIds).to.eql(["a","b","e"]);
      expect(described.cardsToMove.called).to.be.true;
      expect(described.moveCard.callCount).to.eql(3); // 3 entry matching cardsToMove see below

      described.cardsToMove.restore();
      described.moveCard.restore();
    })
  });

  describe("moveCard", function() {
    it("request to move trello card to the new list", function() {
      sinon.stub(request, "put").callsFake((opt, cb) => cb());
      sinon.spy(described, "moveCardOptions");

      described.moveCard("lalilulelo");
      expect(described.moveCardOptions.called).to.be.true;
      expect(request.put.args[0][0]).to.eql(described.moveCardOptions("lalilulelo"));

      described.moveCardOptions.restore();
      request.put.restore();
    });
  });

  describe("globalAck", function() {
    it("remove card proc", function() {
      described =  new Pr2Trello(context, callback);
      described.cardIds = ["a","b","e"];

      described.globalAck("a");
      expect(described.cardIds).to.eql(["b","e"]);
    });

    it("respond when no more card", function() {
      described =  new Pr2Trello(context, callback);
      sinon.stub(described, "ack");
      described.cardIds = ["a"];

      described.globalAck("a");
      expect(described.cardIds.length).to.eql(0);
      expect(described.ack.calledWith(true)).to.be.true;
      described.ack.restore();
    });
  });

  describe("cardsToMove", function() {
    it("keep only card to move on the list", function() {
      cardIds = described.cardsToMove(trelloCards);
      expect(cardIds).to.eql(["a","b","e"]);
    });
  });

  // Checkers (return boolean)
  describe("needToClose", function() {
    it("call all checkers", function() {
      const checkers = ["hasMinimalDataStruct", "isMergedPR", "isPRValidOwner", "hasTrelloInfo"];
      for(let check of checkers) {
        sinon.stub(described, check).returns(true);
      }

      expect(described.needToClose()).to.be.true;
      
      for(let check of checkers) {
        expect(described[check].called).to.be.true;
        described[check].restore();
      }
     });
  });

  describe("hasMinimalDataStruct", function() {
    it("check if data received has minimal structure to continue", function() {
      expect(described.hasMinimalDataStruct()).to.be.true;

      const badDescribed = new Pr2Trello({body: {bad_key: true}}, callback);
      expect(badDescribed.hasMinimalDataStruct()).to.be.false;
    });
  });

  describe("isMergedPR", function() {
    it("check if the PR is closed and merged", function() {
      expect(described.isMergedPR()).to.be.true;

      const badDescribed = new Pr2Trello({
        body: {
          action: "closed",
          pull_request: {
            merged: false
          }
        }
      }, callback);
      expect(badDescribed.isMergedPR()).to.be.false;
    });
  });

  describe("isPRValidOwner", function() {
    it("check if PR owner is equal to the user provided", function() {
      expect(described.isPRValidOwner()).to.be.true;

      const badDescribed = new Pr2Trello({
        body: {
          pull_request: {
            user: {
              login: "unknow"
            }
          }
        },
        data: {
          user: "guille-moe"
        }
      }, callback);
      expect(badDescribed.isPRValidOwner()).to.be.false;
    });
  });

  describe("hasTrelloInfo", function() {
    it("check if trello conf is present", function() {
      expect(described.hasTrelloInfo()).to.be.true;

      const badDescribed = new Pr2Trello({
        data: {
          trello_key: "ok",
          trello_token: "ok"
        }
      }, callback);
      expect(badDescribed.hasTrelloInfo()).to.be.false;
    });
  });

  describe("needToMove", function() {
    it("check if trello card is not in the good list", function() {
      expect(described.needToMove({idList: "unknow list"})).to.be.true;
      expect(described.needToMove({idList: context.data.trello_list})).to.be.false;
    });
  });

  // request params
  describe("authParams", function() {
    it("return query string for Trello", function() {
      expect(described.authParams()).to.eql("?key=0wwqdkjslh87we89230qwjkhsday8q21&token=1c3db5eb5a9f9dc4a7726b19be97fa0bd2b8aec70a0e2a4b52514bec8f6a8ad2");
    });
  });

  describe("getCardsOptions", function() {
    it("return options to find cards with PR url", function() {
      expect(described.getCardsOptions()).to.eql({
        url: "https://api.trello.com/1/search?key=0wwqdkjslh87we89230qwjkhsday8q21&token=1c3db5eb5a9f9dc4a7726b19be97fa0bd2b8aec70a0e2a4b52514bec8f6a8ad2",
        qs: {
          query: "/guille-moe/YuiTasks/pull/1",
          idBoards: "4eea795ec2c5008e270d1e2e",
          modelTypes: "cards",
          card_attachments: "true",
          partial: "false"
        }
      });
    });
  });

  describe("moveCardOptions", function() {
    it("return options to move a single card", function() {
      expect(described.moveCardOptions("alpha")).to.eql({
        url: "https://api.trello.com/1/cards/alpha?key=0wwqdkjslh87we89230qwjkhsday8q21&token=1c3db5eb5a9f9dc4a7726b19be97fa0bd2b8aec70a0e2a4b52514bec8f6a8ad2",
        qs: { idList: "59cd0116971611a3db0f7491" }
      });
    });
  });

  // simple response
  describe("ack", function() {
    it("just respond with {ack: a_value}", function() {
      described = new Pr2Trello(context, sinon.spy());
      described.ack("hello");
      expect([null, {ack: "hello"}]).to.eql(described.respond.args[0]);
    })
  });
});
