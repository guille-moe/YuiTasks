// Dependencies
const nodemailer = require("nodemailer");
const JSON2Mail  = require("../JSON2Mail/json_2_mail")();
const expect     = require("chai").expect;
const sinon      = require("sinon");

// Mock
const callback = sinon.spy();
const context  = {
  data: {
    email: "test@lalilulel.ooo"
  },
  headers: {
    "Request URL":       "https://wt-coder-guille-moe-0.run.webtask.io/Pr2Trello?trello_board=598c15814ee020bf589d1381&trello_list_name=Done",
    "Request method":    "POST",
    "content-type":      "application/json",
    "Expect":            "",
    "User-Agent":        "GitHub-Hookshot/3cf879e",
    "X-GitHub-Delivery": "7595d1a0-c6e6-11e7-881f-c7ed397364e0",
    "X-GitHub-Event":    "pull_request"
  },
  body: {
    "action": "closed",
    "number": 7,
    "pull_request": {
      "url": "https://api.github.com/repos/guille-moe/YuiTasks/pulls/7",
      "head": {
        "label": "guille-moe:feature/user_optional",
        "repo": {
          "name": "YuiTasks",
          "owner": {
            "login": "guille-moe"
          }
        }
      }
    }
  }
}
let described = null;

describe("JSON2Mail", function() {
  beforeEach(function() {
    described = new JSON2Mail(context, callback);
  });

  describe("constructor", function() {
    it("create data structure", function() {
      expect(described.respond).to.eql(callback);
      expect(described.headers).to.eql(context.headers);
      expect(described.payload).to.eql(context.body);
      expect(described.email).to.  eql(context.data.email);
    });
  });

  describe("run", function() {
    it("send mail when data canSend present", function() {
      sinon.stub(described, "canSend").returns(true);
      sinon.stub(described, "sendMail");

      described.run();

      expect(described.canSend.called).to .be.true;
      expect(described.sendMail.called).to.be.true;
    });

    it("never send mail when data are invalid", function() {
      sinon.stub(described, "canSend").returns(false);
      sinon.stub(described, "sendMail");
      sinon.stub(described, "nack");

      described.run();

      expect(described.canSend.called).to .be.true;
      expect(described.sendMail.called).to.be.false;
      expect(described.nack.called).to    .be.true
    });
  });

  describe("sendMail", function() {
      it("sendMail using nodemailer with renderHTML", function() {
        const nodeSendMail = sinon.spy();
        sinon.stub(nodemailer, "createTransport").returns({sendMail: nodeSendMail});
        sinon.stub(described, "renderHTML").returns("<h1>Lalilulelo</h1>");

        described.sendMail();

        expect(nodemailer.createTransport.called).to.be.true;
        expect(described.renderHTML.called).to      .be.true

        const mailArgs = nodeSendMail.args[0][0];
        expect(mailArgs.html).to.eql("<h1>Lalilulelo</h1>");
        expect(mailArgs.to).to  .eql("test@lalilulel.ooo");
        nodemailer.createTransport.restore();
      });
  });

  describe("renderHTML", function() {
    it("call renderHeaders and renderPayload", function() {
      sinon.stub(described, "renderHeaders").returns("lali");
      sinon.stub(described, "renderPayload").returns("lulelo");

      const html = described.renderHTML();

      expect(described.renderHeaders.called).to.be.true;
      expect(described.renderPayload.called).to.be.true;
      expect(html).to.include("lali");
      expect(html).to.include("lulelo");
    });
  });

  describe("renderHeaders", function() {
    it("call renderHeadersRows", function() {
      sinon.stub(described, "renderHeadersRows");

      described.renderHeaders();

      expect(described.renderHeadersRows.called).to.be.true;
    });

    it("create basic template title and table", function() {
        const htmlHeaders = described.renderHeaders();
        expect(htmlHeaders).to.include("Headers");
        expect(htmlHeaders).to.include("<table>");
        expect(htmlHeaders).to.include("</table>");
        expect(htmlHeaders).to.include("<tbody>");
        expect(htmlHeaders).to.include("</tbody>");
    });
  });

  describe("renderHeadersRows", function() {
    it("call renderHeadersRow for each headers prop", function() {
      sinon.stub(described, "renderHeadersRow").returns("8");

      const rows = described.renderHeadersRows();

      expect(described.renderHeadersRow.callCount).to.eql(7);
      expect(rows).to                                .eql("8888888");
    });
  });

  describe("renderHeadersRow", function() {
    it("return a html row with headers data", function() {
      const html = described.renderHeadersRow("Lalilulelo", "Patriot");

      expect(html).to.include("<tr>");
      expect(html).to.include("Lalilulelo");
      expect(html).to.include("Patriot");
    });
  });

  describe("renderPayload", function() {
    it("return an html with payload data", function() {
      const oldFn = JSON.stringify;
      sinon.stub(JSON, "stringify").callsFake(oldFn);

      const html = described.renderPayload();

      expect(JSON.stringify.calledWith(described.payload, null, '  ')).to.be.true
      expect(html).to.include('"login": "guille-moe"');

      JSON.stringify.restore();
    });
  });

  describe("canSend", function() {
    it("return true when all data are present", function() {
      expect(described.canSend()).to.be.true;
    });

    it("return false when no headers are present", function() {
      const newContext = Object.assign({}, context, {"headers": null});
      described = new JSON2Mail(newContext, callback);
      expect(described.canSend()).to.be.false;
    });

    it("return false when no body are present", function() {
      const newContext = Object.assign({}, context, {"body": null});
      described = new JSON2Mail(newContext, callback);
      expect(described.canSend()).to.be.false;
    });

    it("return false when no email are present", function() {
      const newContext = Object.assign({}, context, {"data": {}});
      described = new JSON2Mail(newContext, callback);
      expect(described.canSend()).to.be.false;
    });
  });

  // simple success response
  describe("ack", function() {
    it("just respond with {ack: a_value}", function() {
      described.ack("hello");
      expect(described.respond.args[0]).to.eql([null, {ack: "hello"}]);
      described.respond.reset();
    });
  });

  // simple error response
  describe("nack", function() {
    it("just respond with {nack: a_value}", function() {
      described.nack("nello");
      expect(described.respond.args[0]).to.eql([null, {nack: "nello"}]);
      described.respond.reset();
    });
  });
});
