const { App, AwsLambdaReceiver } = require('@slack/bolt');

const awsLambdaReceiver = new AwsLambdaReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver: awsLambdaReceiver
});

const formView = {
  "type": "modal",
  "callback_id": "view_form",
  "title": {
    "type": "plain_text",
    "text": "Issue Report"
  },
  "submit": {
    "type": "plain_text",
    "text": "Submit"
  },
  "close": {
    "type": "plain_text",
    "text": "Cancel"
  },
  "blocks": [
    {
      "type": "divider"
    },
    {
      "type": "input",
      "block_id": "input_title",
      "element": {
        "type": "plain_text_input",
        "action_id": "input_title"
      },
      "label": {
        "type": "plain_text",
        "text": "Issue title"
      }
    },
    {
      "type": "input",
      "block_id": "input_desc",
      "element": {
        "type": "plain_text_input",
        "action_id": "input_desc",
        "multiline": true
      },
      "label": {
        "type": "plain_text",
        "text": "Issue description"
      }
    },
    {
      "type": "input",
      "block_id": "input_priority",
      "element": {
        "type": "static_select",
        "placeholder": {
          "type": "plain_text",
          "text": "Select an item",
        },
        "initial_option": {
          "text": {
            "type": "plain_text",
            "text": "P3",
          },
          "value": "P3"
        },
        "options": [
          {
            "text": {
              "type": "plain_text",
              "text": "P1",
            },
            "value": "P1",
          },
          {
            "text": {
              "type": "plain_text",
              "text": "P2"
            },
            "value": "P2"
          },
          {
            "text": {
              "type": "plain_text",
              "text": "P3"
            },
            "value": "P3"
          },
          {
            "text": {
              "type": "plain_text",
              "text": "P4"
            },
            "value": "P4"
          },
          {
            "text": {
              "type": "plain_text",
              "text": "P5"
            },
            "value": "P5"
          }
        ],
        "action_id": "input_priority",
      },
      "label": {
        "type": "plain_text",
        "text": "Priority"
      }
    },
    {
      "type": "input",
      "block_id": "input_time",
      "element": {
        "type": "datetimepicker",
        "action_id": "input_time"
      },
      "label": {
        "type": "plain_text",
        "text": "Time of the incident"
      }
    }
  ]
}

app.shortcut('show_form', async ({ shortcut, ack, client, logger }) => {

  try {
    await ack();

    const result = await client.views.open({
      trigger_id: shortcut.trigger_id,
      view: formView
    });
    logger.info(`View with id:${result['view']['id']} opened.`);
  }
  catch (error) {
    logger.error(error);
  }
});

app.command('/reportissue', async ({ ack, body, client, logger }) => {

  try {
    await ack();

    const result = await client.views.open({
      trigger_id: body.trigger_id,
      view: formView
    });
    logger.info(`View with id:${result['view']['id']} opened.`);
  }
  catch (error) {
    logger.error(error);
  }
});

app.view('view_form', async ({ ack, body, view, client, logger }) => {
  const newView = {
    response_action: 'push',
    view: {
      "type": "modal",
      "clear_on_close": true,
      "callback_id": 'view_submitted',
      "title": {
        "type": "plain_text",
        "text": "Thank You!"
      },
      "close": {
        "type": "plain_text",
        "text": "Close"
      },
      "blocks": [
        {
          "type": "section",
          "text": {
            "type": "plain_text",
            "text": "Your submission was successful"
          },
        }
      ]
    }
  };

  const date = new Date(0)
  date.setUTCSeconds(view['state']['values']['input_time']['input_time'].selected_date_time)
  const payload = {
    message: view['state']['values']['input_title']['input_title'].value,
    description: view['state']['values']['input_desc']['input_desc'].value,
    priority: view['state']['values']['input_priority']['input_priority']['selected_option'].value,
    details: {
      reporter: body['user']['name'] || body['user']['username'],
      incidentDate: date.toUTCString()
    }
  }
  logger.info(payload)
  const axios = require('axios')
  try {
    await ack(newView);

    const response = await axios.post('https://api.opsgenie.com/v1/incidents/create', payload,
      {
        headers: {
          Authorization: `GenieKey ${process.env.GENIE_KEY}`
        }
      })
    logger.info(response)
  }
  catch (error) {
    if (error instanceof axios.AxiosError && error.response) {
      logger.error(error.response.data);
    } else {
      logger.error(error)
    }
  }
});

exports.handler = async (event, context, callback) => {
  const handler = await awsLambdaReceiver.start();
  return handler(event, context, callback);
}

