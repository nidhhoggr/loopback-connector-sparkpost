require('./helpers/init.js');

var loopback = require('loopback'),
    rewire = require("rewire"),
    Connector = rewire('../lib/sparkpost'),
    DataSource = require('loopback-datasource-juggler').DataSource,
    Email, ds;

var apiKey = process.env.apiKey;

var __SparkpostMock__ = {
  Sparkpost: function(apiKey) {
    return {
      apiKey: apiKey,
      messages: {
        send: function(options, success, error) {
          success([{
            email: options.message.to[0].email,
            status: 'sent',
            _id: 'someidofmessage'
          }]);
        }
      }
    }
  }
}

describe('Sparkpost init', function () {
  it('should throw error ', function () {
    expect(function() { new Connector(); }).to.throw();
  });

  it('should have property sparkpost with api key', function () {
        connector = new Connector({ apiKey: apiKey });

    expect(connector).to.have.a.property('sparkpost');
    expect(connector.sparkpost.apiKey).to.equal(apiKey);
  });

  it('should have property sparkpost with api key', function () {
      connector = new Connector({ apiKey: apiKey });

    expect(connector).to.have.a.property('sparkpost');
    expect(connector.sparkpost.apiKey).to.equal(apiKey);
  });
});

describe('Sparkpost message send', function() {

  beforeEach(function() {
    Connector.__set__('Sparkpost', __SparkpostMock__);
    ds = new DataSource({
      connector: Connector,
      apiKey: apiKey
    });

    Email = loopback.Email.extend('testEmail');
    Email.attachTo(ds);
  });

  it('Should send - Email.send', function(done) {
    var msg = {
      from: 'test@testing.co',
      to: 'test2@testing.co',
      subject: 'Test subject',
      text: 'Plain text',
      html: 'Html <b>content</b>'
    };

    Email.send(msg, function(err, result) {
      console.log(err, result);
      console.log(typeof err);
      expect(err).to.equal(null);
      expect(result[0].email).to.equal(msg.to[0].email);
      expect(result[0].status).to.equal('sent');
      expect(result[0]._id).to.not.equal(null)
      done();
    });
  });

  it('Should send - Email.prototype.send', function(done) {
    var msg = {
      from: 'test@testing.co',
      to: 'test2@testing.co',
      subject: 'Test subject',
      text: 'Plain text',
      html: 'Html <b>content</b>'
    };

    var email = new Email(msg);

    email.send(function(err, result) {
      expect(err).to.equal(null);
      expect(result[0].email).to.equal(msg.to[0].email);
      expect(result[0].status).to.equal('sent');
      expect(result[0]._id).to.not.equal(null)
      done();
    });
  });

});
