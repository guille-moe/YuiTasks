# JSON2Mail

A task to send JSON receive by Mail.

The email sent looks well in Slack using the forward email address.

## How it's work:

When the task is called, it send the JSON payload by mail.

## Getting started:

Configure the task to your need following the [config options](#task-config-options).

If you want to receive the email on Slack you can activate it in your preferences at: `Messages & Media`.

## Task Config Options:

On Webtask.io you have with this task two way to config:
  1. [`query_string`](https://webtask.io/docs/parameters) to use it simply pass has url query string paramater. ex: `https://yoururl.task/pr2trello?trello_board="598..."&trello_list="598..."`
  2. [`secret` from webtask](https://webtask.io/docs/editor/secrets)

| name | description | recommended type | optional |
| ---- | ----------- | ---------------- | -------- |
| email | your email address where you will receive emails | `secret` | no |

