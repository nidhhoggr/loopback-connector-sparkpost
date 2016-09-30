/**
 * Dependencies
 */


var SparkPost = require('sparkpost'),
  assert = require('assert'),
  loopback = require('../../loopback'),
  _ = require('lodash'),
  Q = require('q');

/**
 * Export the connector class
 */

module.exports = SparkpostConnector;

/**
 * Configure and create an instance of the connector
 */

function SparkpostConnector(settings) {

  assert(typeof settings === 'object', 'cannot init connector without settings');

  if (loopback.isServer) {
    this.sparkpost = new SparkPost(settings.apiKey);
  }
}

SparkpostConnector.initialize = function (dataSource, callback) {

  dataSource.connector = new SparkpostConnector(dataSource.settings);
  callback();
};

SparkpostConnector.prototype.DataAccessObject = Mailer;

function Mailer() {

}


/**
 * Send transactional email with options
 *
 * Basic options:
 *
 * {
 *   from: { name: "evenemento", email: "crew@testing.co" },
 *   to: "hello@testing.co",
 *   subject: "Ho ho",
 *   text: "Plain text message",
 *   html: "<b>Html messages</b> put here"
 * }
 *
 * Full list of options are available here:
 * https://sparkpostapp.com/api/docs/messages.nodejs.html#method=send
 *
 * if option `template' is set than message will be send as template:
 *
 * {
 *   from: { name: "evenemento", email: "crew@testing.co" },
 *   to: "hello@testing.co",
 *   subject: "Ho ho",
 *   template: {
 *      id: "signup-confirm",
 *      content: {
 *        name: "NewUser Name",
 *        accountId: "123456"
 *      }
 *   }
 * }
 *
 *
 * @param {Object} options
 * @param {Function} callback
 */

Mailer.send = function (options, cb) {
  var dataSource = this.dataSource,
    settings = dataSource && dataSource.settings,
    connector = dataSource.connector,
    deferred = Q.defer();

  if (options.__data) {
    options = _.clone(options.__data);
  }
  else {
    options = _.clone(options);
  }

  var fn = function (err, result) {
    if (err) {
      deferred.reject(err);
    }
    else {
      deferred.resolve(result);
    }
    cb && cb(err, result);
  };

  assert(connector, 'Cannot send mail without a connector!');

  if (connector.sparkpost) {

    if (_.isString(options.to)) {
      options.to = options.to.split(',');

      options.to.forEach(function (email, index) {
        options.to[index] = { address: { email: email } };
      });
    }
    else if (_.isObject(options.to)) {
      options.to = [options.to];
    }

    if (_.isString(options.from)) {
      options.from = { email: options.from }
    }

    var sparkpostMessage = {
      transmissionBody: {
        campaignId: options.campaignId,
        content: {
          from: options.from
        },
        num_rcpt_errors: 3,
        recipients: options.to
      }
    };

    if (options.template) {
      sparkpostMessage.transmissionBody.substitution_data = options.template.content || [];
      sparkpostMessage.transmissionBody.template_id = options.template.id;
    }

    _.extend(sparkpostMessage.transmissionBody, settings.defaults);
    _.extend(sparkpostMessage.transmissionBody.content, options);
   
    connector.sparkpost.transmissions.send(sparkpostMessage, function(err, res) {
      if (err) {
        fn(err, null);
      } else {
        fn(null, res);
      }
    });

  } else {
    console.warn('Warning: no connectiom with Sparkpost');
    process.nextTick(function () {
      fn(null, options);
    });
  }
  return deferred.promise;
};

/**
 * Send an email instance using instance
 */

Mailer.prototype.send = function (fn) {
  return this.constructor.send(this, fn);
};

