"use strict";
const http = require("request@2.81.0");
const URL = require('url');

const TRELLO_URL = "https://api.trello.com/1/";

module.exports = function(context, cb) {
  new Pr2Trello(context, cb).run();
};

class Pr2Trello {
  constructor(context, cb) {
    this.data     = context.body;
    this.secret   = context.data;
    this.respond  = cb;
    this.cardIds = [];
  }

  run() {
    if (this.needToClose()) {
      this.getCards();
    } else {
      this.ack(false);
    }
  }

  getCards() {
    http(this.getCardsOptions(), (error, response, body) => this.procCards(error, response, body));
  }

  procCards(error, response, body) {
    if (error) {
      throw new Error(error);
    }
    this.cardIds = this.cardsToMove(JSON.parse(body));
    if (this.cardIds.length > 0) {
      for(let cardId of this.cardIds) {
        this.moveCard(cardId);
      }
    } else {
      this.ack(null);
    }
  }

  moveCard(cardId) {
    http(this.moveCardOptions(cardId), () => { this.globalAck(cardId) });
  }

  globalAck(cardId) {
    this.cardIds = this.cardIds.filter((id) => { return id != cardId; });
    if (this.cardIds.length == 0) {
      this.ack(true);
    }
  }

  /********#######+++++++=======~~~~~~------~~~~~~=======+++++++#######*******/

  needToClose() {
    return (this.isValidContext() && this.isMergedPR() && this.isPRValidOwner() && this.hasTrelloInfo());
  }

  isValidContext() {
    return !!this.data && !!this.data.action;
  }

  isMergedPR() {
    return this.data.action == "closed" && !!this.data.pull_request.merged;
  }

  isPRValidOwner() {
    return this.data.pull_request.user.login == this.secret.user;
  }

  hasTrelloInfo() {
    return !!this.secret.trello_key && !!this.secret.trello_token && !!this.secret.trello_board && !!this.secret.trello_list;
  }

  needToMove(card) {
    return card.idList != this.secret.trello_list;
  }

  cardsToMove(data) {
    return data.cards.reduce((arr, card) => {
      if (this.needToMove(data)) {
        arr.push(card.id);
        return arr;
      }
    }, []);
  }

  getCardsOptions() {
    return {
      method: "GET",
      url: `${TRELLO_URL}search${this.authParams()}`,
      qs: {
        query: URL.parse(this.data.pull_request.html_url).pathname,
        idBoards: this.secret.trello_board,
        modelTypes: "cards",
        card_attachments: "true",
        partial: "false"
      }
    };
  }

  moveCardOptions(cardId) {
    return {
      method: "PUT",
      url: `${TRELLO_URL}cards/${cardId}${this.authParams()}`,
      qs: { idList: this.secret.trello_list }
    };
  }

  authParams() {
    return `?key=${this.secret.trello_key}&token=${this.secret.trello_token}`;
  }

  ack(val) {
    this.respond(null, {ack: val});
  }
}
