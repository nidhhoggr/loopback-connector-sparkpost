require("./helpers/init.js");

var loopback = require("loopback"),
  rewire = require("rewire"),
  sinon = require("sinon"),
  sparkpost = require("sparkpost"),
  Connector = rewire("../lib/sparkpost"),
  DataSource = require("loopback-datasource-juggler").DataSource,
  Email,
  User,
  ds;

var apiKey = process.env.apiKey || "apiKey";

var fromEmail = process.env.fromEmail || "fromEmail";

var __SparkpostMock__ = {
  Sparkpost: function(apiKey) {
    return {
      apiKey: apiKey,
      messages: {
        send: function(options, success, error) {
          success([
            {
              email: options.message.to[0].email,
              status: "sent",
              _id: "someidofmessage"
            }
          ]);
        }
      }
    };
  }
};

describe("Basic Test", function() {

  before(function() {
    sinon.stub(sparkpost.prototype, 'request').callsFake((options, callback) => {
      callback(null, {statusCode: 200, data: {}});
    });
  });
  describe("Sparkpost init", function() {
    it("should throw error ", function() {
      expect(function() {
        new Connector();
      }).to.throw();
    });

    it("should have property sparkpost with api key", function() {
      connector = new Connector({ apiKey: apiKey });
      expect(connector).to.have.a.property("sparkpost");
      expect(connector.sparkpost.apiKey).to.equal(apiKey);
    });

    it("should have property sparkpost with api key", function() {
      connector = new Connector({ apiKey: apiKey });
      expect(connector).to.have.a.property("sparkpost");
      expect(connector.sparkpost.apiKey).to.equal(apiKey);
    });
  });

  describe("Sparkpost message send", function() {
    beforeEach(function() {
      Connector.__set__("Sparkpost", __SparkpostMock__);
      ds = new DataSource({
        connector: Connector,
        apiKey: apiKey,
        defaults: {
          options: {
            start_time: process.env.startTime || "now",
            open_tracking: false,
            click_tracking: false
          }
        }
      });
      let mem = new DataSource({
        connector: 'memory'
      });

      User = loopback.User.extend("testUser");
      User.attachTo(mem);
      Email = loopback.Email.extend("testEmail");
      Email.attachTo(ds);
    });

    it("should contain the correct properties", function() {
      var options = {
        to: "sparkpost.connector.testing@mailinator.com",
        from: fromEmail,
        type: "email",
        content: {
          subject: "Thanks for registering.",
          template: {
            id: "greenback-verify-email"
          }
        },
        options: {
          start_time: new Date(new Date().getTime() + 30 * 60000)
            .toISOString()
            .slice(0, -5)
        }
      };

      var transmissionBody = Email.getTransmissionBody(options);
      expect(transmissionBody.options.start_time).to.equal(
        options.options.start_time
      );
      expect(transmissionBody.options.click_tracking).to.equal(false);
      expect(transmissionBody.options.open_tracking).to.equal(false);
    });

    it("Should send - Email.send", function(done) {
      var msg = {
        from: fromEmail,
        to: "sparkpost.connector.testing@mailinator.com",
        subject: "Test subject",
        text: "Plain text",
        html: "Html <b>content</b>"
      };
      Email.send(msg, (err, data) => {
        done(err);
      });
    });

    it("Should send - Email.prototype.send", function(done) {
      var msg = {
        from: fromEmail,
        to: "sparkpost.connector.testing@mailinator.com",
        subject: "Test subject",
        text: "Plain text",
        html: "Html <b>content</b>"
      };

      var email = new Email(msg);

      email.send((err, result) => {
        expect(err).to.equal(null);
        expect(result.statusCode).to.equal(200);
        done();
      });
    });

    describe("Sparkpost verify loopback user", function() {
      beforeEach(function() {
        process.env.SPARKPOST_API_KEY = 'abckey';
      });

      it("should verify a user and send an email", function(done) {
        User.create(
          { email: "mock-user@example.com", password: "password" },
          (err, user) => {
            var options = {
              type: "email",
              mailer: Email,
              to: user.email,
              from: fromEmail,
              subject: "Thanks for registering.",
              user: user
            };
            user.verify(options, (err, response) => {
              expect(response.email.statusCode).to.equal(200);
              expect(response.token).to.exist;
              done(err);
            });
          }
        );
      });
    });
  });
});
