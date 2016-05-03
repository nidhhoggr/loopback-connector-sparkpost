## loopback-connector-sparkpost

`loopback-connector-sparkpost` is the Loopback connector module which allow to send emails via Mandrill.

## 1. Installation

````sh
npm install loopback-connector-sparkpost --save
````

## 2. Configuration

datasources.json

    {
        "sparkpost": {
            "connector": "loopback-connector-sparkpost",
            "apikey": "[your api key here]"
        }
    }

model-config.json

    {
        "Email": {
            "dataSource": "sparkpost",
            "public": false
        }
    }

Additionaly you can set defaults

    {
        "sparkpost": {
            "connector": "loopback-connector-sparkpost",
            "apikey": "[your api key here]",
            "defaults": {
                "account": "",
                "inline_css": true
            }
        }
    }

Configuration in JavaScript

    var DataSource = require('loopback-datasource-juggler').DataSource;
    var dsSparkpost = new DataSource('loopback-connector-sparkpost', {
        apikey: '[your api key here]'
    });
    loopback.Email.attachTo(dsSparkpost);

## 3. Use

Basic option same as built in Loopback

    loopback.Email.send({
        to: "test@to.com",
        from: "test@from.com",
        subject: "subject",
        text: "text message",
        html: "html <b>message</b>"
    },
    function(err, result) {
        if(err) {
            console.log('Upppss something crash');
            return;
        }
        console.log(result);
    });

Some advantages - now you can use templates from Sparkpost

    loopback.Email.send({
        to: "test@to.com",
        from: "test@from.com",
        subject: "subject",
        template: {
            name: "signup-confirm",
            content: {
                name: "NewUser Name",
                accountId: "123456"
            }
        }
    },
    function(err, result) {
        if(err) {
            console.log('Upppss something crash');
            return;
        }
        console.log(result);
    });
