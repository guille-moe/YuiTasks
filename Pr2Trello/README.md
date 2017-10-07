# Pr2Trello

A task to move **Trello cards** in a specific **board list** when you merge (and close) a **GitHub PullRequest** (PR).

To choose/assign the cards to move, you need to attach the PR link to the Trello cards.

## How it's work:

When a PR change, GitHub will send a request (webhook) to Pr2Trello task, then Pr2Trello check if the PR is closed and merged, if it is, so task will search your Trello cards with PR url on your board, then Pr2Trello will move all cards found to the list provided, for example a `Done` list.

## Getting started:

Configure the task to your need following the [config options](#task-config-options).

Create a [webhook](https://developer.github.com/webhooks/) for [PR events](https://developer.github.com/v3/activity/events/types/#pullrequestevent) on your GitHub repository.

Now you can attach a PR link to your cards and they move automaticaly !

## Task Config Options:

On Webtask.io you have with this task two way to config:
  1. [`query_string`](https://webtask.io/docs/parameters) to use it simply pass has url query string paramater. ex: `https://yoururl.task/pr2trello?trello_board="598..."&trello_list="598..."`
  2. [`secret` from webtask](https://webtask.io/docs/editor/secrets)

| name | description | recommended type | optional |
| ---- | ----------- | ---------------- | -------- |
| user | your github username to restrict what PR can be processed | `query_string` or `secret` | no |
| trello_board | id of your trello board, ex: `"598c15814ee020bf589d1382"` | `query_string` or `secret` | no |
| trello_list | id of your trello list where you need to move the card, ex: `"598c16b57348b9ce2dcd30e2"`| `query_string` or `secret` | no |
| trello_token | your secret trello token | `secret` | no |
| trello_key | your secret trello key | `secret` | no |
 

## Minimal data required and used to move a card:

This data are provided by the Github PR event webhook.

```
{
  "action": "closed",
  "pull_request": {
    "merged": true,
    "html_url": "https://github.com/guille-moe/YuiTasks/pull/1",
    "user": {
      "login": "guille-moe"
    }
  }
}
```
