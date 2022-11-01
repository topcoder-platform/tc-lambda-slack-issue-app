const { App, AwsLambdaReceiver } = require('@slack/bolt');

const awsLambdaReceiver = new AwsLambdaReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver: awsLambdaReceiver
});

app.shortcut('show_form', async ({ shortcut, ack, client, logger }) => {

  try {
    await ack();

    const result = await client.views.open({
      trigger_id: shortcut.trigger_id,
      view: {
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
            "type": "input",
            "block_id": "input_title",
            "element": {
              "type": "plain_text_input",
              "action_id": "input_title"
            },
            "label": {
              "type": "plain_text",
              "text": "Issue title",
              "emoji": true
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
            "block_id": "input_noticed",
            "element": {
              "type": "plain_text_input",
              "action_id": "input_noticed"
            },
            "label": {
              "type": "plain_text",
              "text": "Flow noticed in"
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
    });
    logger.info(result);
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
  const user = body['user']['id'];
  console.log(view['state']['values']['input_title']['input_title'].value)
  console.log(view['state']['values']['input_desc']['input_desc'].value)
  console.log(view['state']['values']['input_noticed']['input_noticed'].value)
  console.log(view['state']['values']['input_time']['input_time'].selected_date_time)

  try {
    await ack(newView);
  }
  catch (error) {
    logger.error(error);
  }
});

exports.handler = async (event, context, callback) => {
  const handler = await awsLambdaReceiver.start();
  return handler(event, context, callback);
}

